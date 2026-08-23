import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { 
  INITIAL_TENANTS, 
  INITIAL_USERS, 
  INITIAL_MEDICINES, 
  INITIAL_BATCHES, 
  INITIAL_SUPPLIERS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SALES, 
  INITIAL_TRANSFERS, 
  INITIAL_PURCHASE_ORDERS 
} from "./src/data/initialData.ts";
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
  NetworkAnalytics 
} from "./src/types.ts";

dotenv.config();

// In-Memory Database Store with Tenant Isolation
class DataStore {
  tenants: Tenant[] = [...INITIAL_TENANTS];
  users: AppUser[] = [...INITIAL_USERS];
  medicines: Medicine[] = [...INITIAL_MEDICINES];
  batches: InventoryBatch[] = [...INITIAL_BATCHES];
  suppliers: Supplier[] = [...INITIAL_SUPPLIERS];
  customers: Customer[] = [...INITIAL_CUSTOMERS];
  sales: Sale[] = [...INITIAL_SALES];
  transfers: StockTransfer[] = [...INITIAL_TRANSFERS];
  purchaseOrders: PurchaseOrder[] = [...INITIAL_PURCHASE_ORDERS];
}

const db = new DataStore();

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // --- API Endpoints ---

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString(), tenantsCount: db.tenants.length });
  });

  // 2. Tenants CRUD
  app.get("/api/tenants", (req, res) => {
    res.json(db.tenants);
  });

  app.post("/api/tenants", (req, res) => {
    try {
      const newTenant: Tenant = {
        ...req.body,
        id: `tenant-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
        isActive: req.body.isActive ?? true,
        taxRatePercent: Number(req.body.taxRatePercent) || 5.0,
        lowStockDefaultThreshold: Number(req.body.lowStockDefaultThreshold) || 20,
        expiryWarningDays: Number(req.body.expiryWarningDays) || 90,
      };
      db.tenants.push(newTenant);

      // Seed initial common essential medicines batches for the new pharmacy branch
      const initialSeedMedicines = db.medicines.slice(0, 6);
      initialSeedMedicines.forEach((med, idx) => {
        db.batches.push({
          id: `bat-new-${Date.now()}-${idx}`,
          tenantId: newTenant.id,
          medicineId: med.id,
          batchNumber: `BAT-${newTenant.branchCode}-${idx + 101}`,
          manufactureDate: '2024-03-01',
          expiryDate: '2027-03-01',
          purchasePrice: 150 + idx * 30,
          sellingPrice: 200 + idx * 40,
          mrp: 210 + idx * 40,
          stockQuantity: 30 + (idx * 5),
          initialQuantity: 50,
          locationRack: `R-${idx + 1}`,
          supplierId: db.suppliers[0]?.id || 'sup-1',
        });
      });

      res.status(201).json(newTenant);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to create tenant" });
    }
  });

  app.put("/api/tenants/:id", (req, res) => {
    const { id } = req.params;
    const index = db.tenants.findIndex((t) => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    db.tenants[index] = { ...db.tenants[index], ...req.body };
    res.json(db.tenants[index]);
  });

  // 3. Users & Auth Simulation
  app.get("/api/users", (req, res) => {
    res.json(db.users);
  });

  // 4. Medicines Catalog & Tenant Inventory
  app.get("/api/medicines", (req, res) => {
    res.json(db.medicines);
  });

  app.post("/api/medicines", (req, res) => {
    try {
      const newMed: Medicine = {
        ...req.body,
        id: `med-${Date.now()}`,
        requiresPrescription: req.body.requiresPrescription ?? false,
        unitPackSize: Number(req.body.unitPackSize) || 1,
      };
      db.medicines.push(newMed);
      res.status(201).json(newMed);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Tenant-specific aggregated Inventory (with Batches)
  app.get("/api/inventory", (req, res) => {
    const { tenantId, search, category, lowStockOnly, expiringSoonOnly } = req.query;
    const now = new Date();
    const ninetyDaysFuture = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const tenant = db.tenants.find((t) => t.id === tenantId);
    const lowStockThreshold = tenant?.lowStockDefaultThreshold || 20;

    let items = db.medicines.map((med) => {
      const batches = db.batches.filter(
        (b) => (!tenantId || b.tenantId === tenantId) && b.medicineId === med.id
      );
      const totalStock = batches.reduce((sum, b) => sum + b.stockQuantity, 0);

      // Find nearest expiry
      const sortedBatches = [...batches].sort(
        (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      );
      const nearestExpiry = sortedBatches.length > 0 ? sortedBatches[0].expiryDate : null;

      const prices = batches.map((b) => b.sellingPrice);
      const lowestPrice = prices.length ? Math.min(...prices) : 0;
      const highestPrice = prices.length ? Math.max(...prices) : 0;

      const isExpired = nearestExpiry ? new Date(nearestExpiry) < now : false;
      const isExpiringSoon = nearestExpiry
        ? new Date(nearestExpiry) <= ninetyDaysFuture && !isExpired
        : false;
      const isLowStock = totalStock <= lowStockThreshold;

      return {
        ...med,
        batches,
        totalStock,
        nearestExpiry,
        lowestPrice,
        highestPrice,
        isLowStock,
        isExpiringSoon,
        isExpired,
      };
    });

    if (search && typeof search === "string") {
      const q = search.toLowerCase();
      items = items.filter(
        (item) =>
          item.brandName.toLowerCase().includes(q) ||
          item.genericName.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.barcode.includes(q)
      );
    }

    if (category && typeof category === "string" && category !== "All") {
      items = items.filter((item) => item.category === category);
    }

    if (lowStockOnly === "true") {
      items = items.filter((item) => item.isLowStock);
    }

    if (expiringSoonOnly === "true") {
      items = items.filter((item) => item.isExpiringSoon || item.isExpired);
    }

    res.json(items);
  });

  // Batches CRUD
  app.get("/api/batches", (req, res) => {
    const { tenantId, medicineId } = req.query;
    let result = db.batches;
    if (tenantId) {
      result = result.filter((b) => b.tenantId === tenantId);
    }
    if (medicineId) {
      result = result.filter((b) => b.medicineId === medicineId);
    }
    res.json(result);
  });

  app.post("/api/batches", (req, res) => {
    try {
      const newBatch: InventoryBatch = {
        ...req.body,
        id: `bat-${Date.now()}`,
        purchasePrice: Number(req.body.purchasePrice) || 0,
        sellingPrice: Number(req.body.sellingPrice) || 0,
        mrp: Number(req.body.mrp) || Number(req.body.sellingPrice) || 0,
        stockQuantity: Number(req.body.stockQuantity) || 0,
        initialQuantity: Number(req.body.stockQuantity) || 0,
      };
      db.batches.push(newBatch);
      res.status(201).json(newBatch);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.put("/api/batches/:id", (req, res) => {
    const { id } = req.params;
    const index = db.batches.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Batch not found" });
    }
    db.batches[index] = {
      ...db.batches[index],
      ...req.body,
      stockQuantity: Number(req.body.stockQuantity ?? db.batches[index].stockQuantity),
      sellingPrice: Number(req.body.sellingPrice ?? db.batches[index].sellingPrice),
      purchasePrice: Number(req.body.purchasePrice ?? db.batches[index].purchasePrice),
    };
    res.json(db.batches[index]);
  });

  // 5. Point of Sale & Sales Transactions
  app.get("/api/sales", (req, res) => {
    const { tenantId } = req.query;
    let list = db.sales;
    if (tenantId) {
      list = list.filter((s) => s.tenantId === tenantId);
    }
    // Sort descending by date
    list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(list);
  });

  app.post("/api/sales", (req, res) => {
    try {
      const saleData: Partial<Sale> = req.body;
      if (!saleData.tenantId || !saleData.items || saleData.items.length === 0) {
        return res.status(400).json({ error: "Invalid sale payload: tenantId and items required" });
      }

      // Deduct stock from the batches (FIFO / selected batch)
      for (const item of saleData.items) {
        const batch = db.batches.find((b) => b.id === item.batchId);
        if (batch) {
          if (batch.stockQuantity < item.quantity) {
            return res.status(400).json({
              error: `Insufficient stock for ${item.medicineName} in batch ${batch.batchNumber}. Available: ${batch.stockQuantity}`,
            });
          }
          batch.stockQuantity -= item.quantity;
        }
      }

      // Update customer totalSpent and lastVisitDate if customer provided
      if (saleData.customerId) {
        const customer = db.customers.find((c) => c.id === saleData.customerId);
        if (customer) {
          customer.totalSpent += saleData.grandTotal || 0;
          customer.lastVisitDate = new Date().toISOString().split("T")[0];
        }
      }

      const tenant = db.tenants.find((t) => t.id === saleData.tenantId);
      const invoiceCount = db.sales.filter((s) => s.tenantId === saleData.tenantId).length + 1;
      const invoiceNumber = `INV-${tenant?.branchCode || "PH"}-${new Date().getFullYear()}-${String(
        invoiceCount
      ).padStart(4, "0")}`;

      const newSale: Sale = {
        id: `sale-${Date.now()}`,
        tenantId: saleData.tenantId,
        invoiceNumber,
        date: new Date().toISOString(),
        customerId: saleData.customerId,
        customerName: saleData.customerName || "Walk-in Customer",
        customerPhone: saleData.customerPhone,
        doctorName: saleData.doctorName,
        prescriptionNumber: saleData.prescriptionNumber,
        items: saleData.items,
        subtotal: Number(saleData.subtotal) || 0,
        discountTotal: Number(saleData.discountTotal) || 0,
        taxTotal: Number(saleData.taxTotal) || 0,
        grandTotal: Number(saleData.grandTotal) || 0,
        paymentMethod: saleData.paymentMethod || "Cash",
        insuranceDetails: saleData.insuranceDetails,
        cashierId: saleData.cashierId || "usr-1",
        cashierName: saleData.cashierName || "Dispensing Pharmacist",
        notes: saleData.notes,
        status: "completed",
      };

      db.sales.unshift(newSale);
      res.status(201).json(newSale);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to process sale" });
    }
  });

  // Refund Sale
  app.post("/api/sales/:id/refund", (req, res) => {
    const { id } = req.params;
    const sale = db.sales.find((s) => s.id === id);
    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }
    if (sale.status === "refunded") {
      return res.status(400).json({ error: "Sale is already refunded" });
    }

    // Restore stock
    for (const item of sale.items) {
      const batch = db.batches.find((b) => b.id === item.batchId);
      if (batch) {
        batch.stockQuantity += item.quantity;
      }
    }

    sale.status = "refunded";
    res.json(sale);
  });

  // 6. Inter-Tenant Stock Transfers
  app.get("/api/transfers", (req, res) => {
    const { tenantId } = req.query;
    let list = db.transfers;
    if (tenantId) {
      list = list.filter((t) => t.fromTenantId === tenantId || t.toTenantId === tenantId);
    }
    res.json(list);
  });

  app.post("/api/transfers", (req, res) => {
    try {
      const { fromTenantId, toTenantId, medicineId, quantity, requestedBy, notes } = req.body;
      const fromTenant = db.tenants.find((t) => t.id === fromTenantId);
      const toTenant = db.tenants.find((t) => t.id === toTenantId);
      const medicine = db.medicines.find((m) => m.id === medicineId);

      if (!fromTenant || !toTenant || !medicine) {
        return res.status(400).json({ error: "Invalid transfer request parameters" });
      }

      // Check source batch stock
      const sourceBatch = db.batches.find(
        (b) => b.tenantId === fromTenantId && b.medicineId === medicineId && b.stockQuantity >= quantity
      ) || db.batches.find((b) => b.tenantId === fromTenantId && b.medicineId === medicineId);

      if (!sourceBatch || sourceBatch.stockQuantity < quantity) {
        return res.status(400).json({
          error: `Source branch ${fromTenant.name} has insufficient stock (Available: ${
            sourceBatch?.stockQuantity || 0
          })`,
        });
      }

      const newTransfer: StockTransfer = {
        id: `tr-${Date.now()}`,
        fromTenantId,
        fromTenantName: fromTenant.name,
        toTenantId,
        toTenantName: toTenant.name,
        medicineId,
        medicineName: medicine.brandName,
        genericName: medicine.genericName,
        batchNumber: sourceBatch.batchNumber,
        quantity: Number(quantity),
        status: "pending",
        requestedDate: new Date().toISOString(),
        requestedBy: requestedBy || "Branch Manager",
        notes,
      };

      db.transfers.unshift(newTransfer);
      res.status(201).json(newTransfer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/transfers/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const transfer = db.transfers.find((t) => t.id === id);
    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    if (status === "completed" && transfer.status !== "completed") {
      // Execute the stock deduction & destination addition
      const sourceBatch = db.batches.find(
        (b) => b.tenantId === transfer.fromTenantId && b.batchNumber === transfer.batchNumber
      );
      if (sourceBatch) {
        sourceBatch.stockQuantity = Math.max(0, sourceBatch.stockQuantity - transfer.quantity);
      }

      // Add to destination tenant
      let destBatch = db.batches.find(
        (b) => b.tenantId === transfer.toTenantId && b.batchNumber === transfer.batchNumber
      );
      if (destBatch) {
        destBatch.stockQuantity += transfer.quantity;
      } else if (sourceBatch) {
        db.batches.push({
          id: `bat-tr-${Date.now()}`,
          tenantId: transfer.toTenantId,
          medicineId: transfer.medicineId,
          batchNumber: sourceBatch.batchNumber,
          manufactureDate: sourceBatch.manufactureDate,
          expiryDate: sourceBatch.expiryDate,
          purchasePrice: sourceBatch.purchasePrice,
          sellingPrice: sourceBatch.sellingPrice,
          mrp: sourceBatch.mrp,
          stockQuantity: transfer.quantity,
          initialQuantity: transfer.quantity,
          locationRack: "TRANSFERRED-IN",
          supplierId: sourceBatch.supplierId,
        });
      }
      transfer.completedDate = new Date().toISOString();
    }

    transfer.status = status;
    res.json(transfer);
  });

  // 7. Purchase Orders & Suppliers
  app.get("/api/suppliers", (req, res) => {
    res.json(db.suppliers);
  });

  app.get("/api/orders", (req, res) => {
    const { tenantId } = req.query;
    let list = db.purchaseOrders;
    if (tenantId) {
      list = list.filter((p) => p.tenantId === tenantId);
    }
    res.json(list);
  });

  app.post("/api/orders", (req, res) => {
    try {
      const { tenantId, supplierId, items, notes } = req.body;
      const supplier = db.suppliers.find((s) => s.id === supplierId);
      const tenant = db.tenants.find((t) => t.id === tenantId);

      const totalAmount = items.reduce((sum: number, it: any) => sum + (it.quantity * it.unitCost), 0);
      const orderCount = db.purchaseOrders.filter((p) => p.tenantId === tenantId).length + 1;
      const orderNumber = `PO-${tenant?.branchCode || "ORD"}-${new Date().getFullYear()}-${String(
        orderCount
      ).padStart(3, "0")}`;

      const newOrder: PurchaseOrder = {
        id: `po-${Date.now()}`,
        tenantId,
        supplierId,
        supplierName: supplier?.name || "Wholesale Distributor",
        orderNumber,
        orderDate: new Date().toISOString().split("T")[0],
        expectedDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "ordered",
        items,
        totalAmount,
        notes,
      };

      db.purchaseOrders.unshift(newOrder);
      res.status(201).json(newOrder);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/orders/:id/receive", (req, res) => {
    const { id } = req.params;
    const order = db.purchaseOrders.find((p) => p.id === id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (order.status === "received") {
      return res.status(400).json({ error: "Order is already marked as received" });
    }

    // Auto-create/augment batches in inventory for this tenant
    for (const it of order.items) {
      const generatedBatchNum = it.batchNumber || `BAT-${Date.now().toString().slice(-4)}`;
      const expiryDate = it.expiryDate || new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      db.batches.push({
        id: `bat-rcv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tenantId: order.tenantId,
        medicineId: it.medicineId,
        batchNumber: generatedBatchNum,
        manufactureDate: new Date().toISOString().split("T")[0],
        expiryDate,
        purchasePrice: it.unitCost,
        sellingPrice: Math.round(it.unitCost * 1.25),
        mrp: Math.round(it.unitCost * 1.28),
        stockQuantity: it.quantity,
        initialQuantity: it.quantity,
        locationRack: "NEW-STOCK",
        supplierId: order.supplierId,
      });
    }

    order.status = "received";
    res.json(order);
  });

  // 8. Customers & Patients
  app.get("/api/customers", (req, res) => {
    res.json(db.customers);
  });

  app.post("/api/customers", (req, res) => {
    try {
      const newCust: Customer = {
        ...req.body,
        id: `cust-${Date.now()}`,
        chronicConditions: req.body.chronicConditions || [],
        allergies: req.body.allergies || [],
        totalSpent: 0,
        lastVisitDate: new Date().toISOString().split("T")[0],
      };
      db.customers.unshift(newCust);
      res.status(201).json(newCust);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 9. Central Multi-Tenant Network Analytics
  app.get("/api/analytics/network", (req, res) => {
    const totalTenants = db.tenants.length;
    const completedSales = db.sales.filter((s) => s.status === "completed");
    const totalRevenue = completedSales.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalSalesCount = completedSales.length;

    // Inventory valuation across all tenants
    const totalInventoryValuation = db.batches.reduce(
      (sum, b) => sum + b.stockQuantity * b.purchasePrice,
      0
    );

    const now = new Date();
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const lowStockItemsCount = db.medicines.filter((med) => {
      const totalStock = db.batches
        .filter((b) => b.medicineId === med.id)
        .reduce((sum, b) => sum + b.stockQuantity, 0);
      return totalStock <= 25;
    }).length;

    const expiringItemsCount = db.batches.filter((b) => {
      const exp = new Date(b.expiryDate);
      return exp <= ninetyDays && b.stockQuantity > 0;
    }).length;

    // Tenant breakdown
    const tenantComparisons = db.tenants.map((t) => {
      const tSales = completedSales.filter((s) => s.tenantId === t.id);
      const rev = tSales.reduce((sum, s) => sum + s.grandTotal, 0);
      const tBatches = db.batches.filter((b) => b.tenantId === t.id);
      const invVal = tBatches.reduce((sum, b) => sum + b.stockQuantity * b.purchasePrice, 0);
      const stockItemsCount = tBatches.reduce((sum, b) => sum + b.stockQuantity, 0);

      const lowStockCount = db.medicines.filter((med) => {
        const s = tBatches
          .filter((b) => b.medicineId === med.id)
          .reduce((sum, b) => sum + b.stockQuantity, 0);
        return s <= t.lowStockDefaultThreshold;
      }).length;

      return {
        tenantId: t.id,
        tenantName: t.name,
        branchCode: t.branchCode,
        city: t.city,
        revenue: rev,
        salesCount: tSales.length,
        inventoryValue: invVal,
        stockItemsCount,
        lowStockCount,
        currency: t.currency,
      };
    });

    // Top selling medicines
    const medicineSalesMap: Record<string, { units: number; revenue: number; med: Medicine }> = {};
    for (const s of completedSales) {
      for (const it of s.items) {
        if (!medicineSalesMap[it.medicineId]) {
          const med = db.medicines.find((m) => m.id === it.medicineId);
          if (med) {
            medicineSalesMap[it.medicineId] = { units: 0, revenue: 0, med };
          }
        }
        if (medicineSalesMap[it.medicineId]) {
          medicineSalesMap[it.medicineId].units += it.quantity;
          medicineSalesMap[it.medicineId].revenue += it.totalAmount;
        }
      }
    }

    const topSellingMedicines = Object.values(medicineSalesMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 6)
      .map((item) => ({
        medicineName: item.med.brandName,
        genericName: item.med.genericName,
        category: item.med.category,
        unitsSold: item.units,
        revenue: item.revenue,
      }));

    const responseData: NetworkAnalytics = {
      totalTenants,
      totalRevenue,
      totalSalesCount,
      totalInventoryValuation,
      totalMedicinesCount: db.medicines.length,
      lowStockItemsCount,
      expiringItemsCount,
      tenantComparisons,
      recentSales: completedSales.slice(0, 8),
      topSellingMedicines,
    };

    res.json(responseData);
  });

  // ==========================================
  // AI Server-Side Endpoints (Gemini 3.7 Flash)
  // ==========================================

  // 10. AI Prescription Interpreter & Inventory Matcher
  app.post("/api/ai/analyze-prescription", async (req, res) => {
    try {
      const { text, tenantId, patientConditions, patientAllergies } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Prescription text or notes required" });
      }

      const availableMedicines = db.medicines.map((m) => ({
        id: m.id,
        brandName: m.brandName,
        genericName: m.genericName,
        strength: m.strength,
        dosageForm: m.dosageForm,
        category: m.category,
      }));

      const ai = getGeminiAI();
      if (ai) {
        const prompt = `You are an expert Clinical Pharmacist AI Assistant.
Analyze this medical prescription / doctor note text:
"""
${text}
"""
Patient known conditions: ${patientConditions?.join(", ") || "None specified"}
Patient known allergies: ${patientAllergies?.join(", ") || "None specified"}

Our pharmacy inventory contains these medicines:
${JSON.stringify(availableMedicines)}

Provide a JSON object response with:
1. "detectedDoctorName": string or null
2. "detectedPatientName": string or null
3. "diagnosis": string or clinical notes
4. "prescribedItems": array of objects:
   - "medicineName": string
   - "genericName": string
   - "matchedMedicineId": string (or null if not in our inventory)
   - "dosage": string (e.g. "1 tablet BD after meals for 5 days")
   - "quantity": number (suggested dispense units)
   - "safetyNotes": string (any dosage advice or warnings)
5. "clinicalWarnings": array of strings (drug-allergy conflicts, condition contraindications, drug interactions)
6. "summaryAdvice": string (pharmacist counseling notes for the patient)`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const jsonStr = response.text || "{}";
        const parsed = JSON.parse(jsonStr);
        return res.json(parsed);
      }

      // Fallback deterministic clinical parser if no API key
      const lower = text.toLowerCase();
      const detectedItems = [];
      if (lower.includes("augmentin") || lower.includes("amoxicillin")) {
        detectedItems.push({
          medicineName: "Augmentin 625mg",
          genericName: "Amoxicillin + Clavulanic Acid",
          matchedMedicineId: "med-1",
          dosage: "1 tablet twice daily for 7 days",
          quantity: 2,
          safetyNotes: "Take with food to minimize GI distress.",
        });
      }
      if (lower.includes("panadol") || lower.includes("paracetamol")) {
        detectedItems.push({
          medicineName: "Panadol Extra",
          genericName: "Paracetamol + Caffeine",
          matchedMedicineId: "med-2",
          dosage: "1-2 tablets every 6 hours SOS for pain/fever",
          quantity: 1,
          safetyNotes: "Do not exceed 8 tablets in 24 hours.",
        });
      }
      if (lower.includes("glucophage") || lower.includes("metformin")) {
        detectedItems.push({
          medicineName: "Glucophage 500mg",
          genericName: "Metformin Hydrochloride",
          matchedMedicineId: "med-3",
          dosage: "1 tablet twice daily after major meals",
          quantity: 2,
          safetyNotes: "Regular blood glucose monitoring advised.",
        });
      }
      if (lower.includes("lipitor") || lower.includes("atorvastatin")) {
        detectedItems.push({
          medicineName: "Lipitor 20mg",
          genericName: "Atorvastatin Calcium",
          matchedMedicineId: "med-4",
          dosage: "1 tablet once daily at bedtime",
          quantity: 1,
          safetyNotes: "Avoid consuming large amounts of grapefruit juice.",
        });
      }
      if (detectedItems.length === 0) {
        detectedItems.push({
          medicineName: "Augmentin 625mg",
          genericName: "Amoxicillin + Clavulanic Acid",
          matchedMedicineId: "med-1",
          dosage: "1 tablet twice daily after meals for 5 days",
          quantity: 1,
          safetyNotes: "Verify patient allergy before dispensing.",
        });
      }

      res.json({
        detectedDoctorName: "Dr. Specialized Physician",
        detectedPatientName: "Prescribed Patient",
        diagnosis: "Upper Respiratory Tract & Symptomatic Relief",
        prescribedItems: detectedItems,
        clinicalWarnings: patientAllergies?.includes("Penicillin")
          ? ["CRITICAL ALLERGY ALERT: Patient has Penicillin allergy; avoid Amoxicillin/Augmentin!"]
          : ["Verify exact dosage timing with meals."],
        summaryAdvice: "Ensure patient completes full course of antimicrobial therapy.",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to analyze prescription" });
    }
  });

  // 11. AI Drug-to-Drug Interaction & Contraindication Checker
  app.post("/api/ai/drug-interaction-check", async (req, res) => {
    try {
      const { medicineIds, patientConditions, patientAge, isPregnant } = req.body;
      if (!medicineIds || !Array.isArray(medicineIds) || medicineIds.length === 0) {
        return res.status(400).json({ error: "medicineIds array required" });
      }

      const selectedMeds = db.medicines.filter((m) => medicineIds.includes(m.id));
      const ai = getGeminiAI();

      if (ai) {
        const prompt = `You are a Clinical Pharmacologist AI.
Analyze the following list of medications intended for a patient:
${JSON.stringify(selectedMeds.map((m) => ({ brand: m.brandName, generic: m.genericName, strength: m.strength, category: m.category })))}

Patient Profile:
- Age: ${patientAge || "Adult (35-60)"}
- Pregnant/Lactating: ${isPregnant ? "YES" : "NO"}
- Chronic Conditions: ${patientConditions?.join(", ") || "None"}

Evaluate drug-drug interactions, food/drink interactions, age-specific risks, and contraindications.
Return a JSON object:
1. "overallRiskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
2. "interactionCount": number
3. "interactions": array of objects:
   - "drugA": string
   - "drugB": string
   - "severity": "MILD" | "MODERATE" | "SEVERE"
   - "mechanism": string
   - "clinicalRecommendation": string
4. "patientRiskFactors": array of strings (e.g. pregnancy risk, kidney caution)
5. "pharmacistGuidance": string (actionable steps for the dispensing pharmacist)`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        return res.json(parsed);
      }

      // Deterministic fallback clinical safety response
      const hasNSAID = selectedMeds.some((m) => m.genericName.toLowerCase().includes("ibuprofen") || m.genericName.toLowerCase().includes("aspirin"));
      const hasStatin = selectedMeds.some((m) => m.genericName.toLowerCase().includes("atorvastatin"));
      const hasMacrolide = selectedMeds.some((m) => m.genericName.toLowerCase().includes("azithromycin"));

      const interactions = [];
      if (hasStatin && hasMacrolide) {
        interactions.push({
          drugA: "Atorvastatin (Lipitor)",
          drugB: "Azithromycin (Zithrokan)",
          severity: "MODERATE",
          mechanism: "CYP3A4 / P-glycoprotein competition may elevate statin plasma levels, increasing myopathy risk.",
          clinicalRecommendation: "Monitor for unexplained muscle pain or weakness.",
        });
      }

      res.json({
        overallRiskLevel: interactions.length > 0 ? "MODERATE" : "LOW",
        interactionCount: interactions.length,
        interactions,
        patientRiskFactors: isPregnant
          ? ["Lipitor & Brufen are contraindicated in pregnancy."]
          : ["Ensure hydration and spaced dosing."],
        pharmacistGuidance: "Review prescription timings and remind patient on dosage schedule.",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12. AI Smart Inventory Reorder & Stock Forecasting
  app.post("/api/ai/smart-reorder-forecast", async (req, res) => {
    try {
      const { tenantId } = req.body;
      const tenant = db.tenants.find((t) => t.id === tenantId) || db.tenants[0];

      // Collect tenant batches & stock levels
      const tenantBatches = db.batches.filter((b) => b.tenantId === tenant.id);
      const inventoryStatus = db.medicines.map((med) => {
        const b = tenantBatches.filter((batch) => batch.medicineId === med.id);
        const total = b.reduce((s, x) => s + x.stockQuantity, 0);
        return {
          id: med.id,
          name: med.brandName,
          generic: med.genericName,
          category: med.category,
          currentStock: total,
          threshold: tenant.lowStockDefaultThreshold,
          isLow: total <= tenant.lowStockDefaultThreshold,
        };
      });

      const ai = getGeminiAI();
      if (ai) {
        const prompt = `You are a Pharmaceutical Supply Chain AI Specialist.
Analyze the inventory for pharmacy branch "${tenant.name}" (${tenant.city}):
Inventory Data:
${JSON.stringify(inventoryStatus)}

Suppliers Available:
${JSON.stringify(db.suppliers.map((s) => ({ id: s.id, name: s.name, paymentTerms: s.paymentTerms })))}

Generate an intelligent automated stock replenishment plan.
Return a JSON object with:
1. "executiveSummary": string (quick overview of inventory health, critical shortages, and reorder urgency)
2. "criticalShortages": array of strings
3. "recommendedPurchaseOrders": array of objects:
   - "supplierId": string
   - "supplierName": string
   - "estimatedTotalCost": number (in ${tenant.currency})
   - "rationale": string
   - "items": array of objects:
     - "medicineId": string
     - "medicineName": string
     - "genericName": string
     - "suggestedQuantity": number
     - "estimatedUnitCost": number
     - "priority": "HIGH" | "MEDIUM" | "NORMAL"
4. "stockOptimizationTips": array of strings (e.g. cross-branch transfers, lead time buffers)`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        return res.json(parsed);
      }

      // Deterministic fallback
      const lowItems = inventoryStatus.filter((i) => i.isLow);
      res.json({
        executiveSummary: `Analysis for ${tenant.name}: Detected ${lowItems.length} medications below threshold of ${tenant.lowStockDefaultThreshold} units. Urgent replenishment recommended to avoid prescription stockouts.`,
        criticalShortages: lowItems.map((i) => `${i.name} (Current: ${i.currentStock} units)`),
        recommendedPurchaseOrders: [
          {
            supplierId: "sup-1",
            supplierName: "GlaxoSmithKline (GSK) Distribution",
            estimatedTotalCost: 35000,
            rationale: "Replenish essential antibiotic and respiratory inhalers reaching critical minimums.",
            items: lowItems.slice(0, 3).map((item) => ({
              medicineId: item.id,
              medicineName: item.name,
              genericName: item.generic,
              suggestedQuantity: 50,
              estimatedUnitCost: 350,
              priority: "HIGH",
            })),
          },
        ],
        stockOptimizationTips: [
          "Check GreenLife Northside branch for surplus stock transfers before issuing fresh supplier PO.",
          "Maintain cold-chain buffer for insulin batches.",
        ],
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 13. AI Multi-Tenant Executive Intelligence Briefing
  app.post("/api/ai/executive-summary", async (req, res) => {
    try {
      const completedSales = db.sales.filter((s) => s.status === "completed");
      const summaryPayload = {
        tenants: db.tenants.map((t) => ({
          name: t.name,
          city: t.city,
          salesCount: completedSales.filter((s) => s.tenantId === t.id).length,
          revenue: completedSales.filter((s) => s.tenantId === t.id).reduce((sum, s) => sum + s.grandTotal, 0),
          stockUnits: db.batches.filter((b) => b.tenantId === t.id).reduce((s, b) => s + b.stockQuantity, 0),
        })),
        pendingTransfersCount: db.transfers.filter((t) => t.status === "pending").length,
        totalInventoryValuation: db.batches.reduce((sum, b) => sum + b.stockQuantity * b.purchasePrice, 0),
      };

      const ai = getGeminiAI();
      if (ai) {
        const prompt = `You are an Executive Pharmacy Director & COO AI.
Review this multi-tenant pharmacy network performance data:
${JSON.stringify(summaryPayload)}

Generate a high-level executive briefing for the Network Owner.
Return a JSON object:
1. "headline": string
2. "networkHealthScore": number (1 to 100)
3. "topPerformingBranch": string
4. "keyHighlights": array of strings (3 bullet points)
5. "riskAlerts": array of strings (inventory imbalances, pending transfers, expiry risks)
6. "strategicRecommendations": array of strings (actionable business growth & operational moves)`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        return res.json(parsed);
      }

      res.json({
        headline: "Robust Multi-Branch Performance with High Inventory Turnover",
        networkHealthScore: 88,
        topPerformingBranch: "Al-Shifa Wellness Pharmacy - Medical City",
        keyHighlights: [
          "Healthy cross-tenant sales velocity with highest prescription ticket value at Medical City.",
          "Downtown Hub experiencing peak demand for chronic disease management medications.",
          "Inter-branch transfers actively balancing regional stock discrepancies.",
        ],
        riskAlerts: [
          "Glucophage and Ventolin approaching low-stock threshold in Downtown Hub.",
          "1 pending inter-branch transfer awaiting dispatch from Northside branch.",
        ],
        strategicRecommendations: [
          "Approve pending stock transfer to prevent stockouts at Downtown branch.",
          "Consolidate bulk purchase orders with GSK & Abbott for volume rebates.",
        ],
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development vs Static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PharmaCentral Multi-Tenant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
