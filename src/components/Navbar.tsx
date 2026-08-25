import React from 'react';
import { 
  Building2, 
  Store, 
  Sparkles, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronDown,
  UserCheck,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTenantModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNewTenantModal }) => {
  const { 
    tenants, 
    currentTenant, 
    setCurrentTenant, 
    currentUser, 
    setCurrentUser,
    users, 
    inventory, 
    transfers,
    refreshData, 
    isLoading,
    openAiModalWithTab 
  } = usePharmacy();

  const lowStockCount = inventory.filter((i) => i.isLowStock).length;
  const expiringCount = inventory.filter((i) => i.isExpiringSoon || i.isExpired).length;
  const pendingTransfersCount = transfers.filter((t) => t.status === 'pending').length;

  const handleRoleChange = (role: UserRole) => {
    const matched = users.find((u) => u.role === role) || {
      id: `usr-${role}`,
      name: role === 'super_admin' ? 'Adeel Chaudhary (HQ Owner)' : `${role.toUpperCase()} User`,
      email: `${role}@pharmacypms.com`,
      role,
      tenantId: role === 'super_admin' ? null : (currentTenant?.id || 'tenant-1')
    };
    setCurrentUser(matched);
  };

  return (
    <header className="bg-white/50 backdrop-blur-xl text-slate-800 border-b border-white/60 sticky top-0 z-30 shadow-md shadow-blue-500/5">
      {/* Top Banner: Multi-Tenant Switcher & System Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-600/20 font-black text-xl text-white tracking-tighter">
              Px
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-cyan-950">PharmaCentral</span>
                <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-800 border border-cyan-500/20">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentTenant ? `${currentTenant.branchCode} • ${currentTenant.city}` : 'Central Network HQ • All Branches'}
              </p>
            </div>
          </div>

          {/* Tenant Switcher & Quick Branch Selector */}
          <div className="flex items-center gap-3">
            {/* Tenant Selector Dropdown */}
            <div className="relative group">
              <div className="flex items-center gap-2 bg-white/60 hover:bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/70 shadow-xs cursor-pointer text-sm transition-all">
                <Store className="w-4 h-4 text-cyan-700" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Active Pharmacy</div>
                  <div className="font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-[220px]">
                    {currentTenant ? currentTenant.name : '🏢 All Branches (HQ)'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-1 w-80 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/70 py-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-1.5 text-xs font-bold text-cyan-900 uppercase tracking-wider border-b border-slate-100">
                  Select Pharmacy Branch
                </div>

                {/* HQ Option */}
                <button
                  id="btn-select-hq"
                  onClick={() => setCurrentTenant(null)}
                  className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs hover:bg-cyan-50/80 transition-colors ${
                    !currentTenant ? 'bg-cyan-100/70 text-cyan-900 font-bold' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    <div>
                      <div className="font-bold text-slate-900">All Branches (Central HQ View)</div>
                      <div className="text-[10px] text-slate-500">Consolidated inventory & cross-branch sales</div>
                    </div>
                  </div>
                  {!currentTenant && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
                </button>

                <div className="my-1 border-t border-slate-100"></div>

                {/* Individual Tenants */}
                {tenants.map((tenant) => {
                  const isSelected = currentTenant?.id === tenant.id;
                  return (
                    <button
                      key={tenant.id}
                      id={`btn-select-tenant-${tenant.id}`}
                      onClick={() => setCurrentTenant(tenant)}
                      className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs hover:bg-cyan-50/80 transition-colors ${
                        isSelected ? 'bg-cyan-100/70 text-cyan-900 font-bold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        <div>
                          <div className="font-semibold text-slate-900">{tenant.name}</div>
                          <div className="text-[10px] text-slate-500">{tenant.city} • Code: {tenant.branchCode} • Tax: {tenant.taxRatePercent}%</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
                    </button>
                  );
                })}

                <div className="my-1 border-t border-slate-100"></div>

                {/* Add New Branch Option */}
                <button
                  id="btn-add-new-branch"
                  onClick={onOpenNewTenantModal}
                  className="w-full px-3.5 py-2 text-left flex items-center gap-2 text-xs text-cyan-700 hover:bg-cyan-50/80 font-bold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register New Pharmacy Branch</span>
                </button>
              </div>
            </div>

            {/* AI Assistant Trigger Button */}
            <button
              id="btn-open-ai-pharmacist"
              onClick={() => openAiModalWithTab('prescription')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-100" />
              <span className="hidden md:inline">AI Pharmacist Hub</span>
            </button>

            {/* Refresh Live Data */}
            <button
              id="btn-refresh-data"
              onClick={() => refreshData()}
              disabled={isLoading}
              title="Sync live inventory & sales"
              className="p-2 rounded-xl bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/70 text-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-600' : ''}`} />
            </button>

            {/* User Role Switcher */}
            <div className="relative group hidden sm:block">
              <div className="flex items-center gap-2 bg-white/60 hover:bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/70 shadow-xs cursor-pointer text-xs transition-all">
                <UserCheck className="w-3.5 h-3.5 text-cyan-700" />
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Role</div>
                  <div className="font-bold text-slate-800 capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>

              <div className="absolute right-0 mt-1 w-52 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/70 py-1.5 hidden group-hover:block z-50">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Persona
                </div>
                <button
                  id="role-super-admin"
                  onClick={() => handleRoleChange('super_admin')}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-cyan-50 flex items-center justify-between ${
                    currentUser.role === 'super_admin' ? 'text-cyan-900 font-bold bg-cyan-100/50' : 'text-slate-700'
                  }`}
                >
                  <span>Super Admin / Owner</span>
                </button>
                <button
                  id="role-tenant-admin"
                  onClick={() => handleRoleChange('tenant_admin')}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-cyan-50 flex items-center justify-between ${
                    currentUser.role === 'tenant_admin' ? 'text-cyan-900 font-bold bg-cyan-100/50' : 'text-slate-700'
                  }`}
                >
                  <span>Branch Manager</span>
                </button>
                <button
                  id="role-pharmacist"
                  onClick={() => handleRoleChange('pharmacist')}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-cyan-50 flex items-center justify-between ${
                    currentUser.role === 'pharmacist' ? 'text-cyan-900 font-bold bg-cyan-100/50' : 'text-slate-700'
                  }`}
                >
                  <span>Chief Pharmacist</span>
                </button>
                <button
                  id="role-cashier"
                  onClick={() => handleRoleChange('cashier')}
                  className={`w-full px-3 py-1.5 text-left text-xs hover:bg-cyan-50 flex items-center justify-between ${
                    currentUser.role === 'cashier' ? 'text-cyan-900 font-bold bg-cyan-100/50' : 'text-slate-700'
                  }`}
                >
                  <span>Cashier / Dispenser</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-2.5 border-t border-white/40 scrollbar-none text-xs font-medium">
          <button
            id="tab-network"
            onClick={() => setActiveTab('network')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'network'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-white/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Central Network HQ</span>
          </button>

          <button
            id="tab-pos"
            onClick={() => setActiveTab('pos')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-white/50'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>POS & Dispensing</span>
          </button>

          <button
            id="tab-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-white/50'
            }`}
          >
            <span>Inventory & Batches</span>
            {lowStockCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 border border-rose-200'
              }`}>
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            id="tab-sales"
            onClick={() => setActiveTab('sales')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-white/50'
            }`}
          >
            <span>Sales & Invoices</span>
          </button>

          <button
            id="tab-transfers"
            onClick={() => setActiveTab('transfers')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-white/50'
            }`}
          >
            <span>Inter-Branch Transfers</span>
            {pendingTransfersCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'transfers' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800 border border-sky-200'
              }`}>
                {pendingTransfersCount}
              </span>
            )}
          </button>

          <button
            id="tab-purchase-orders"
            onClick={() => setActiveTab('purchase-orders')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'purchase-orders'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-white/50'
            }`}
          >
            <span>Purchase Orders</span>
          </button>

          <button
            id="tab-customers"
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-white/50'
            }`}
          >
            <span>Patients & Chronic Care</span>
          </button>

          <button
            id="tab-tenants"
            onClick={() => setActiveTab('tenants')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'tenants'
                ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-900 hover:bg-white/50'
            }`}
          >
            <span>Pharmacy Branches ({tenants.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-colors">
          <Users className="w-4 h-4" />
          <span>Users</span>
        </div>
      </div>
    </header>
  );
};
