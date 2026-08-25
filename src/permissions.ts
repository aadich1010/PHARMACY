// ---------------------------------------------------------------------------
// Central role → tab access map, shared by the Navbar (which tabs to show) and
// App (which tab bodies to render). This is UI convenience only — the real
// enforcement lives on the server in src/server/app.ts. Keeping both in sync
// avoids showing a tab the API would reject anyway.
// ---------------------------------------------------------------------------
import { UserRole } from './types';

// Every tab key used by <App/> and <Navbar/>.
export type TabKey =
  | 'network'
  | 'pos'
  | 'inventory'
  | 'sales'
  | 'transfers'
  | 'purchase-orders'
  | 'customers'
  | 'tenants'
  | 'users';

// Which tabs each role may see. Order here is the display order in the navbar.
export const ROLE_TABS: Record<UserRole, TabKey[]> = {
  // Owner: everything, across all pharmacies.
  super_admin: [
    'network',
    'pos',
    'inventory',
    'sales',
    'transfers',
    'purchase-orders',
    'customers',
    'tenants',
    'users',
  ],
  // Manager: their own pharmacy's full operations + staff logins.
  tenant_admin: [
    'pos',
    'inventory',
    'sales',
    'transfers',
    'purchase-orders',
    'customers',
    'users',
  ],
  // Pharmacist: dispensing + stock, no user management.
  pharmacist: ['pos', 'inventory', 'sales', 'transfers', 'purchase-orders', 'customers'],
  // Cashier: front-counter only.
  cashier: ['pos', 'sales', 'customers'],
};

/** May this role open the given tab? */
export function canAccessTab(role: UserRole | undefined | null, tab: string): boolean {
  if (!role) return false;
  return (ROLE_TABS[role] as string[]).includes(tab);
}

/** The tab a user should land on right after logging in. */
export function defaultTabFor(role: UserRole | undefined | null): TabKey {
  if (role === 'super_admin') return 'network';
  if (role === 'cashier') return 'pos';
  return 'inventory'; // manager + pharmacist
}
