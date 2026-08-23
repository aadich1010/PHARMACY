import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Trash2, 
  Building2, 
  Layers,
  Sparkles
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { PurchaseOrder, PurchaseOrderItem } from '../types';
import { api } from '../services/api';

export const PurchaseOrders: React.FC = () => {
  const { 
    purchaseOrders, 
    tenants, 
    currentTenant, 
    suppliers, 
    inventory, 
    currentUser, 
    refreshData, 
    addNotification, 
    openAiModalWithTab 
  } = usePharmacy();

  const [isNewPoModalOpen, setIsNewPoModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || 'sup-1');
  const [selectedTenantId, setSelectedTenantId] = useState(currentTenant?.id || tenants[0]?.id || 'tenant-1');
  const [expectedDate, setExpectedDate] = useState(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [poItems, setPoItems] = useState<{ medicineId: string; quantity: number; unitCost: number }[]>([
    { medicineId: inventory[0]?.id || 'med-1', quantity: 50, unitCost: 350 },
  ]);

  const handleAddItemRow = () => {
    setPoItems([...poItems, { medicineId: inventory[0]?.id || 'med-1', quantity: 20, unitCost: 100 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const handleUpdateItemRow = (idx: number, field: string, value: any) => {
    const updated = [...poItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setPoItems(updated);
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    if (!sup) return;

    let total = 0;
    const items: PurchaseOrderItem[] = poItems.map((pi, idx) => {
      const med = inventory.find((m) => m.id === pi.medicineId);
      const lineTotal = pi.quantity * pi.unitCost;
      total += lineTotal;
      return {
        medicineId: pi.medicineId,
        medicineName: med?.brandName || 'Medicine',
        genericName: med?.genericName || 'Generic',
        dosageForm: med?.dosageForm || 'Tablet',
        strength: med?.strength || 'Standard',
        quantity: pi.quantity,
        unitCost: pi.unitCost,
        totalCost: lineTotal,
      };
    });

    try {
      await api.createPurchaseOrder({
        tenantId: selectedTenantId,
        supplierId: sup.id,
        supplierName: sup.name,
        items,
        totalAmount: total,
        expectedDate: expectedDate,
      });

      addNotification('success', 'Purchase Order Created', `PO generated for ${sup.name}.`);
      setIsNewPoModalOpen(false);
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Failed to Create PO', err.message);
    }
  };

  const handleReceivePo = async (poId: string) => {
    try {
      await api.receivePurchaseOrder(poId);
      addNotification('success', 'Stock Received & Stocked', 'New inventory batches generated and available for dispensing.');
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Receive Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Supplier Purchase Orders & Procurement
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-600/10 text-cyan-800 text-xs font-bold border border-cyan-500/20">
              {purchaseOrders.length} Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centrally manage bulk supplier ordering and receive fresh stock batches directly into branch inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-po-ai-reorder"
            onClick={() => openAiModalWithTab('reorder')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-cyan-600/15 hover:bg-cyan-600/25 text-cyan-900 font-bold text-xs border border-cyan-500/30 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-700" />
            <span>AI Smart Forecast</span>
          </button>

          <button
            id="btn-open-new-po"
            onClick={() => setIsNewPoModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-md shadow-slate-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-300" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3.5">
        {purchaseOrders.length === 0 ? (
          <div className="p-8 bg-white/50 backdrop-blur-xl rounded-3xl border border-white/60 text-center text-slate-400 text-xs shadow-sm">
            No purchase orders currently placed.
          </div>
        ) : (
          purchaseOrders.map((order) => {
            const tenant = tenants.find((t) => t.id === order.tenantId);

            return (
              <div
                key={order.id}
                className="bg-white/50 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/60 shadow-xl shadow-blue-500/5 hover:bg-white/70 hover:shadow-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 bg-white/80 border border-white/80 px-2.5 py-0.5 rounded-lg shadow-xs">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Ordered: {new Date(order.orderDate).toLocaleDateString()}
                    </span>

                    {/* Status badge */}
                    {order.status === 'ordered' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 shadow-xs">
                        <Clock className="w-3 h-3 text-amber-700" /> Awaiting Delivery
                      </span>
                    )}
                    {order.status === 'received' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-900 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Received & Stocked
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-extrabold text-slate-900">{order.supplierName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">Target Branch: <strong className="text-cyan-950 font-bold">{tenant?.name || order.tenantId}</strong></span>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1 pt-1">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="text-xs text-slate-700 flex items-center gap-2 font-medium">
                        <span>• {it.medicineName}:</span>
                        <strong className="text-slate-900 font-bold">{it.quantity} units</strong>
                        <span className="text-[10px] text-slate-400">(@ {tenant?.currency || 'PKR'} {it.unitCost})</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs font-bold text-slate-900 pt-1">
                    Total Order Value: <span className="text-cyan-900 font-extrabold">{tenant?.currency || 'PKR'} {(order.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="shrink-0 self-end md:self-center">
                  {order.status === 'ordered' && (
                    <button
                      id={`btn-receive-po-${order.id}`}
                      onClick={() => handleReceivePo(order.id)}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Receive Stock & Create Batches</span>
                    </button>
                  )}
                  {order.status === 'received' && (
                    <div className="text-right text-[11px] text-cyan-900 font-bold flex items-center gap-1.5 bg-cyan-600/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 shadow-xs">
                      <Layers className="w-3.5 h-3.5 text-cyan-700" />
                      <span>Batches Created</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Purchase Order */}
      {isNewPoModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-white/70 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <h3 className="font-bold text-base text-slate-900">Create Supplier Purchase Order</h3>
              <button
                onClick={() => setIsNewPoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm cursor-pointer shadow-xs border border-white/70"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Target Pharmacy Branch *</label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none text-xs"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none text-xs"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.contactPerson})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-cyan-950 block mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              {/* Items Table */}
              <div className="space-y-2 pt-2 border-t border-slate-200/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-950">Order Items</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-900 cursor-pointer flex items-center gap-1"
                  >
                    + Add Item Line
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/60 p-2.5 rounded-2xl border border-white/70 shadow-xs">
                      <select
                        value={item.medicineId}
                        onChange={(e) => handleUpdateItemRow(idx, 'medicineId', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-xl border border-white/80 bg-white/90 text-slate-800 text-xs shadow-xs"
                      >
                        {inventory.map((med) => (
                          <option key={med.id} value={med.id}>{med.brandName} ({med.genericName})</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemRow(idx, 'quantity', Number(e.target.value))}
                        className="w-20 px-2 py-1.5 rounded-xl border border-white/80 bg-white/90 text-slate-800 text-xs text-center shadow-xs"
                      />

                      <input
                        type="number"
                        placeholder="Unit Cost"
                        value={item.unitCost}
                        onChange={(e) => handleUpdateItemRow(idx, 'unitCost', Number(e.target.value))}
                        className="w-24 px-2 py-1.5 rounded-xl border border-white/80 bg-white/90 text-slate-800 text-xs text-center shadow-xs"
                      />

                      {poItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setIsNewPoModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold border border-white/80 shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
