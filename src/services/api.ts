import {
  Tenant,
  Medicine,
  InventoryItem,
  InventoryBatch,
  Sale,
  StockTransfer,
  PurchaseOrder,
  Customer,
  Supplier,
  AppUser,
  NetworkAnalytics
} from '../types';

// --- Session token ---------------------------------------------------------
// The signed token from POST /api/auth/login. Kept in localStorage so a page
// refresh keeps the user logged in, and attached to every request below.
const TOKEN_KEY = 'px_token';
let authToken: string | null =
  typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export function setAuthToken(token: string): void {
  authToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearAuthToken(): void {
  authToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function getAuthToken(): string | null {
  return authToken;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData.error) errMsg = errData.error;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    fetchJSON<{ token: string; user: AppUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => fetchJSON<AppUser>('/api/auth/me'),

  // Tenants
  getTenants: () => fetchJSON<Tenant[]>('/api/tenants'),
  createTenant: (data: Partial<Tenant>) =>
    fetchJSON<Tenant>('/api/tenants', { method: 'POST', body: JSON.stringify(data) }),
  updateTenant: (id: string, data: Partial<Tenant>) =>
    fetchJSON<Tenant>(`/api/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Users
  getUsers: () => fetchJSON<AppUser[]>('/api/users'),
  createUser: (data: {
    name: string;
    email: string;
    role: AppUser['role'];
    password: string;
    tenantId?: string | null;
  }) => fetchJSON<AppUser>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (
    id: string,
    data: Partial<{ name: string; email: string; role: AppUser['role']; password: string }>
  ) => fetchJSON<AppUser>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Medicines & Inventory
  getMedicines: () => fetchJSON<Medicine[]>('/api/medicines'),
  createMedicine: (data: Partial<Medicine>) =>
    fetchJSON<Medicine>('/api/medicines', { method: 'POST', body: JSON.stringify(data) }),
  getInventory: (params?: { tenantId?: string; search?: string; category?: string; lowStockOnly?: boolean; expiringSoonOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.tenantId) query.set('tenantId', params.tenantId);
    if (params?.search) query.set('search', params.search);
    if (params?.category) query.set('category', params.category);
    if (params?.lowStockOnly) query.set('lowStockOnly', 'true');
    if (params?.expiringSoonOnly) query.set('expiringSoonOnly', 'true');
    return fetchJSON<InventoryItem[]>(`/api/inventory?${query.toString()}`);
  },

  // Batches
  getBatches: (tenantId?: string, medicineId?: string) => {
    const query = new URLSearchParams();
    if (tenantId) query.set('tenantId', tenantId);
    if (medicineId) query.set('medicineId', medicineId);
    return fetchJSON<InventoryBatch[]>(`/api/batches?${query.toString()}`);
  },
  createBatch: (data: Partial<InventoryBatch>) =>
    fetchJSON<InventoryBatch>('/api/batches', { method: 'POST', body: JSON.stringify(data) }),
  updateBatch: (id: string, data: Partial<InventoryBatch>) =>
    fetchJSON<InventoryBatch>(`/api/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Sales & POS
  getSales: (tenantId?: string) => {
    const query = new URLSearchParams();
    if (tenantId) query.set('tenantId', tenantId);
    return fetchJSON<Sale[]>(`/api/sales?${query.toString()}`);
  },
  createSale: (data: Partial<Sale>) =>
    fetchJSON<Sale>('/api/sales', { method: 'POST', body: JSON.stringify(data) }),
  refundSale: (id: string) =>
    fetchJSON<Sale>(`/api/sales/${id}/refund`, { method: 'POST' }),

  // Transfers
  getTransfers: (tenantId?: string) => {
    const query = new URLSearchParams();
    if (tenantId) query.set('tenantId', tenantId);
    return fetchJSON<StockTransfer[]>(`/api/transfers?${query.toString()}`);
  },
  createTransfer: (data: Partial<StockTransfer>) =>
    fetchJSON<StockTransfer>('/api/transfers', { method: 'POST', body: JSON.stringify(data) }),
  updateTransferStatus: (id: string, status: string) =>
    fetchJSON<StockTransfer>(`/api/transfers/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Purchase Orders & Suppliers
  getSuppliers: () => fetchJSON<Supplier[]>('/api/suppliers'),
  getPurchaseOrders: (tenantId?: string) => {
    const query = new URLSearchParams();
    if (tenantId) query.set('tenantId', tenantId);
    return fetchJSON<PurchaseOrder[]>(`/api/orders?${query.toString()}`);
  },
  createPurchaseOrder: (data: Partial<PurchaseOrder>) =>
    fetchJSON<PurchaseOrder>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  receivePurchaseOrder: (id: string) =>
    fetchJSON<PurchaseOrder>(`/api/orders/${id}/receive`, { method: 'PUT' }),

  // Customers
  getCustomers: () => fetchJSON<Customer[]>('/api/customers'),
  createCustomer: (data: Partial<Customer>) =>
    fetchJSON<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics & Reorder Checks
  getNetworkAnalytics: () => fetchJSON<NetworkAnalytics>('/api/analytics/network'),
  checkReorderThresholds: (tenantId?: string) => {
    const query = new URLSearchParams();
    if (tenantId) query.set('tenantId', tenantId);
    return fetchJSON<any>(`/api/inventory/reorder-check?${query.toString()}`);
  },

  // AI Services (Gemini 2.5 Flash)
  analyzePrescription: (payload: { text: string; tenantId?: string; patientConditions?: string[]; patientAllergies?: string[] }) =>
    fetchJSON<any>('/api/ai/analyze-prescription', { method: 'POST', body: JSON.stringify(payload) }),

  checkDrugInteractions: (payload: { medicineIds: string[]; patientConditions?: string[]; patientAge?: number; isPregnant?: boolean }) =>
    fetchJSON<any>('/api/ai/drug-interaction-check', { method: 'POST', body: JSON.stringify(payload) }),

  forecastReorder: (payload: { tenantId: string }) =>
    fetchJSON<any>('/api/ai/smart-reorder-forecast', { method: 'POST', body: JSON.stringify(payload) }),

  getExecutiveSummary: () =>
    fetchJSON<any>('/api/ai/executive-summary', { method: 'POST' }),
};
