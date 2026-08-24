import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  Store, 
  Settings,
  ShieldCheck,
  TrendingUp,
  Package
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { Tenant } from '../types';
import { api } from '../services/api';

export const TenantsManager: React.FC<{ isOpenModalOnly?: boolean; onCloseModal?: () => void }> = ({ isOpenModalOnly, onCloseModal }) => {
  const { 
    tenants, 
    currentTenant, 
    setCurrentTenant, 
    refreshData, 
    addNotification 
  } = usePharmacy();

  const [isAddModalOpen, setIsAddModalOpen] = useState(isOpenModalOnly || false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [formTenant, setFormTenant] = useState({
    name: '',
    branchCode: '',
    licenseNumber: '',
    address: '',
    city: 'Lahore',
    phone: '',
    email: '',
    taxRatePercent: 5,
    currency: 'PKR',
    lowStockThreshold: 10,
    managerName: '',
  });

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTenant({
        ...formTenant,
        lowStockDefaultThreshold: formTenant.lowStockThreshold,
      });

      addNotification('success', 'Branch Registered', `${formTenant.name} has been added to the multi-tenant network.`);
      setIsAddModalOpen(false);
      if (onCloseModal) onCloseModal();
      setFormTenant({
        name: '',
        branchCode: '',
        licenseNumber: '',
        address: '',
        city: 'Lahore',
        phone: '',
        email: '',
        taxRatePercent: 5,
        currency: 'PKR',
        lowStockThreshold: 10,
        managerName: '',
      });
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Failed to Register Branch', err.message);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    try {
      await api.updateTenant(editingTenant.id, {
        ...formTenant,
        lowStockDefaultThreshold: formTenant.lowStockThreshold,
      });
      addNotification('success', 'Branch Updated', `${formTenant.name} settings updated.`);
      setEditingTenant(null);
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Update Failed', err.message);
    }
  };

  const handleStartEdit = (t: Tenant) => {
    setEditingTenant(t);
    setFormTenant({
      name: t.name,
      branchCode: t.branchCode,
      licenseNumber: t.licenseNumber,
      address: t.address,
      city: t.city,
      phone: t.phone,
      email: t.email,
      taxRatePercent: t.taxRatePercent,
      currency: t.currency,
      lowStockThreshold: t.lowStockDefaultThreshold || 10,
      managerName: t.managerName || '',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Pharmacy Network Tenants & Branches
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-600/10 text-cyan-800 text-xs font-bold border border-cyan-500/20">
              {tenants.length} Active Licenses
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure multi-tenant pharmacy branches, tax jurisdiction settings, licensing credentials, and store managers.
          </p>
        </div>

        <button
          id="btn-open-register-branch"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-md shadow-slate-900/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cyan-300" />
          <span>Register New Branch</span>
        </button>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tenants.map((tenant) => {
          const isCurrentActive = currentTenant?.id === tenant.id;

          return (
            <div
              key={tenant.id}
              className={`bg-white/50 backdrop-blur-xl rounded-3xl p-6 border shadow-xl shadow-blue-500/5 transition-all flex flex-col justify-between hover:bg-white/70 hover:shadow-2xl ${
                isCurrentActive ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-white/60'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-cyan-950 text-cyan-300 font-black text-sm flex items-center justify-center shadow-md">
                      {tenant.branchCode.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{tenant.name}</h3>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-cyan-700" />
                        <span>{tenant.city} • Code: {tenant.branchCode}</span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 text-[10px] font-bold border border-emerald-500/30">
                    Active
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 pt-2 border-t border-slate-200/50 text-xs text-slate-600 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">License #:</span>
                    <strong className="text-slate-800 font-bold">{tenant.licenseNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Branch Manager:</span>
                    <span className="font-bold text-slate-800">{tenant.managerName || 'Assigned Staff'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax & Currency:</span>
                    <span className="text-cyan-950 font-semibold">{tenant.taxRatePercent}% ({tenant.currency})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Low Stock Trigger:</span>
                    <span className="text-amber-800 font-semibold">&le; {tenant.lowStockDefaultThreshold || 10} units</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-white/70 p-3 rounded-2xl border border-white/80 shadow-xs">
                  {tenant.address}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-200/50 flex items-center justify-between gap-2">
                <button
                  id={`btn-edit-branch-${tenant.id}`}
                  onClick={() => handleStartEdit(tenant)}
                  className="px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold text-xs transition-all cursor-pointer border border-white/80 shadow-xs"
                >
                  Edit Branch
                </button>

                <button
                  id={`btn-switch-tenant-${tenant.id}`}
                  onClick={() => setCurrentTenant(tenant)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs ${
                    isCurrentActive
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/20'
                      : 'bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-900 border border-cyan-500/20'
                  }`}
                >
                  {isCurrentActive ? 'Active Branch' : 'Switch to Branch'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register / Edit Pharmacy Branch */}
      {(isAddModalOpen || editingTenant) && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-white/70 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingTenant ? `Edit ${editingTenant.name}` : 'Register New Pharmacy Branch'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTenant(null);
                  if (onCloseModal) onCloseModal();
                }}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm cursor-pointer shadow-xs border border-white/70"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingTenant ? handleUpdateTenant : handleCreateTenant} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Al-Madina Pharmacy - Phase 5"
                    value={formTenant.name}
                    onChange={(e) => setFormTenant({ ...formTenant, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LHR-04"
                    value={formTenant.branchCode}
                    onChange={(e) => setFormTenant({ ...formTenant, branchCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 uppercase shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Drug License / DRAP No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DRAP-LHR-2026-90"
                    value={formTenant.licenseNumber}
                    onChange={(e) => setFormTenant({ ...formTenant, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lahore, Karachi, Islamabad"
                    value={formTenant.city}
                    onChange={(e) => setFormTenant({ ...formTenant, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-cyan-950 block mb-1">Full Physical Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 45, Sector C, Commercial Market"
                  value={formTenant.address}
                  onChange={(e) => setFormTenant({ ...formTenant, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+92 42 35912345"
                    value={formTenant.phone}
                    onChange={(e) => setFormTenant({ ...formTenant, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Branch Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Bilal Hassan"
                    value={formTenant.managerName}
                    onChange={(e) => setFormTenant({ ...formTenant, managerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Sales Tax (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formTenant.taxRatePercent}
                    onChange={(e) => setFormTenant({ ...formTenant, taxRatePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Currency</label>
                  <input
                    type="text"
                    value={formTenant.currency}
                    onChange={(e) => setFormTenant({ ...formTenant, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Low Stock Limit</label>
                  <input
                    type="number"
                    value={formTenant.lowStockThreshold}
                    onChange={(e) => setFormTenant({ ...formTenant, lowStockThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTenant(null);
                    if (onCloseModal) onCloseModal();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold border border-white/80 shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  {editingTenant ? 'Save Branch Changes' : 'Register Branch License'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
