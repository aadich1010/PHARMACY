import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  ShieldAlert, 
  HeartPulse, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  Store
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { Customer } from '../types';
import { api } from '../services/api';

export const CustomerDirectory: React.FC<{ onSelectCustomerForPos: (customer: Customer) => void }> = ({ onSelectCustomerForPos }) => {
  const { customers, refreshData, addNotification } = usePharmacy();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    allergies: '',
    chronicConditions: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
  });

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.allergies.some((a) => a.toLowerCase().includes(q)) ||
      c.chronicConditions.some((cc) => cc.toLowerCase().includes(q))
    );
  });

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allergiesArr = newCustomer.allergies
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      const conditionsArr = newCustomer.chronicConditions
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await api.createCustomer({
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email || undefined,
        address: newCustomer.address || undefined,
        allergies: allergiesArr,
        chronicConditions: conditionsArr,
        insuranceProvider: newCustomer.insuranceProvider || undefined,
        policyNumber: newCustomer.insurancePolicyNumber || undefined,
      });

      addNotification('success', 'Patient Added', `${newCustomer.name} profile registered.`);
      setIsAddModalOpen(false);
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        allergies: '',
        chronicConditions: '',
        insuranceProvider: '',
        insurancePolicyNumber: '',
      });
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Failed to Add Patient', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Patient Registry & Chronic Disease Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-600/10 text-cyan-800 text-xs font-bold border border-cyan-500/20">
              {filteredCustomers.length} Patients
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain longitudinal patient records, drug allergy flags, chronic health condition profiles, and insurance policies.
          </p>
        </div>

        <button
          id="btn-open-add-patient"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-md shadow-slate-900/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cyan-300" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white/50 backdrop-blur-xl p-4 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-customer-search"
            type="text"
            placeholder="Search by patient name, phone, allergy, or condition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-2xl border border-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white/70 backdrop-blur-md shadow-xs text-slate-800"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-3 p-8 bg-white/50 backdrop-blur-xl rounded-3xl border border-white/60 text-center text-slate-400 text-xs shadow-sm">
            No patient records found matching search query.
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white/50 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/60 shadow-xl shadow-blue-500/5 hover:bg-white/70 hover:shadow-2xl transition-all flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{cust.name}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                      <Phone className="w-3 h-3 text-cyan-600" />
                      <span>{cust.phone}</span>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-cyan-600/20">
                    {cust.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                {/* Allergies Highlight */}
                {cust.allergies && cust.allergies.length > 0 && (
                  <div className="bg-rose-500/15 backdrop-blur-md border border-rose-500/30 rounded-2xl p-3">
                    <div className="text-[10px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Known Drug Allergies:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cust.allergies.map((allergy, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-900 font-bold text-[10px] border border-rose-500/30">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chronic Conditions */}
                {cust.chronicConditions && cust.chronicConditions.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-cyan-950 uppercase tracking-wider flex items-center gap-1">
                      <HeartPulse className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Chronic Conditions:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {cust.chronicConditions.map((cond, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-lg bg-cyan-600/10 text-cyan-900 text-[10px] font-bold border border-cyan-500/20 shadow-xs">
                          {cond}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insurance info */}
                {cust.insuranceProvider && (
                  <div className="text-[11px] text-slate-600 pt-2.5 border-t border-slate-200/50 flex items-center gap-1.5 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.insuranceProvider} (Policy: {cust.insurancePolicyNumber || 'N/A'})</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-200/50">
                <button
                  id={`btn-select-cust-${cust.id}`}
                  onClick={() => onSelectCustomerForPos(cust)}
                  className="w-full py-2.5 rounded-2xl bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-900 font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-cyan-500/20 shadow-xs cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Select for POS Dispensing</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add Patient */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-white/70 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <h3 className="font-bold text-base text-slate-900">Register New Patient Profile</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm cursor-pointer shadow-xs border border-white/70"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Mahmood"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+92 300 1234567"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-cyan-950 block mb-1">Drug Allergies (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
                  value={newCustomer.allergies}
                  onChange={(e) => setNewCustomer({ ...newCustomer, allergies: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-rose-300/80 bg-rose-50/50 text-rose-950 shadow-xs focus:ring-2 focus:ring-rose-500/20 outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Our safety engine triggers automatic POS warnings for matched allergies.</span>
              </div>

              <div>
                <label className="font-bold text-cyan-950 block mb-1">Chronic Health Conditions (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                  value={newCustomer.chronicConditions}
                  onChange={(e) => setNewCustomer({ ...newCustomer, chronicConditions: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Insurance Provider</label>
                  <input
                    type="text"
                    placeholder="e.g. State Life, Jubilee"
                    value={newCustomer.insuranceProvider}
                    onChange={(e) => setNewCustomer({ ...newCustomer, insuranceProvider: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Policy / Card #</label>
                  <input
                    type="text"
                    placeholder="e.g. POL-99281-X"
                    value={newCustomer.insurancePolicyNumber}
                    onChange={(e) => setNewCustomer({ ...newCustomer, insurancePolicyNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold border border-white/80 shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
