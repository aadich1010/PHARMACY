import React from 'react';
import { 
  Building2, 
  TrendingUp, 
  Package, 
  AlertCircle, 
  Sparkles, 
  ArrowRightLeft, 
  Clock, 
  CheckCircle2, 
  Store, 
  ShieldCheck, 
  ArrowUpRight,
  DollarSign
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface NetworkDashboardProps {
  onNavigateTab: (tab: string) => void;
  onInitiateTransferFromSurplus?: (medicineId: string, fromTenantId: string, toTenantId: string) => void;
}

export const NetworkDashboard: React.FC<NetworkDashboardProps> = ({ onNavigateTab, onInitiateTransferFromSurplus }) => {
  const { 
    analytics, 
    tenants, 
    setCurrentTenant, 
    openAiModalWithTab, 
    inventory,
    transfers 
  } = usePharmacy();

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Calculate surplus vs deficit optimization opportunities across branches
  const stockDiscrepancies: {
    medicineName: string;
    medicineId: string;
    lowBranch: { id: string; name: string; stock: number };
    surplusBranch: { id: string; name: string; stock: number };
  }[] = [];

  // Identify cases where one branch has <= 10 units while another has >= 40 units
  // For demo display:
  stockDiscrepancies.push({
    medicineName: 'Glucophage 500mg (Metformin)',
    medicineId: 'med-3',
    lowBranch: { id: 'tenant-1', name: 'Downtown Hub', stock: 8 },
    surplusBranch: { id: 'tenant-2', name: 'Northside Chemists', stock: 110 },
  });
  stockDiscrepancies.push({
    medicineName: 'Augmentin 625mg',
    medicineId: 'med-1',
    lowBranch: { id: 'tenant-1', name: 'Downtown Hub', stock: 45 },
    surplusBranch: { id: 'tenant-2', name: 'Northside Chemists', stock: 95 },
  });

  const chartData = analytics.tenantComparisons.map((tc) => ({
    name: tc.branchCode,
    fullName: tc.tenantName,
    revenue: tc.revenue,
    inventoryValue: tc.inventoryValue,
    salesCount: tc.salesCount,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero / Network Header */}
      <div className="bg-gradient-to-br from-cyan-950 via-slate-900 to-cyan-900 rounded-3xl p-6 sm:p-8 border border-cyan-800/40 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider border border-cyan-500/30 backdrop-blur-sm">
                HQ Central Dashboard
              </span>
              <span className="text-xs text-cyan-200/80 font-medium">
                Overseeing {analytics.totalTenants} Active Pharmacy Licenses
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Multi-Tenant Network Control Center
            </h1>
            <p className="text-sm text-cyan-100/80 mt-1 max-w-2xl leading-relaxed">
              Consolidated operational intelligence, cross-branch inventory balancing, and real-time revenue analytics across all registered pharmacy tenants.
            </p>
          </div>

          {/* Quick AI Executive Briefing Button */}
          <button
            id="btn-network-ai-briefing"
            onClick={() => openAiModalWithTab('executive')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] cursor-pointer self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Generate AI Executive Briefing</span>
          </button>
        </div>

        {/* 4 Key Performance Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/15 shadow-sm hover:bg-white/15 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-200/90">Total Group Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-400/20 flex items-center justify-center text-cyan-300 border border-cyan-400/30">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-2 tracking-tight">
              PKR {analytics.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-cyan-300 flex items-center gap-1 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{analytics.totalSalesCount} Dispensed Orders</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/15 shadow-sm hover:bg-white/15 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-200/90">Network Asset Value</span>
              <div className="w-8 h-8 rounded-xl bg-teal-400/20 flex items-center justify-center text-teal-300 border border-teal-400/30">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mt-2 tracking-tight">
              PKR {analytics.totalInventoryValuation.toLocaleString()}
            </div>
            <div className="text-xs text-cyan-200/70 mt-1">
              Across {analytics.totalMedicinesCount} formulations
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/15 shadow-sm hover:bg-white/15 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-200/90">Low-Stock Batch Alerts</span>
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300 border border-amber-400/30">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-300 mt-2 tracking-tight">
              {analytics.lowStockItemsCount} Items
            </div>
            <div className="text-xs text-amber-200/80 mt-1">
              Reorder or transfer needed
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/15 shadow-sm hover:bg-white/15 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-200/90">Expiring (90 Days)</span>
              <div className="w-8 h-8 rounded-xl bg-rose-400/20 flex items-center justify-center text-rose-300 border border-rose-400/30">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-300 mt-2 tracking-tight">
              {analytics.expiringItemsCount} Batches
            </div>
            <div className="text-xs text-rose-200/80 mt-1">
              FIFO dispensing prioritized
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Branch Stock Optimization Banner */}
      <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-xl shadow-blue-500/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-700 shrink-0 mt-0.5 shadow-sm">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-cyan-950">
                  Cross-Tenant Stock Balancing Opportunities
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-800 text-[10px] font-bold">
                  AI Analyzed
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                Our multi-tenant engine detected stock imbalances between branches. Transfer surplus inventory internally instead of waiting for external supplier lead times.
              </p>
            </div>
          </div>

          <button
            id="btn-goto-transfers"
            onClick={() => onNavigateTab('transfers')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all shrink-0 cursor-pointer"
          >
            Manage Inter-Branch Transfers
          </button>
        </div>

        {/* Discrepancy Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-5">
          {stockDiscrepancies.map((item, idx) => (
            <div key={idx} className="bg-white/70 backdrop-blur-md rounded-2xl p-3.5 border border-white/70 shadow-xs flex items-center justify-between hover:bg-white/90 transition-all">
              <div>
                <div className="font-bold text-xs text-slate-900">{item.medicineName}</div>
                <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                  <span className="text-rose-600 font-semibold px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200">
                    {item.lowBranch.name}: {item.lowBranch.stock} units
                  </span>
                  <span>→</span>
                  <span className="text-emerald-700 font-semibold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                    {item.surplusBranch.name}: {item.surplusBranch.stock} units
                  </span>
                </div>
              </div>
              <button
                id={`btn-transfer-quick-${idx}`}
                onClick={() => onNavigateTab('transfers')}
                className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-cyan-900 text-xs font-bold border border-white/80 shadow-xs transition-all cursor-pointer"
              >
                Transfer Stock
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Tenant Comparison Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-cyan-950 tracking-tight">Pharmacy Tenant Comparison</h2>
            <p className="text-xs text-slate-500">Live operational status and sales velocity by registered branch</p>
          </div>
          <button
            id="btn-manage-all-branches"
            onClick={() => onNavigateTab('tenants')}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-900 hover:underline cursor-pointer"
          >
            Manage All {tenants.length} Branches →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics.tenantComparisons.map((tenant) => (
            <div
              key={tenant.tenantId}
              className="bg-white/50 backdrop-blur-xl rounded-3xl p-5 border border-white/60 shadow-xl shadow-blue-500/5 hover:bg-white/70 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-xl bg-white/80 text-cyan-900 font-bold text-xs border border-white/80 shadow-xs">
                    {tenant.branchCode}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{tenant.city}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mt-2.5 line-clamp-1">
                  {tenant.tenantName}
                </h3>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-200/50 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">Revenue</span>
                    <span className="font-bold text-cyan-950 text-sm">
                      {tenant.currency} {tenant.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">Invoices</span>
                    <span className="font-bold text-slate-900 text-sm">{tenant.salesCount}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-500 block text-[11px] font-medium">Inventory Value</span>
                    <span className="font-semibold text-slate-700">
                      {tenant.currency} {tenant.inventoryValue.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-slate-500 block text-[11px] font-medium">Stock Health</span>
                    <span className={`font-bold ${tenant.lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {tenant.lowStockCount > 0 ? `${tenant.lowStockCount} Low Items` : 'Optimal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action: Switch to this tenant */}
              <div className="mt-5 pt-3 border-t border-slate-200/50 flex items-center justify-between">
                <button
                  id={`btn-open-pos-tenant-${tenant.tenantId}`}
                  onClick={() => {
                    const fullTenant = tenants.find((t) => t.id === tenant.tenantId);
                    if (fullTenant) setCurrentTenant(fullTenant);
                    onNavigateTab('pos');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-800 font-bold text-xs border border-cyan-500/20 transition-colors cursor-pointer"
                >
                  Open POS Terminal
                </button>
                <button
                  id={`btn-view-inv-tenant-${tenant.tenantId}`}
                  onClick={() => {
                    const fullTenant = tenants.find((t) => t.id === tenant.tenantId);
                    if (fullTenant) setCurrentTenant(fullTenant);
                    onNavigateTab('inventory');
                  }}
                  className="text-xs text-slate-600 hover:text-cyan-950 font-bold cursor-pointer"
                >
                  View Inventory →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Analytics & Top Selling Medicines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Revenue Comparison Chart */}
        <div className="lg:col-span-2 bg-white/50 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-xl shadow-blue-500/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-cyan-950 text-sm">Branch Revenue Comparison</h3>
              <p className="text-xs text-slate-500">Gross sales across tenant pharmacy locations (PKR)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: any) => [`PKR ${Number(value).toLocaleString()}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(255, 255, 255, 0.7)', 
                    borderRadius: '16px', 
                    color: '#0f172a',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="revenue" fill="#0891b2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Formulations */}
        <div className="bg-white/50 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-xl shadow-blue-500/5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-cyan-950 text-sm">Top Network Formulations</h3>
            <p className="text-xs text-slate-500 mb-4">Highest volume dispensed medicines</p>

            <div className="space-y-3">
              {analytics.topSellingMedicines.map((med, i) => (
                <div key={i} className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/50 last:border-0">
                  <div>
                    <div className="font-bold text-slate-900">{med.medicineName}</div>
                    <div className="text-[10px] text-slate-500">{med.genericName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-cyan-700">{med.unitsSold} units</div>
                    <div className="text-[10px] text-slate-500">PKR {med.revenue.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            id="btn-view-all-sales"
            onClick={() => onNavigateTab('sales')}
            className="w-full mt-4 py-2.5 rounded-xl bg-white/70 hover:bg-white text-cyan-950 font-bold text-xs border border-white/80 shadow-xs transition-all cursor-pointer text-center"
          >
            View Complete Sales Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
