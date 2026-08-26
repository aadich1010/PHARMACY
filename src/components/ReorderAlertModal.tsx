import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Package, 
  RefreshCw, 
  ShoppingBag, 
  Sparkles, 
  X, 
  TrendingDown, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  Truck,
  Building2
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { ReorderItemRecommendation, ReorderUrgency } from '../services/inventoryReorderService';

interface ReorderAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ReorderAlertModal: React.FC<ReorderAlertModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    reorderReport,
    checkReorderStatus,
    createReorderPurchaseOrder,
    openAiModalWithTab,
    currentTenant,
    inventory,
  } = usePharmacy();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDraftingPo, setIsDraftingPo] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | ReorderUrgency>('ALL');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const recommendations = reorderReport?.recommendations || [];
  const currency = reorderReport?.currency || currentTenant?.currency || 'PKR';
  const threshold = reorderReport?.thresholdUsed || currentTenant?.lowStockDefaultThreshold || 20;

  const filteredItems = recommendations.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    return item.urgency === selectedFilter;
  });

  const handleRunAudit = async () => {
    setIsRefreshing(true);
    // Simulate short audit delay for high-feedback UX
    setTimeout(() => {
      checkReorderStatus({ forceNotify: true });
      setIsRefreshing(false);
    }, 450);
  };

  const handleToggleSelect = (medicineId: string) => {
    const next = new Set(selectedItemIds);
    if (next.has(medicineId)) {
      next.delete(medicineId);
    } else {
      next.add(medicineId);
    }
    setSelectedItemIds(next);
  };

  const handleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((i) => i.medicineId)));
    }
  };

  const handleDraftPo = async () => {
    setIsDraftingPo(true);
    const targetItems = selectedItemIds.size > 0
      ? recommendations.filter((r) => selectedItemIds.has(r.medicineId))
      : recommendations;

    try {
      const po = await createReorderPurchaseOrder(targetItems);
      if (po) {
        onClose();
        if (onNavigateTab) onNavigateTab('orders');
      }
    } finally {
      setIsDraftingPo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="reorder-alert-modal-container"
        className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-6 text-white relative">
          <button
            id="btn-close-reorder-modal"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Inventory Reorder Intelligence</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 border border-white/30">
                  Threshold: {threshold} units
                </span>
              </div>
              <p className="text-amber-100/90 text-sm mt-0.5">
                Automated threshold monitoring for {reorderReport?.tenantName || (currentTenant ? currentTenant.name : 'Central Pharmacy Network')}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
              <div className="text-xs font-medium text-amber-200">Below Threshold</div>
              <div className="text-2xl font-bold mt-1 text-white">{reorderReport?.lowStockCount || 0}</div>
            </div>
            <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
              <div className="text-xs font-medium text-rose-200">Out of Stock</div>
              <div className="text-2xl font-bold mt-1 text-rose-300">{reorderReport?.outOfStockCount || 0}</div>
            </div>
            <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
              <div className="text-xs font-medium text-amber-200">Critically Low</div>
              <div className="text-2xl font-bold mt-1 text-amber-300">{reorderReport?.criticalStockCount || 0}</div>
            </div>
            <div className="bg-black/20 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
              <div className="text-xs font-medium text-amber-200">Est. Reorder Cost</div>
              <div className="text-lg font-bold mt-1 text-white truncate">
                {currency} {reorderReport?.totalEstimatedReorderCost.toLocaleString() || '0'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Low ({recommendations.length})
            </button>
            <button
              onClick={() => setSelectedFilter('OUT_OF_STOCK')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedFilter === 'OUT_OF_STOCK'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Out of Stock ({reorderReport?.outOfStockCount || 0})
            </button>
            <button
              onClick={() => setSelectedFilter('CRITICAL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedFilter === 'CRITICAL'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Critical ({reorderReport?.criticalStockCount || 0})
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-reorder-run-audit"
              onClick={handleRunAudit}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
              <span>{isRefreshing ? 'Auditing...' : 'Check Thresholds'}</span>
            </button>

            <button
              id="btn-reorder-ai-forecast"
              onClick={() => {
                onClose();
                openAiModalWithTab('reorder');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Reorder Analysis</span>
            </button>
          </div>
        </div>

        {/* Modal Body: Recommendations List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 mb-3 border border-emerald-100">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Inventory Levels Fully Stocked</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No pharmaceutical formulations currently match the selected threshold filter in this branch.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all-reorders"
                    checked={selectedItemIds.size === filteredItems.length && filteredItems.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="select-all-reorders" className="cursor-pointer font-medium text-slate-700">
                    Select All ({filteredItems.length} items)
                  </label>
                </div>
                <span>
                  {selectedItemIds.size > 0
                    ? `${selectedItemIds.size} of ${filteredItems.length} items selected`
                    : 'Select items to create a tailored PO'}
                </span>
              </div>

              <div className="space-y-2.5">
                {filteredItems.map((rec) => {
                  const isSelected = selectedItemIds.has(rec.medicineId);
                  const stockPercent = Math.min(100, Math.round((rec.currentStock / rec.threshold) * 100));

                  return (
                    <div
                      key={rec.medicineId}
                      className={`p-4 rounded-2xl border transition-all ${
                        rec.urgency === 'OUT_OF_STOCK'
                          ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70'
                          : rec.urgency === 'CRITICAL'
                          ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      } ${isSelected ? 'ring-2 ring-amber-500/80' : ''}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(rec.medicineId)}
                            className="mt-1 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{rec.brandName}</span>
                              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                {rec.strength} · {rec.dosageForm}
                              </span>
                              {rec.urgency === 'OUT_OF_STOCK' && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold tracking-wide uppercase">
                                  0 Stock
                                </span>
                              )}
                              {rec.urgency === 'CRITICAL' && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold tracking-wide uppercase">
                                  Critical
                                </span>
                              )}
                              {rec.urgency === 'LOW' && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold">
                                  Low Stock
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {rec.genericName} · Category: <span className="text-slate-700">{rec.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stock Progress Bar & Deficit */}
                        <div className="sm:text-right min-w-[170px]">
                          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold">
                            <span className="text-slate-500">Current:</span>
                            <span className={rec.currentStock === 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                              {rec.currentStock} / {rec.threshold} units
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                rec.currentStock === 0
                                  ? 'bg-rose-500'
                                  : rec.urgency === 'CRITICAL'
                                  ? 'bg-amber-500'
                                  : 'bg-orange-400'
                              }`}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Reorder Recommendation Subrow */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-3 text-slate-600">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            Supplier: <strong className="text-slate-800">{rec.supplierName}</strong>
                          </span>
                          <span className="hidden sm:inline text-slate-300">|</span>
                          <span>
                            Deficit: <strong className="text-rose-700">-{rec.deficit} units</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 font-medium">
                          <span className="text-slate-600">
                            Suggested PO Qty: <strong className="text-slate-900 text-sm">+{rec.suggestedReorderQty}</strong>
                          </span>
                          <span className="text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-lg">
                            Est: {currency} {rec.estimatedTotalCost.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>
              Configured reorder policy: <strong>{threshold} units safety threshold</strong> per active branch license.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Dismiss
            </button>
            <button
              id="btn-reorder-draft-po"
              onClick={handleDraftPo}
              disabled={isDraftingPo || filteredItems.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isDraftingPo
                  ? 'Generating PO...'
                  : selectedItemIds.size > 0
                  ? `Draft PO for Selected (${selectedItemIds.size})`
                  : `Draft PO for All Below Threshold (${recommendations.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
