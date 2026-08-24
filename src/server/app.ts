import express, { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { store, ensureReady, isPersistent } from "./store";
import {
  Tenant,
  Medicine,
  InventoryBatch,
  Sale,
  StockTransfer,
  PurchaseOrder,
  Customer,
  NetworkAnalytics,
} from "../types";

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Wrap async route handlers so rejected promises become clean 500 responses.
type Handler = (req: Request, res: Response) => unknown | Promise<unknown>;
const ah =
  (fn: Handler) =>
  (req: Request, res: Response): void => {
    Promise.resolve(fn(req, res)).catch((err: any) => {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ error: err?.message || "Internal server error" });
      }
    });
  };

/**
 * Builds the Express application exposing only the JSON `/api` surface.
 * Static asset / SPA serving is intentionally NOT handled here so the same
 * app can run both as a long-lived server (server.ts) and as a Vercel
 * serverless function (api/[...path].ts), where Vercel serves the frontend.
 */
export function createApp(): express.Express {
  const app = express();

  // Some serverless platforms (e.g. Vercel's @vercel/node) consume the request
  // stream and pre-populate `req.body`. If we then run express.json() it would
  // try to re-read an already-drained stream and hang. Marking `_body` tells
  // body-parser the body is already parsed, so it safely skips re-reading.
  app.use((req, res, next) => {
    if (req.body !== undefined && req.body !== null) {
      (req as any)._body = true;
    }
    next();
  });

  app.use(express.json({ limit: "15mb" }));

  // Ensure the persistent store finished first-run seeding before any API call.
  app.use("/api", (req, res, next) => {
    ensureReady()
      .then(() => next())
      .catch((err: any) => {
        console.error("[store] initialization failed", err);
        res.status(500).json({ error: "Database initialization failed: " + (err?.message || err) });
      });
  });

  // --- API Endpoints ---

  // 1. Health check
  app.get(
    "/api/health",
    ah(async (req, res) => {
      const tenants = await store.tenants.all();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        persistence: isPersistent() ? "supabase" : "in-memory",
        tenantsCount: tenants.length,
      });
    })
  );

  // 2. Tenants CRUD
  app.get(
    "/api/tenants",
    ah(async (req, res) => {
      res.json(await store.tenants.all());
    })
  );

  app.post(
    "/api/tenants",
    ah(async (req, res) => {
      const newTenant: Tenant = {
        ...req.body,
        id: `tenant-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
        isActive: req.body.isActive ?? true,
        taxRatePercent: Number(req.body.taxRatePercent) || 5.0,
        lowStockDefaultThreshold: Number(req.body.lowStockDefaultThreshold) || 20,
        expiryWarningDays: Number(req.body.expiryWarningDays) || 90,
      };
      await store.tenants.insert(newTenant);

      // Seed initial common essential medicines batches for the new pharmacy branch
      const medicines = await store.medicines.all();
      const suppliers = await store.suppliers.all();
      const initialSeedMedicines = medicines.slice(0, 6);
      const seedBatches: InventoryBatch[] = initialSeedMedicines.map((med, idx) => ({
        id: `bat-new-${Date.now()}-${idx}`,
        tenantId: newTenant.id,
        medicineId: med.id,
        batchNumber: `BAT-${newTenant.branchCode}-${idx + 101}`,
        manufactureDate: "2024-03-01",
        expiryDate: "2027-03-01",
        purchasePrice: 150 + idx * 30,
        sellingPrice: 200 + idx * 40,
        mrp: 210 + idx * 40,
        stockQuantity: 30 + idx * 5,
        initialQuantity: 50,
        locationRack: `R-${idx + 1}`,
        supplierId: suppliers[0]?.id || "sup-1",
      }));
      await store.batches.insertMany(seedBatches);

      res.status(201).json(newTenant);
    })
  );

  app.put(
    "/api/tenants/:id",
    ah(async (req, res) => {
      const updated = await store.tenants.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Tenant not found" });
      res.json(updated);
    })
  );

  // 3. Users & Auth Simulation
  app.get(
    "/api/users",
    ah(async (req, res) => {
      res.json(await store.users.all());
    })
  );

  // 4. Medicines Catalog & Tenant Inventory
  app.get(
    "/api/medicines",
    ah(async (req, res) => {
      res.json(await store.medicines.all());
    })
  );

  app.post(
    "/api/medicines",
    ah(async (req, res) => {
      const newMed: Medicine = {
        ...req.body,
        id: `med-${Date.now()}`,
        requiresPrescription: req.body.requiresPrescription ?? false,
        unitPackSize: Number(req.body.unitPackSize) || 1,
      };
      await store.medicines.insert(newMed);
      res.status(201).json(newMed);
    })
  );

  // Tenant-specific aggregated Inventory (with Batches)
  app.get(
    "/api/inventory",
    ah(async (req, res) => {
      const { tenantId, search, category, lowStockOnly, expiringSoonOnly } = req.query;
      const now = new Date();
      const ninetyDaysFuture = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const [tenants, medicines, allBatches] = await Promise.all([
        store.tenants.all(),
        store.medicines.all(),
        store.batches.all(),
      ]);

      const tenant = tenants.find((t) => t.id === tenantId);
      const lowStockThreshold = tenant?.lowStockDefaultThreshold || 20;

      let items = medicines.map((med) => {
        const batches = allBatches.filter(
          (b) => (!tenantId || b.tenantId === tenantId) && b.medicineId === med.id
        );
        const totalStock = batches.reduce((sum, b) => sum + b.stockQuantity, 0);

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
    })
  );

  // Batches CRUD
  app.get(
    "/api/batches",
    ah(async (req, res) => {
      const { tenantId, medicineId } = req.query;
      let result = await store.batches.all();
      if (tenantId) result = result.filter((b) => b.tenantId === tenantId);
      if (medicineId) result = result.filter((b) => b.medicineId === medicineId);
      res.json(result);
    })
  );

  app.post(
    "/api/batches",
    ah(async (req, res) => {
      const newBatch: InventoryBatch = {
        ...req.body,
        id: `bat-${Date.now()}`,
        purchasePrice: Number(req.body.purchasePrice) || 0,
        sellingPrice: Number(req.body.sellingPrice) || 0,
        mrp: Number(req.body.mrp) || Number(req.body.sellingPrice) || 0,
        stockQuantity: Number(req.body.stockQuantity) || 0,
        initialQuantity: Number(req.body.stockQuantity) || 0,
      };
      await store.batches.insert(newBatch);
      res.status(201).json(newBatch);
    })
  );

  app.put(
    "/api/batches/:id",
    ah(async (req, res) => {
      const batches = await store.batches.all();
      const existing = batches.find((b) => b.id === req.params.id);
      if (!existing) return res.status(404).json({ error: "Batch not found" });
      const patch: Partial<InventoryBatch> = {
        ...req.body,
        stockQuantity: Number(req.body.stockQuantity ?? existing.stockQuantity),
        sellingPrice: Number(req.body.sellingPrice ?? existing.sellingPrice),
        purchasePrice: Number(req.body.purchasePrice ?? existing.purchasePrice),
      };
      const updated = await store.batches.update(req.params.id, patch);
      res.json(updated);
    })
  );

  // 5. Point of Sale & Sales Transactions
  app.get(
    "/api/sales",
    ah(async (req, res) => {
      const { tenantId } = req.query;
      let list = await store.sales.all();
      if (tenantId) list = list.filter((s) => s.tenantId === tenantId);
      list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(list);
    })
  );

  app.post(
    "/api/sales",
    ah(async (req, res) => {
      const saleData: Partial<Sale> = req.body;
      if (!saleData.tenantId || !saleData.items || saleData.items.length === 0) {
        return res.status(400).json({ error: "Invalid sale payload: tenantId and items required" });
      }

      // Validate stock for all items first, then apply deductions (avoids partial writes).
      const allBatches = await store.batches.all();
      const deductions: { id: string; newQty: number }[] = [];
      for (const item of saleData.items) {
        const batch = allBatches.find((b) => b.id === item.batchId);
        if (batch) {
          if (batch.stockQuantity < item.quantity) {
            return res.status(400).json({
              error: `Insufficient stock for ${item.medicineName} in batch ${batch.batchNumber}. Available: ${batch.stockQuantity}`,
            });
          }
          deductions.push({ id: batch.id, newQty: batch.stockQuantity - item.quantity });
        }
      }
      for (const d of deductions) {
        await store.batches.update(d.id, { stockQuantity: d.newQty });
      }

      // Update customer totalSpent and lastVisitDate if customer provided
      if (saleData.customerId) {
        const customers = await store.customers.all();
        const customer = customers.find((c) => c.id === saleData.customerId);
        if (customer) {
          await store.customers.update(customer.id, {
            totalSpent: customer.totalSpent + (saleData.grandTotal || 0),
            lastVisitDate: new Date().toISOString().split("T")[0],
          });
        }
      }

      const tenants = await store.tenants.all();
      const tenant = tenants.find((t) => t.id === saleData.tenantId);
      const sales = await store.sales.all();
      const invoiceCount = sales.filter((s) => s.tenantId === saleData.tenantId).length + 1;
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

      await store.sales.insert(newSale);
      res.status(201).json(newSale);
    })
  );

  // Refund Sale
  app.post(
    "/api/sales/:id/refund",
    ah(async (req, res) => {
      const sales = await store.sales.all();
      const sale = sales.find((s) => s.id === req.params.id);
      if (!sale) return res.status(404).json({ error: "Sale not found" });
      if (sale.status === "refunded") {
        return res.status(400).json({ error: "Sale is already refunded" });
      }

      // Restore stock
      const allBatches = await store.batches.all();
      for (const item of sale.items) {
        const batch = allBatches.find((b) => b.id === item.batchId);
        if (batch) {
          await store.batches.update(batch.id, { stockQuantity: batch.stockQuantity + item.quantity });
        }
      }

      const updated = await store.sales.update(sale.id, { status: "refunded" });
      res.json(updated);
    })
  );

  // 6. Inter-Tenant Stock Transfers
  app.get(
    "/api/transfers",
    ah(async (req, res) => {
      const { tenantId } = req.query;
      let list = await store.transfers.all();
      if (tenantId) {
        list = list.filter((t) => t.fromTenantId === tenantId || t.toTenantId === tenantId);
      }
      list = [...list].sort(
        (a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()
      );
      res.json(list);
    })
  );

  app.post(
    "/api/transfers",
    ah(async (req, res) => {
      const { fromTenantId, toTenantId, medicineId, quantity, requestedBy, notes } = req.body;
      const [tenants, medicines, allBatches] = await Promise.all([
        store.tenants.all(),
        store.medicines.all(),
        store.batches.all(),
      ]);
      const fromTenant = tenants.find((t) => t.id === fromTenantId);
      const toTenant = tenants.find((t) => t.id === toTenantId);
      const medicine = medicines.find((m) => m.id === medicineId);

      if (!fromTenant || !toTenant || !medicine) {
        return res.status(400).json({ error: "Invalid transfer request parameters" });
      }

      const sourceBatch =
        allBatches.find(
          (b) => b.tenantId === fromTenantId && b.medicineId === medicineId && b.stockQuantity >= quantity
        ) || allBatches.find((b) => b.tenantId === fromTenantId && b.medicineId === medicineId);

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

      await store.transfers.insert(newTransfer);
      res.status(201).json(newTransfer);
    })
  );

  app.put(
    "/api/transfers/:id/status",
    ah(async (req, res) => {
      const { status } = req.body;
      const transfers = await store.transfers.all();
      const transfer = transfers.find((t) => t.id === req.params.id);
      if (!transfer) return res.status(404).json({ error: "Transfer not found" });

      const patch: Partial<StockTransfer> = { status };

      if (status === "completed" && transfer.status !== "completed") {
        const allBatches = await store.batches.all();
        const sourceBatch = allBatches.find(
          (b) => b.tenantId === transfer.fromTenantId && b.batchNumber === transfer.batchNumber
        );
        if (sourceBatch) {
          await store.batches.update(sourceBatch.id, {
            stockQuantity: Math.max(0, sourceBatch.stockQuantity - transfer.quantity),
          });
        }

        const destBatch = allBatches.find(
          (b) => b.tenantId === transfer.toTenantId && b.batchNumber === transfer.batchNumber
        );
        if (destBatch) {
          await store.batches.update(destBatch.id, {
            stockQuantity: destBatch.stockQuantity + transfer.quantity,
          });
        } else if (sourceBatch) {
          await store.batches.insert({
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
        patch.completedDate = new Date().toISOString();
      }

      const updated = await store.transfers.update(req.params.id, patch);
      res.json(updated);
    })
  );

  // 7. Purchase Orders & Suppliers
  app.get(
    "/api/suppliers",
    ah(async (req, res) => {
      res.json(await store.suppliers.all());
    })
  );

  app.get(
    "/api/orders",
    ah(async (req, res) => {
      const { tenantId } = req.query;
      let list = await store.purchaseOrders.all();
      if (tenantId) list = list.filter((p) => p.tenantId === tenantId);
      list = [...list].sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );
      res.json(list);
    })
  );

  app.post(
    "/api/orders",
    ah(async (req, res) => {
      const { tenantId, supplierId, items, notes } = req.body;
      const [suppliers, tenants, orders] = await Promise.all([
        store.suppliers.all(),
        store.tenants.all(),
        store.purchaseOrders.all(),
      ]);
      const supplier = suppliers.find((s) => s.id === supplierId);
      const tenant = tenants.find((t) => t.id === tenantId);

      const totalAmount = items.reduce(
        (sum: number, it: any) => sum + it.quantity * it.unitCost,
        0
      );
      const orderCount = orders.filter((p) => p.tenantId === tenantId).length + 1;
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

      await store.purchaseOrders.insert(newOrder);
      res.status(201).json(newOrder);
    })
  );

  app.put(
    "/api/orders/:id/receive",
    ah(async (req, res) => {
      const orders = await store.purchaseOrders.all();
      const order = orders.find((p) => p.id === req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (order.status === "received") {
        return res.status(400).json({ error: "Order is already marked as received" });
      }

      // Auto-create/augment batches in inventory for this tenant
      for (const it of order.items) {
        const generatedBatchNum = it.batchNumber || `BAT-${Date.now().toString().slice(-4)}`;
        const expiryDate =
          it.expiryDate ||
          new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        await store.batches.insert({
          id: `bat-rcv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

      const updated = await store.purchaseOrders.update(order.id, { status: "received" });
      res.json(updated);
    })
  );

  // 8. Customers & Patients
  app.get(
    "/api/customers",
    ah(async (req, res) => {
      const list = await store.customers.all();
      const sorted = [...list].sort(
        (a, b) => new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime()
      );
      res.json(sorted);
    })
  );

  app.post(
    "/api/customers",
    ah(async (req, res) => {
      const newCust: Customer = {
        ...req.body,
        id: `cust-${Date.now()}`,
        chronicConditions: req.body.chronicConditions || [],
        allergies: req.body.allergies || [],
        totalSpent: 0,
        lastVisitDate: new Date().toISOString().split("T")[0],
      };
      await store.customers.insert(newCust);
      res.status(201).json(newCust);
    })
  );

  // 9. Central Multi-Tenant Network Analytics
  app.get(
    "/api/analytics/network",
    ah(async (req, res) => {
      const [tenants, medicines, allBatches, allSales] = await Promise.all([
        store.tenants.all(),
        store.medicines.all(),
        store.batches.all(),
        store.sales.all(),
      ]);

      const totalTenants = tenants.length;
      const completedSales = allSales.filter((s) => s.status === "completed");
      const totalRevenue = completedSales.reduce((sum, s) => sum + s.grandTotal, 0);
      const totalSalesCount = completedSales.length;

      const totalInventoryValuation = allBatches.reduce(
        (sum, b) => sum + b.stockQuantity * b.purchasePrice,
        0
      );

      const now = new Date();
      const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const lowStockItemsCount = medicines.filter((med) => {
        const totalStock = allBatches
          .filter((b) => b.medicineId === med.id)
          .reduce((sum, b) => sum + b.stockQuantity, 0);
        return totalStock <= 25;
      }).length;

      const expiringItemsCount = allBatches.filter((b) => {
        const exp = new Date(b.expiryDate);
        return exp <= ninetyDays && b.stockQuantity > 0;
      }).length;

      const tenantComparisons = tenants.map((t) => {
        const tSales = completedSales.filter((s) => s.tenantId === t.id);
        const rev = tSales.reduce((sum, s) => sum + s.grandTotal, 0);
        const tBatches = allBatches.filter((b) => b.tenantId === t.id);
        const invVal = tBatches.reduce((sum, b) => sum + b.stockQuantity * b.purchasePrice, 0);
        const stockItemsCount = tBatches.reduce((sum, b) => sum + b.stockQuantity, 0);

        const lowStockCount = medicines.filter((med) => {
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

      const medicineSalesMap: Record<string, { units: number; revenue: number; med: Medicine }> = {};
      for (const s of completedSales) {
        for (const it of s.items) {
          if (!medicineSalesMap[it.medicineId]) {
            const med = medicines.find((m) => m.id === it.medicineId);
            if (med) medicineSalesMap[it.medicineId] = { units: 0, revenue: 0, med };
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
        totalMedicinesCount: medicines.length,
        lowStockItemsCount,
        expiringItemsCount,
        tenantComparisons,
        recentSales: completedSales.slice(0, 8),
        topSellingMedicines,
      };

      res.json(responseData);
    })
  );

  // ==========================================
  // AI Server-Side Endpoints (Gemini 2.5 Flash)
  // ==========================================

  // 10. AI Prescription Interpreter & Inventory Matcher
  app.post(
    "/api/ai/analyze-prescription",
    ah(async (req, res) => {
      const { text, tenantId, patientConditions, patientAllergies } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Prescription text or notes required" });
      }

      const medicines = await store.medicines.all();
      const availableMedicines = medicines.map((m) => ({
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
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });

        const parsed = JSON.parse(response.text || "{}");
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
    })
  );

  // 11. AI Drug-to-Drug Interaction & Contraindication Checker
  app.post(
    "/api/ai/drug-interaction-check",
    ah(async (req, res) => {
      const { medicineIds, patientConditions, patientAge, isPregnant } = req.body;
      if (!medicineIds || !Array.isArray(medicineIds) || medicineIds.length === 0) {
        return res.status(400).json({ error: "medicineIds array required" });
      }

      const medicines = await store.medicines.all();
      const selectedMeds = medicines.filter((m) => medicineIds.includes(m.id));
      const ai = getGeminiAI();

      if (ai) {
        const prompt = `You are a Clinical Pharmacologist AI.
Analyze the following list of medications intended for a patient:
${JSON.stringify(
  selectedMeds.map((m) => ({
    brand: m.brandName,
    generic: m.genericName,
    strength: m.strength,
    category: m.category,
  }))
)}

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
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });

        const parsed = JSON.parse(response.text || "{}");
        return res.json(parsed);
      }

      const hasStatin = selectedMeds.some((m) => m.genericName.toLowerCase().includes("atorvastatin"));
      const hasMacrolide = selectedMeds.some((m) => m.genericName.toLowerCase().includes("azithromycin"));

      const interactions = [];
      if (hasStatin && hasMacrolide) {
        interactions.push({
          drugA: "Atorvastatin (Lipitor)",
          drugB: "Azithromycin (Zithrokan)",
          severity: "MODERATE",
          mechanism:
            "CYP3A4 / P-glycoprotein competition may elevate statin plasma levels, increasing myopathy risk.",
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
    })
  );

  // 12. AI Smart Inventory Reorder & Stock Forecasting
  app.post(
    "/api/ai/smart-reorder-forecast",
    ah(async (req, res) => {
      const { tenantId } = req.body;
      const [tenants, medicines, allBatches, suppliers] = await Promise.all([
        store.tenants.all(),
        store.medicines.all(),
        store.batches.all(),
        store.suppliers.all(),
      ]);
      const tenant = tenants.find((t) => t.id === tenantId) || tenants[0];

      const tenantBatches = allBatches.filter((b) => b.tenantId === tenant.id);
      const inventoryStatus = medicines.map((med) => {
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
${JSON.stringify(suppliers.map((s) => ({ id: s.id, name: s.name, paymentTerms: s.paymentTerms })))}

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
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });

        const parsed = JSON.parse(response.text || "{}");
        return res.json(parsed);
      }

      const lowItems = inventoryStatus.filter((i) => i.isLow);
      res.json({
        executiveSummary: `Analysis for ${tenant.name}: Detected ${lowItems.length} medications below threshold of ${tenant.lowStockDefaultThreshold} units. Urgent replenishment recommended to avoid prescription stockouts.`,
        criticalShortages: lowItems.map((i) => `${i.name} (Current: ${i.currentStock} units)`),
        recommendedPurchaseOrders: [
          {
            supplierId: "sup-1",
            supplierName: "GlaxoSmithKline (GSK) Distribution",
            estimatedTotalCost: 35000,
            rationale:
              "Replenish essential antibiotic and respiratory inhalers reaching critical minimums.",
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
    })
  );

  // 13. AI Multi-Tenant Executive Intelligence Briefing
  app.post(
    "/api/ai/executive-summary",
    ah(async (req, res) => {
      const [tenants, allBatches, allSales, allTransfers] = await Promise.all([
        store.tenants.all(),
        store.batches.all(),
        store.sales.all(),
        store.transfers.all(),
      ]);
      const completedSales = allSales.filter((s) => s.status === "completed");
      const summaryPayload = {
        tenants: tenants.map((t) => ({
          name: t.name,
          city: t.city,
          salesCount: completedSales.filter((s) => s.tenantId === t.id).length,
          revenue: completedSales
            .filter((s) => s.tenantId === t.id)
            .reduce((sum, s) => sum + s.grandTotal, 0),
          stockUnits: allBatches
            .filter((b) => b.tenantId === t.id)
            .reduce((s, b) => s + b.stockQuantity, 0),
        })),
        pendingTransfersCount: allTransfers.filter((t) => t.status === "pending").length,
        totalInventoryValuation: allBatches.reduce((sum, b) => sum + b.stockQuantity * b.purchasePrice, 0),
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
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
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
    })
  );

  return app;
}
