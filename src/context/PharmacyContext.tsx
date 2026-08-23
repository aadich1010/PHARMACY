import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Tenant, 
  AppUser, 
  InventoryItem, 
  Sale, 
  StockTransfer, 
  PurchaseOrder, 
  Customer, 
  Supplier, 
  SaleItem, 
  NetworkAnalytics,
  InventoryBatch
} from '../types';
import { api } from '../services/api';

export interface PosCartItem {
  medicine: InventoryItem;
  selectedBatch: InventoryBatch;
  quantity: number;
  discountPercent: number;
  unitPrice: number;
  dosageInstructions?: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

interface PharmacyContextType {
  // Tenants & Auth
  tenants: Tenant[];
  currentTenant: Tenant | null; // null = Network HQ (All Branches view)
  setCurrentTenant: (tenant: Tenant | null) => void;
  users: AppUser[];
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;

  // Live Data
  inventory: InventoryItem[];
  sales: Sale[];
  transfers: StockTransfer[];
  purchaseOrders: PurchaseOrder[];
  customers: Customer[];
  suppliers: Supplier[];
  analytics: NetworkAnalytics | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // POS State
  cart: PosCartItem[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (cust: Customer | null) => void;
  doctorName: string;
  setDoctorName: (name: string) => void;
  prescriptionNumber: string;
  setPrescriptionNumber: (rx: string) => void;
  paymentMethod: Sale['paymentMethod'];
  setPaymentMethod: (method: Sale['paymentMethod']) => void;
  cartNotes: string;
  setCartNotes: (notes: string) => void;
  addToCart: (item: InventoryItem, batch?: InventoryBatch, qty?: number) => void;
  updateCartQuantity: (index: number, qty: number) => void;
  updateCartBatch: (index: number, batch: InventoryBatch) => void;
  updateCartDiscount: (index: number, discount: number) => void;
  updateCartDosage: (index: number, dosage: string) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  checkoutSale: () => Promise<Sale | null>;

  // Modals & UI States
  activeSaleReceipt: Sale | null;
  setActiveSaleReceipt: (sale: Sale | null) => void;
  isAiModalOpen: boolean;
  setIsAiModalOpen: (open: boolean) => void;
  aiDefaultTab: 'prescription' | 'interactions' | 'reorder' | 'executive';
  openAiModalWithTab: (tab: 'prescription' | 'interactions' | 'reorder' | 'executive') => void;

  // Notifications
  notifications: ToastNotification[];
  addNotification: (type: ToastNotification['type'], title: string, message: string) => void;
  removeNotification: (id: string) => void;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser>({
    id: 'usr-1',
    name: 'Adeel Chaudhary (Network Owner)',
    email: 'adeelchaudhary101@gmail.com',
    role: 'super_admin',
    tenantId: null,
  });

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [analytics, setAnalytics] = useState<NetworkAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // POS State
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Cash');
  const [cartNotes, setCartNotes] = useState('');

  // Modals
  const [activeSaleReceipt, setActiveSaleReceipt] = useState<Sale | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiDefaultTab, setAiDefaultTab] = useState<'prescription' | 'interactions' | 'reorder' | 'executive'>('prescription');

  // Notifications
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = useCallback((type: ToastNotification['type'], title: string, message: string) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setNotifications((prev) => [...prev, { id, type, title, message, timestamp: Date.now() }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const openAiModalWithTab = (tab: 'prescription' | 'interactions' | 'reorder' | 'executive') => {
    setAiDefaultTab(tab);
    setIsAiModalOpen(true);
  };

  // Main data fetcher
  const refreshData = useCallback(async () => {
    try {
      const [
        tenantsData,
        usersData,
        suppliersData,
        customersData,
        analyticsData,
      ] = await Promise.all([
        api.getTenants(),
        api.getUsers(),
        api.getSuppliers(),
        api.getCustomers(),
        api.getNetworkAnalytics(),
      ]);

      setTenants(tenantsData);
      setUsers(usersData);
      setSuppliers(suppliersData);
      setCustomers(customersData);
      setAnalytics(analyticsData);

      // Default tenant selection if none selected
      if (!currentTenant && tenantsData.length > 0) {
        // Leave as null for super_admin to show network dashboard, or default to first tenant
      }

      // Fetch tenant-scoped or global data
      const tId = currentTenant ? currentTenant.id : undefined;
      const [invData, salesData, transData, ordersData] = await Promise.all([
        api.getInventory({ tenantId: tId }),
        api.getSales(tId),
        api.getTransfers(tId),
        api.getPurchaseOrders(tId),
      ]);

      setInventory(invData);
      setSales(salesData);
      setTransfers(transData);
      setPurchaseOrders(ordersData);
    } catch (err: any) {
      console.error('Error fetching pharmacy data:', err);
      addNotification('error', 'Sync Failed', err.message || 'Could not load pharmacy records');
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, addNotification]);

  // Initial mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // POS Cart Methods
  const addToCart = (item: InventoryItem, specificBatch?: InventoryBatch, qty: number = 1) => {
    // Select batch: specific batch OR first available batch with stock (FIFO nearest expiry)
    let batch = specificBatch;
    if (!batch) {
      const availableBatches = (item.batches || []).filter((b) => b.stockQuantity > 0);
      if (availableBatches.length === 0) {
        addNotification('warning', 'Out of Stock', `${item.brandName} has zero available units in this branch.`);
        return;
      }
      batch = availableBatches[0];
    }

    // Check if item already exists with the same batch
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (c) => c.medicine.id === item.id && c.selectedBatch.id === batch!.id
      );
      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        const newQty = existing.quantity + qty;
        if (newQty > batch!.stockQuantity) {
          addNotification('warning', 'Stock Limit Exceeded', `Cannot add more. Batch only has ${batch!.stockQuantity} units.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = { ...existing, quantity: newQty };
        return updated;
      }

      if (qty > batch.stockQuantity) {
        addNotification('warning', 'Stock Limit Exceeded', `Batch only has ${batch.stockQuantity} units available.`);
        return prev;
      }

      addNotification('success', 'Added to Dispensing Cart', `${item.brandName} (${batch.batchNumber}) added.`);
      return [
        ...prev,
        {
          medicine: item,
          selectedBatch: batch,
          quantity: qty,
          discountPercent: 0,
          unitPrice: batch.sellingPrice,
          dosageInstructions: item.dosageForm === 'Tablet' ? '1 tab twice daily' : '',
        },
      ];
    });
  };

  const updateCartQuantity = (index: number, qty: number) => {
    setCart((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const item = prev[index];
      if (qty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      if (qty > item.selectedBatch.stockQuantity) {
        addNotification('warning', 'Max Stock Reached', `Only ${item.selectedBatch.stockQuantity} units available in this batch.`);
        return prev;
      }
      const updated = [...prev];
      updated[index] = { ...item, quantity: qty };
      return updated;
    });
  };

  const updateCartBatch = (index: number, batch: InventoryBatch) => {
    setCart((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        selectedBatch: batch,
        unitPrice: batch.sellingPrice,
        quantity: Math.min(updated[index].quantity, batch.stockQuantity || 1),
      };
      return updated;
    });
  };

  const updateCartDiscount = (index: number, discount: number) => {
    setCart((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], discountPercent: Math.max(0, Math.min(100, discount)) };
      return updated;
    });
  };

  const updateCartDosage = (index: number, dosage: string) => {
    setCart((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], dosageInstructions: dosage };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDoctorName('');
    setPrescriptionNumber('');
    setCartNotes('');
  };

  const checkoutSale = async (): Promise<Sale | null> => {
    if (!currentTenant) {
      addNotification('error', 'Select Branch First', 'Please select a specific pharmacy branch to process sales.');
      return null;
    }
    if (cart.length === 0) {
      addNotification('warning', 'Empty Cart', 'Please add medicines to cart before checking out.');
      return null;
    }

    try {
      const taxRate = (currentTenant.taxRatePercent || 5) / 100;
      let subtotal = 0;
      let discountTotal = 0;
      let taxTotal = 0;

      const saleItems: SaleItem[] = cart.map((c, idx) => {
        const lineGross = c.unitPrice * c.quantity;
        const lineDisc = lineGross * (c.discountPercent / 100);
        const lineNet = lineGross - lineDisc;
        const lineTax = lineNet * taxRate;
        const lineTotal = lineNet + lineTax;

        subtotal += lineGross;
        discountTotal += lineDisc;
        taxTotal += lineTax;

        return {
          id: `si-${Date.now()}-${idx}`,
          medicineId: c.medicine.id,
          medicineName: c.medicine.brandName,
          genericName: c.medicine.genericName,
          batchId: c.selectedBatch.id,
          batchNumber: c.selectedBatch.batchNumber,
          unitPrice: c.unitPrice,
          quantity: c.quantity,
          discountPercent: c.discountPercent,
          taxAmount: Number(lineTax.toFixed(2)),
          totalAmount: Number(lineTotal.toFixed(2)),
          dosageInstructions: c.dosageInstructions,
        };
      });

      const grandTotal = Number((subtotal - discountTotal + taxTotal).toFixed(2));

      const payload: Partial<Sale> = {
        tenantId: currentTenant.id,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Patient',
        customerPhone: selectedCustomer?.phone,
        doctorName: doctorName.trim() || undefined,
        prescriptionNumber: prescriptionNumber.trim() || undefined,
        items: saleItems,
        subtotal: Number(subtotal.toFixed(2)),
        discountTotal: Number(discountTotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
        grandTotal,
        paymentMethod,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        notes: cartNotes.trim() || undefined,
      };

      const completedSale = await api.createSale(payload);
      addNotification('success', 'Sale Dispensed Successfully!', `Invoice ${completedSale.invoiceNumber} recorded.`);
      setActiveSaleReceipt(completedSale);
      clearCart();
      await refreshData();
      return completedSale;
    } catch (err: any) {
      addNotification('error', 'Checkout Failed', err.message || 'Could not complete sale transaction.');
      return null;
    }
  };

  return (
    <PharmacyContext.Provider
      value={{
        tenants,
        currentTenant,
        setCurrentTenant,
        users,
        currentUser,
        setCurrentUser,
        inventory,
        sales,
        transfers,
        purchaseOrders,
        customers,
        suppliers,
        analytics,
        isLoading,
        refreshData,
        cart,
        selectedCustomer,
        setSelectedCustomer,
        doctorName,
        setDoctorName,
        prescriptionNumber,
        setPrescriptionNumber,
        paymentMethod,
        setPaymentMethod,
        cartNotes,
        setCartNotes,
        addToCart,
        updateCartQuantity,
        updateCartBatch,
        updateCartDiscount,
        updateCartDosage,
        removeFromCart,
        clearCart,
        checkoutSale,
        activeSaleReceipt,
        setActiveSaleReceipt,
        isAiModalOpen,
        setIsAiModalOpen,
        aiDefaultTab,
        openAiModalWithTab,
        notifications,
        addNotification,
        removeNotification,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};
