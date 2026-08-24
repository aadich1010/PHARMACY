import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_MEDICINES,
  INITIAL_BATCHES,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_TRANSFERS,
  INITIAL_PURCHASE_ORDERS,
} from "../data/initialData";
import {
  Tenant,
  Medicine,
  InventoryBatch,
  Sale,
  StockTransfer,
  PurchaseOrder,
  Customer,
  Supplier,
  AppUser,
} from "../types";

/**
 * A minimal table abstraction. The pharmacy dataset is small, so reads fetch the
 * whole table and any tenant/medicine filtering happens in JS (exactly like the
 * original in-memory server did). Two backends implement this interface:
 *   - SupabaseTable: persists to Postgres (used when SUPABASE_URL + key are set)
 *   - MemoryTable:   in-process arrays seeded from initialData.ts (local fallback)
 */
export interface Table<T extends { id: string }> {
  all(): Promise<T[]>;
  insert(row: T): Promise<T>;
  insertMany(rows: T[]): Promise<void>;
  update(id: string, patch: Partial<T>): Promise<T | null>;
}

export interface Store {
  tenants: Table<Tenant>;
  users: Table<AppUser>;
  medicines: Table<Medicine>;
  batches: Table<InventoryBatch>;
  suppliers: Table<Supplier>;
  customers: Table<Customer>;
  sales: Table<Sale>;
  transfers: Table<StockTransfer>;
  purchaseOrders: Table<PurchaseOrder>;
}

// ---------------------------------------------------------------------------
// In-memory backend (local dev / no-Supabase fallback)
// ---------------------------------------------------------------------------
class MemoryTable<T extends { id: string }> implements Table<T> {
  private rows: T[];
  constructor(seed: T[]) {
    this.rows = seed.map((r) => ({ ...r }));
  }
  async all(): Promise<T[]> {
    return this.rows;
  }
  async insert(row: T): Promise<T> {
    this.rows.push(row);
    return row;
  }
  async insertMany(rows: T[]): Promise<void> {
    this.rows.push(...rows);
  }
  async update(id: string, patch: Partial<T>): Promise<T | null> {
    const i = this.rows.findIndex((r) => r.id === id);
    if (i === -1) return null;
    this.rows[i] = { ...this.rows[i], ...patch };
    return this.rows[i];
  }
}

// ---------------------------------------------------------------------------
// Supabase (Postgres) backend. Each table is `(id text primary key, data jsonb)`
// so the stored shape is identical to the TypeScript type — no column mapping.
// ---------------------------------------------------------------------------
class SupabaseTable<T extends { id: string }> implements Table<T> {
  constructor(private sb: SupabaseClient, private name: string) {}

  async all(): Promise<T[]> {
    const { data, error } = await this.sb.from(this.name).select("data");
    if (error) throw new Error(`[${this.name}.all] ${error.message}`);
    return (data || []).map((r: any) => r.data as T);
  }

  async insert(row: T): Promise<T> {
    const { error } = await this.sb.from(this.name).insert({ id: row.id, data: row });
    if (error) throw new Error(`[${this.name}.insert] ${error.message}`);
    return row;
  }

  async insertMany(rows: T[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.sb
      .from(this.name)
      .insert(rows.map((r) => ({ id: r.id, data: r })));
    if (error) throw new Error(`[${this.name}.insertMany] ${error.message}`);
  }

  async update(id: string, patch: Partial<T>): Promise<T | null> {
    const { data: existing, error: e1 } = await this.sb
      .from(this.name)
      .select("data")
      .eq("id", id)
      .maybeSingle();
    if (e1) throw new Error(`[${this.name}.update.read] ${e1.message}`);
    if (!existing) return null;
    const merged = { ...(existing.data as T), ...patch } as T;
    const { error: e2 } = await this.sb.from(this.name).update({ data: merged }).eq("id", id);
    if (e2) throw new Error(`[${this.name}.update.write] ${e2.message}`);
    return merged;
  }
}

// ---------------------------------------------------------------------------
// Store selection + one-time seeding
// ---------------------------------------------------------------------------
let cachedStore: Store | null = null;
let readyPromise: Promise<void> | null = null;

function buildSupabaseStore(sb: SupabaseClient): Store {
  return {
    tenants: new SupabaseTable<Tenant>(sb, "tenants"),
    users: new SupabaseTable<AppUser>(sb, "users"),
    medicines: new SupabaseTable<Medicine>(sb, "medicines"),
    batches: new SupabaseTable<InventoryBatch>(sb, "batches"),
    suppliers: new SupabaseTable<Supplier>(sb, "suppliers"),
    customers: new SupabaseTable<Customer>(sb, "customers"),
    sales: new SupabaseTable<Sale>(sb, "sales"),
    transfers: new SupabaseTable<StockTransfer>(sb, "transfers"),
    purchaseOrders: new SupabaseTable<PurchaseOrder>(sb, "purchase_orders"),
  };
}

function buildMemoryStore(): Store {
  return {
    tenants: new MemoryTable<Tenant>(INITIAL_TENANTS),
    users: new MemoryTable<AppUser>(INITIAL_USERS),
    medicines: new MemoryTable<Medicine>(INITIAL_MEDICINES),
    batches: new MemoryTable<InventoryBatch>(INITIAL_BATCHES),
    suppliers: new MemoryTable<Supplier>(INITIAL_SUPPLIERS),
    customers: new MemoryTable<Customer>(INITIAL_CUSTOMERS),
    sales: new MemoryTable<Sale>(INITIAL_SALES),
    transfers: new MemoryTable<StockTransfer>(INITIAL_TRANSFERS),
    purchaseOrders: new MemoryTable<PurchaseOrder>(INITIAL_PURCHASE_ORDERS),
  };
}

/**
 * Seed a fresh Supabase database once. If the tenants table already has rows we
 * assume the DB is seeded and do nothing (idempotent across cold starts).
 */
async function seedSupabase(sb: SupabaseClient, store: Store): Promise<void> {
  const { data, error } = await sb.from("tenants").select("id").limit(1);
  if (error) throw new Error(`[seed.check] ${error.message}`);
  if (data && data.length > 0) return; // already seeded

  await store.tenants.insertMany([...INITIAL_TENANTS]);
  await store.users.insertMany([...INITIAL_USERS]);
  await store.medicines.insertMany([...INITIAL_MEDICINES]);
  await store.batches.insertMany([...INITIAL_BATCHES]);
  await store.suppliers.insertMany([...INITIAL_SUPPLIERS]);
  await store.customers.insertMany([...INITIAL_CUSTOMERS]);
  await store.sales.insertMany([...INITIAL_SALES]);
  await store.transfers.insertMany([...INITIAL_TRANSFERS]);
  await store.purchaseOrders.insertMany([...INITIAL_PURCHASE_ORDERS]);
}

function initStore(): Store {
  if (cachedStore) return cachedStore;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (url && key) {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const store = buildSupabaseStore(sb);
    readyPromise = seedSupabase(sb, store);
    cachedStore = store;
    console.log("[store] Using Supabase persistence backend");
  } else {
    cachedStore = buildMemoryStore();
    readyPromise = Promise.resolve();
    console.log("[store] SUPABASE_URL not set — using in-memory backend (data resets on restart)");
  }
  return cachedStore;
}

/** Singleton store instance (chosen from environment on first access). */
export const store: Store = initStore();

/** Resolves once first-run seeding (Supabase) has completed. No-op for memory. */
export async function ensureReady(): Promise<void> {
  if (readyPromise) await readyPromise;
}

/** True when the persistent Supabase backend is active. */
export function isPersistent(): boolean {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY));
}
