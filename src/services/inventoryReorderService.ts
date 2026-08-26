import { InventoryItem, Tenant, Supplier, PurchaseOrder, PurchaseOrderItem } from '../types';

export type ReorderUrgency = 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW';

export interface ReorderItemRecommendation {
  medicineId: string;
  brandName: string;
  genericName: string;
  category: string;
  dosageForm: string;
  strength: string;
  currentStock: number;
  threshold: number;
  deficit: number;
  suggestedReorderQty: number;
  estimatedUnitCost: number;
  estimatedTotalCost: number;
  supplierId: string;
  supplierName: string;
  urgency: ReorderUrgency;
  locationRacks: string[];
  unitPackSize: number;
}

export interface ReorderReport {
  tenantId: string | null;
  tenantName: string;
  evaluatedAt: number;
  thresholdUsed: number;
  totalItemsEvaluated: number;
  lowStockCount: number;
  criticalStockCount: number;
  outOfStockCount: number;
  totalEstimatedReorderCost: number;
  currency: string;
  recommendations: ReorderItemRecommendation[];
}

// Session cache to prevent re-notifying about the exact same low stock item within cooldown
const alertedItemTimestamps = new Map<string, number>();
const NOTIFICATION_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown per item for toasts

/**
 * Calculates optimal suggested reorder quantity based on threshold, pack size, and deficit.
 */
export function calculateSuggestedReorderQuantity(
  currentStock: number,
  threshold: number,
  unitPackSize: number = 1
): number {
  const deficit = Math.max(0, threshold - currentStock);
  // Target stock is typically 2.5x the threshold or at least 50 units
  const targetBuffer = Math.max(threshold * 2.5, 40);
  const rawNeeded = Math.max(deficit, targetBuffer - currentStock);
  
  // Round up to nearest unit pack size or batch multiple of 10
  const packFactor = unitPackSize > 1 ? unitPackSize : 10;
  return Math.ceil(rawNeeded / packFactor) * packFactor;
}

/**
 * Evaluates current inventory against the reorder threshold for a specific branch or network.
 */
export function evaluateInventoryReorderThresholds(
  inventory: InventoryItem[],
  tenant: Tenant | null,
  suppliers: Supplier[] = [],
  options?: { customThreshold?: number }
): ReorderReport {
  const threshold = options?.customThreshold ?? (tenant?.lowStockDefaultThreshold || 20);
  const currency = tenant?.currency || 'PKR';
  const defaultSupplier = suppliers[0] || { id: 'sup-1', name: 'Primary Pharmaceutical Wholesale' };

  let outOfStockCount = 0;
  let criticalStockCount = 0;
  let lowStockCount = 0;
  let totalEstimatedReorderCost = 0;

  const recommendations: ReorderItemRecommendation[] = [];

  for (const item of inventory) {
    const stock = item.totalStock ?? 0;
    const isBelowThreshold = stock <= threshold;

    if (isBelowThreshold) {
      lowStockCount++;

      let urgency: ReorderUrgency = 'LOW';
      if (stock === 0) {
        urgency = 'OUT_OF_STOCK';
        outOfStockCount++;
      } else if (stock <= Math.max(5, Math.floor(threshold * 0.4))) {
        urgency = 'CRITICAL';
        criticalStockCount++;
      }

      const deficit = Math.max(0, threshold - stock);
      const suggestedQty = calculateSuggestedReorderQuantity(stock, threshold, item.unitPackSize);

      // Determine estimated unit purchase cost from existing batches or standard formula
      const batchWithPrice = item.batches?.find((b) => b.purchasePrice > 0);
      const estimatedUnitCost = batchWithPrice?.purchasePrice || Math.max(50, Math.round(item.lowestPrice * 0.75) || 120);
      const lineCost = suggestedQty * estimatedUnitCost;
      totalEstimatedReorderCost += lineCost;

      // Find primary supplier from batch or default
      const batchSupplierId = item.batches?.[0]?.supplierId;
      const matchedSupplier = suppliers.find((s) => s.id === batchSupplierId) || defaultSupplier;

      const locationRacks = Array.from(
        new Set(item.batches?.map((b) => b.locationRack).filter(Boolean) as string[])
      );

      recommendations.push({
        medicineId: item.id,
        brandName: item.brandName,
        genericName: item.genericName,
        category: item.category,
        dosageForm: item.dosageForm,
        strength: item.strength,
        currentStock: stock,
        threshold,
        deficit,
        suggestedReorderQty: suggestedQty,
        estimatedUnitCost,
        estimatedTotalCost: lineCost,
        supplierId: matchedSupplier.id,
        supplierName: matchedSupplier.name,
        urgency,
        locationRacks,
        unitPackSize: item.unitPackSize || 1,
      });
    }
  }

  // Sort recommendations: Out of stock first, then Critical, then lowest stock quantity
  recommendations.sort((a, b) => {
    const urgencyWeight: Record<ReorderUrgency, number> = {
      OUT_OF_STOCK: 3,
      CRITICAL: 2,
      LOW: 1,
    };
    if (urgencyWeight[b.urgency] !== urgencyWeight[a.urgency]) {
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    }
    return a.currentStock - b.currentStock;
  });

  return {
    tenantId: tenant?.id || null,
    tenantName: tenant?.name || 'Central Network HQ',
    evaluatedAt: Date.now(),
    thresholdUsed: threshold,
    totalItemsEvaluated: inventory.length,
    lowStockCount,
    criticalStockCount,
    outOfStockCount,
    totalEstimatedReorderCost,
    currency,
    recommendations,
  };
}

/**
 * Checks inventory and fires smart, non-duplicated UI notifications if items are low.
 */
export function dispatchInventoryReorderAlerts(
  report: ReorderReport,
  notify: (type: 'warning' | 'error' | 'info' | 'success', title: string, message: string) => void,
  options?: { forceNotifyAll?: boolean }
): void {
  const now = Date.now();
  const { recommendations, tenantName, currency } = report;

  if (recommendations.length === 0) return;

  // Filter items that need notification (not triggered recently within cooldown window)
  const itemsToAlert = recommendations.filter((rec) => {
    if (options?.forceNotifyAll) return true;
    const lastAlerted = alertedItemTimestamps.get(rec.medicineId) || 0;
    return now - lastAlerted > NOTIFICATION_COOLDOWN_MS;
  });

  if (itemsToAlert.length === 0) return;

  // Mark notified
  for (const item of itemsToAlert) {
    alertedItemTimestamps.set(item.medicineId, now);
  }

  // If multiple items are low, trigger a consolidated digest notification first
  if (itemsToAlert.length > 2) {
    const outOfStockCount = itemsToAlert.filter((i) => i.urgency === 'OUT_OF_STOCK').length;
    const criticalCount = itemsToAlert.filter((i) => i.urgency === 'CRITICAL').length;

    const summaryParts: string[] = [];
    if (outOfStockCount > 0) summaryParts.push(`${outOfStockCount} out-of-stock`);
    if (criticalCount > 0) summaryParts.push(`${criticalCount} critically low`);
    summaryParts.push(`${itemsToAlert.length} total below reorder threshold of ${report.thresholdUsed} units`);

    notify(
      outOfStockCount > 0 ? 'error' : 'warning',
      `⚠️ Inventory Reorder Needed (${itemsToAlert.length} Medicines)`,
      `${tenantName}: ${summaryParts.join(', ')}. Est. reorder cost: ${currency} ${report.totalEstimatedReorderCost.toLocaleString()}.`
    );
  } else {
    // Individual item alerts for 1-2 items
    for (const rec of itemsToAlert) {
      if (rec.urgency === 'OUT_OF_STOCK') {
        notify(
          'error',
          `🚨 Out of Stock: ${rec.brandName}`,
          `${rec.brandName} (${rec.genericName}) has 0 units in ${tenantName}. Threshold is ${rec.threshold} units. Immediate reorder recommended.`
        );
      } else if (rec.urgency === 'CRITICAL') {
        notify(
          'warning',
          `⚠️ Critical Stock: ${rec.brandName}`,
          `Only ${rec.currentStock} units remaining (Threshold: ${rec.threshold}). Suggested reorder: ${rec.suggestedReorderQty} units.`
        );
      } else {
        notify(
          'info',
          `📦 Reorder Alert: ${rec.brandName}`,
          `Current stock is ${rec.currentStock} units (Below reorder point of ${rec.threshold}).`
        );
      }
    }
  }
}

/**
 * Helper to build a drafted PurchaseOrder payload from low-stock recommendations.
 */
export function buildPurchaseOrderFromReorder(
  recommendations: ReorderItemRecommendation[],
  tenantId: string,
  supplierId?: string,
  suppliers: Supplier[] = []
): Partial<PurchaseOrder> {
  const targetSupplier =
    suppliers.find((s) => s.id === supplierId) ||
    suppliers.find((s) => s.id === recommendations[0]?.supplierId) ||
    suppliers[0] || { id: 'sup-1', name: 'Primary Wholesale' };

  let totalAmount = 0;
  const items: PurchaseOrderItem[] = recommendations.map((rec) => {
    const lineTotal = rec.suggestedReorderQty * rec.estimatedUnitCost;
    totalAmount += lineTotal;
    return {
      medicineId: rec.medicineId,
      medicineName: rec.brandName,
      genericName: rec.genericName,
      dosageForm: rec.dosageForm as any,
      strength: rec.strength,
      quantity: rec.suggestedReorderQty,
      unitCost: rec.estimatedUnitCost,
      totalCost: lineTotal,
    };
  });

  return {
    tenantId,
    supplierId: targetSupplier.id,
    supplierName: targetSupplier.name,
    items,
    totalAmount,
    expectedDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: `Automated reorder draft triggered by inventory threshold check (${recommendations.length} low-stock formulations).`,
  };
}
