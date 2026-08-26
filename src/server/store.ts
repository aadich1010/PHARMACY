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
import { hashPassword, DEFAULT_BOOTSTRAP_PASSWORD } from "./auth";

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
export function cleanSupabaseUrl(raw?: string | null): string | null {
  if (!raw) return null;
  let trimmed = raw.trim();
  if (!trimmed) return null;

  // Handle if user pasted dashboard URL: https://supabase.com/dashboard/project/xyz...
  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashboardMatch) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Handle if user only provided project ID: e.g. "yelpaiwwuqjutnmoqcli"
  if (/^[a-z0-9]{15,30}$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }

  // Ensure protocol
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
  } catch {
    return null;
  }
  return null;
}

class SupabaseTable<T extends { id: string }> implements Table<T> {
  private fallbackMemory: Map<string, T> = new Map();

  constructor(private sb: SupabaseClient, private name: string, seedRows: T[] = []) {
    for (const r of seedRows) {
      this.fallbackMemory.set(r.id, { ...r });
    }
  }

  async all(): Promise<T[]> {
    try {
      const { data, error } = await this.sb.from(this.name).select("data");
      if (error) {
        console.warn(`[${this.name}.all] Supabase read note (${error.message}). Using cache.`);
        return Array.from(this.fallbackMemory.values());
      }
      const items = (data || []).map((r: any) => r.data as T);
      for (const item of items) {
        if (item?.id) this.fallbackMemory.set(item.id, item);
      }
      return items;
    } catch (err: any) {
      console.warn(`[${this.name}.all] Supabase read exception (${err?.message}). Using cache.`);
      return Array.from(this.fallbackMemory.values());
    }
  }

  async insert(row: T): Promise<T> {
    this.fallbackMemory.set(row.id, { ...row });
    try {
      const { error } = await this.sb.from(this.name).insert({ id: row.id, data: row });
      if (error) console.warn(`[${this.name}.insert] Supabase write note:`, error.message);
    } catch (err: any) {
      console.warn(`[${this.name}.insert] Supabase write exception:`, err?.message);
    }
    return row;
  }

  async insertMany(rows: T[]): Promise<void> {
    if (rows.length === 0) return;
    for (const r of rows) {
      this.fallbackMemory.set(r.id, { ...r });
    }
    try {
      const { error } = await this.sb
        .from(this.name)
        .insert(rows.map((r) => ({ id: r.id, data: r })));
      if (error) console.warn(`[${this.name}.insertMany] Supabase write note:`, error.message);
    } catch (err: any) {
      console.warn(`[${this.name}.insertMany] Supabase write exception:`, err?.message);
    }
  }

  async update(id: string, patch: Partial<T>): Promise<T | null> {
    const memItem = this.fallbackMemory.get(id);
    const base = memItem || ({} as T);
    const merged = { ...base, ...patch, id } as T;
    this.fallbackMemory.set(id, merged);

    try {
      const { data: existing, error: e1 } = await this.sb
        .from(this.name)
        .select("data")
        .eq("id", id)
        .maybeSingle();

      if (!e1 && existing) {
        const fullMerged = { ...(existing.data as T), ...patch } as T;
        await this.sb.from(this.name).update({ data: fullMerged }).eq("id", id);
        this.fallbackMemory.set(id, fullMerged);
        return fullMerged;
      }
    } catch (err: any) {
      console.warn(`[${this.name}.update] Supabase update note:`, err?.message);
    }
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
    tenants: new SupabaseTable<Tenant>(sb, "tenants", INITIAL_TENANTS),
    users: new SupabaseTable<AppUser>(sb, "users", INITIAL_USERS),
    medicines: new SupabaseTable<Medicine>(sb, "medicines", INITIAL_MEDICINES),
    batches: new SupabaseTable<InventoryBatch>(sb, "batches", INITIAL_BATCHES),
    suppliers: new SupabaseTable<Supplier>(sb, "suppliers", INITIAL_SUPPLIERS),
    customers: new SupabaseTable<Customer>(sb, "customers", INITIAL_CUSTOMERS),
    sales: new SupabaseTable<Sale>(sb, "sales", INITIAL_SALES),
    transfers: new SupabaseTable<StockTransfer>(sb, "transfers", INITIAL_TRANSFERS),
    purchaseOrders: new SupabaseTable<PurchaseOrder>(sb, "purchase_orders", INITIAL_PURCHASE_ORDERS),
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
  try {
    const { data, error } = await sb.from("tenants").select("id").limit(1);
    if (error) {
      console.warn(`[seed.check] Supabase tables may not exist yet (${error.message}).`);
      return;
    }
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
    console.log("[store] Fresh Supabase database initialized with initial pharmacy dataset.");
  } catch (err: any) {
    console.warn("[seed.check] Supabase seed warning:", err?.message);
  }
}

/**
 * Give every password-less user a hashed default password so existing/seeded
 * accounts can log in on the very first deploy of the auth system. Idempotent:
 * only users that have no passwordHash yet are touched, so it is safe to run on
 * every cold start. The owner logs in with DEFAULT_BOOTSTRAP_PASSWORD, then
 * changes it and creates real staff logins from the app.
 */
async function bootstrapAuth(store: Store): Promise<void> {
  try {
    const users = await store.users.all();
    for (const u of users) {
      if (!u.passwordHash) {
        await store.users.update(u.id, { passwordHash: hashPassword(DEFAULT_BOOTSTRAP_PASSWORD) });
      }
    }
  } catch (err: any) {
    console.warn("[bootstrapAuth] Note:", err?.message);
  }
}

function initStore(): Store {
  if (cachedStore) return cachedStore;

  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  const url = cleanSupabaseUrl(rawUrl);
  const key = rawKey?.trim();

  if (url && key) {
    try {
      const sb = createClient(url, key, { auth: { persistSession: false } });
      const store = buildSupabaseStore(sb);
      readyPromise = seedSupabase(sb, store).then(() => bootstrapAuth(store));
      cachedStore = store;
      console.log(`[store] Connected to Supabase backend: ${url}`);
      return cachedStore;
    } catch (err: any) {
      console.warn("[store] Failed to initialize Supabase client, falling back to memory:", err?.message);
    }
  }

  const store = buildMemoryStore();
  cachedStore = store;
  readyPromise = bootstrapAuth(store);
  console.log("[store] Supabase not configured or URL invalid — using in-memory store");
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
  const url = cleanSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(url && key?.trim());
}
