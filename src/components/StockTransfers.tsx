import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Plus, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Package, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { StockTransfer } from '../types';
import { api } from '../services/api';

export const StockTransfers: React.FC = () => {
  const { 
    transfers, 
    tenants, 
    inventory, 
    currentUser, 
    refreshData, 
    addNotification 
  } = usePharmacy();

  const [isNewTransferModalOpen, setIsNewTransferModalOpen] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // New transfer form
  const [newTransfer, setNewTransfer] = useState({
    fromTenantId: tenants[0]?.id || '',
    toTenantId: tenants[1]?.id || '',
    medicineId: inventory[0]?.id || '',
    quantity: 10,
    notes: '',
  });

  const filteredTransfers = transfers.filter((t) => {
    if (selectedStatusFilter !== 'all' && t.status !== selectedStatusFilter) return false;
    return true;
  });

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTransfer.fromTenantId === newTransfer.toTenantId) {
      addNotification('error', 'Invalid Branches', 'Source and Destination branch cannot be the same.');
      return;
    }

    try {
      const med = inventory.find((i) => i.id === newTransfer.medicineId);
      await api.createTransfer({
        ...newTransfer,
        requestedBy: currentUser.name,
      });

      addNotification('success', 'Transfer Requested', `Stock transfer requested for ${med?.brandName}.`);
      setIsNewTransferModalOpen(false);
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Transfer Failed', err.message);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'in_transit' | 'completed' | 'cancelled') => {
    try {
      await api.updateTransferStatus(id, status);
      const statusLabels = {
        in_transit: 'Dispatched & In Transit',
        completed: 'Stock Received & Transferred',
        cancelled: 'Transfer Cancelled',
      };
      addNotification('success', 'Transfer Updated', statusLabels[status]);
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Status Update Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Inter-Branch Stock Transfer Logistics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-600/10 text-cyan-800 text-xs font-bold border border-cyan-500/20">
              {filteredTransfers.length} Transfers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Redistribute medications between pharmacy branches to prevent stockouts and optimize warehouse distribution.
          </p>
        </div>

        <button
          id="btn-open-new-transfer"
          onClick={() => setIsNewTransferModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-md shadow-slate-900/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cyan-300" />
          <span>Request Stock Transfer</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Transfers' },
          { id: 'pending', label: 'Pending Approval' },
          { id: 'in_transit', label: 'In Transit' },
          { id: 'completed', label: 'Delivered / Completed' },
          { id: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatusFilter(tab.id)}
            className={`px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
              selectedStatusFilter === tab.id
                ? 'bg-slate-900/90 text-white shadow-md shadow-slate-900/20'
                : 'bg-white/60 backdrop-blur-md text-slate-600 hover:bg-white border border-white/70 shadow-xs'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transfer Cards List */}
      <div className="space-y-3.5">
        {filteredTransfers.length === 0 ? (
          <div className="p-8 bg-white/50 backdrop-blur-xl rounded-3xl border border-white/60 text-center text-slate-400 text-xs shadow-sm">
            No stock transfers currently found for this status.
          </div>
        ) : (
          filteredTransfers.map((item) => {
            const fromTenant = tenants.find((t) => t.id === item.fromTenantId);
            const toTenant = tenants.find((t) => t.id === item.toTenantId);

            return (
              <div
                key={item.id}
                className="bg-white/50 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/60 shadow-xl shadow-blue-500/5 hover:bg-white/70 hover:shadow-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Transfer details */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 bg-white/80 border border-white/80 px-2.5 py-0.5 rounded-lg shadow-xs">
                      {item.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(item.requestedDate).toLocaleDateString()}
                    </span>

                    {/* Status Badge */}
                    {item.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-900 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 shadow-xs">
                        <Clock className="w-3 h-3 text-amber-700" /> Pending Approval
                      </span>
                    )}
                    {item.status === 'in_transit' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-900 text-[10px] font-bold border border-sky-500/30 flex items-center gap-1 shadow-xs">
                        <Truck className="w-3 h-3 text-sky-700" /> In Transit
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-900 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Completed & Stocked
                      </span>
                    )}
                    {item.status === 'cancelled' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-900 text-[10px] font-bold border border-rose-500/30 shadow-xs">
                        Cancelled
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{item.quantity} Units</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-cyan-900 font-extrabold">{item.medicineName}</span>
                  </div>

                  {/* Branch Flow Route */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/70 backdrop-blur-md p-2.5 rounded-2xl border border-white/80 shadow-xs w-fit">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{fromTenant?.name || item.fromTenantId}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-600" />
                    <div className="flex items-center gap-1.5 font-bold text-cyan-950">
                      <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{toTenant?.name || item.toTenantId}</span>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="text-[11px] text-slate-500 italic">"{item.notes}"</div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {item.status === 'pending' && (
                    <>
                      <button
                        id={`btn-dispatch-${item.id}`}
                        onClick={() => handleUpdateStatus(item.id, 'in_transit')}
                        className="px-3.5 py-2 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch Stock</span>
                      </button>
                      <button
                        id={`btn-cancel-transfer-${item.id}`}
                        onClick={() => handleUpdateStatus(item.id, 'cancelled')}
                        className="px-3.5 py-2 rounded-2xl bg-white/80 hover:bg-white text-slate-600 font-bold text-xs border border-white/80 shadow-xs transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {item.status === 'in_transit' && (
                    <button
                      id={`btn-complete-transfer-${item.id}`}
                      onClick={() => handleUpdateStatus(item.id, 'completed')}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Delivery & Receive Stock</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Request Stock Transfer */}
      {isNewTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 sm:p-7 border border-white/70 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <h3 className="font-bold text-base text-slate-900">Request Inter-Branch Stock Transfer</h3>
              <button
                onClick={() => setIsNewTransferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm cursor-pointer shadow-xs border border-white/70"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-cyan-950 block mb-1">Select Medicine *</label>
                <select
                  value={newTransfer.medicineId}
                  onChange={(e) => setNewTransfer({ ...newTransfer, medicineId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none text-xs"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.brandName} ({item.genericName}) - Total Network Stock: {item.totalStock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">From Branch (Source) *</label>
                  <select
                    value={newTransfer.fromTenantId}
                    onChange={(e) => setNewTransfer({ ...newTransfer, fromTenantId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">To Branch (Target) *</label>
                  <select
                    value={newTransfer.toTenantId}
                    onChange={(e) => setNewTransfer({ ...newTransfer, toTenantId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-cyan-950 block mb-1">Units Quantity to Transfer *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newTransfer.quantity}
                  onChange={(e) => setNewTransfer({ ...newTransfer, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-cyan-950 block mb-1">Transfer Notes & Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Urgent stock rebalancing for high prescription demand"
                  value={newTransfer.notes}
                  onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setIsNewTransferModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold border border-white/80 shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Initiate Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
