export type UserRole = 'super_admin' | 'tenant_admin' | 'pharmacist' | 'cashier';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string | null; // null for super_admin
  avatar?: string;
  passwordHash?: string; // server-only; stripped before sending to the client
}

export interface Tenant {
  id: string;
  name: string;
  branchCode: string;
  licenseNumber: string;
  drugAuthorityReg: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  currency: string; // e.g. "PKR", "$", "AED", "EUR"
  taxRatePercent: number;
  lowStockDefaultThreshold: number;
  expiryWarningDays: number;
  managerName: string;
  createdAt: string;
  isActive: boolean;
  colorTheme?: string;
}

export type DosageForm = 
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Injection'
  | 'Ointment'
  | 'Inhaler'
  | 'Drops'
  | 'Sachet'
  | 'Device'
  | 'Suspension';

export type MedicineCategory = 
  | 'Antibiotics'
  | 'Analgesics & Pain'
  | 'Cardiovascular'
  | 'Diabetes & Endocrine'
  | 'Pediatric'
  | 'Dermatological'
  | 'Vitamins & Supplements'
  | 'Gastrointestinal'
  | 'Respiratory'
  | 'Psychiatric & Neuro'
  | 'Medical Devices';

export interface Medicine {
  id: string;
  genericName: string;
  brandName: string;
  sku: string;
  barcode: string;
  category: MedicineCategory;
  dosageForm: DosageForm;
  strength: string;
  manufacturer: string;
  description: string;
  sideEffects?: string;
  contraindications?: string[];
  defaultStorage: 'Room Temperature' | 'Cold Chain (2-8°C)' | 'Store below 25°C';
  requiresPrescription: boolean;
  unitPackSize: number; // e.g. 10 tablets per strip, 1 bottle
}

export interface InventoryBatch {
  id: string;
  tenantId: string;
  medicineId: string;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  stockQuantity: number;
  initialQuantity: number;
  locationRack: string;
  supplierId: string;
  isControlledSubstance?: boolean;
}

export interface InventoryItem extends Medicine {
  batches: InventoryBatch[];
  totalStock: number;
  nearestExpiry: string | null;
  lowestPrice: number;
  highestPrice: number;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export interface SaleItem {
  id: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  batchId: string;
  batchNumber: string;
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  taxAmount: number;
  totalAmount: number;
  dosageInstructions?: string;
}

export interface Sale {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  date: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  doctorName?: string;
  prescriptionNumber?: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'Card' | 'Digital Wallet' | 'Insurance Co-Pay' | 'Credit';
  insuranceDetails?: {
    provider: string;
    claimNumber: string;
    coPayPercent: number;
  };
  cashierId: string;
  cashierName: string;
  notes?: string;
  status: 'completed' | 'refunded';
}

export interface StockTransfer {
  id: string;
  fromTenantId: string;
  fromTenantName: string;
  toTenantId: string;
  toTenantName: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  quantity: number;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'rejected';
  requestedDate: string;
  completedDate?: string;
  requestedBy: string;
  notes?: string;
}

export interface PurchaseOrderItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  dosageForm: DosageForm;
  strength: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string;
  supplierName: string;
  orderNumber: string;
  orderDate: string;
  expectedDate?: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxNumber: string;
  paymentTerms: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  chronicConditions: string[];
  allergies: string[];
  insuranceProvider?: string;
  policyNumber?: string;
  totalSpent: number;
  lastVisitDate: string;
}

export interface NetworkAnalytics {
  totalTenants: number;
  totalRevenue: number;
  totalSalesCount: number;
  totalInventoryValuation: number;
  totalMedicinesCount: number;
  lowStockItemsCount: number;
  expiringItemsCount: number;
  tenantComparisons: {
    tenantId: string;
    tenantName: string;
    branchCode: string;
    city: string;
    revenue: number;
    salesCount: number;
    inventoryValue: number;
    stockItemsCount: number;
    lowStockCount: number;
    currency: string;
  }[];
  recentSales: Sale[];
  topSellingMedicines: {
    medicineName: string;
    genericName: string;
    category: string;
    unitsSold: number;
    revenue: number;
  }[];
}
