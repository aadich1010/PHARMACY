import React, { useState } from 'react';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { Navbar } from './components/Navbar';
import { NetworkDashboard } from './components/NetworkDashboard';
import { InventoryManager } from './components/InventoryManager';
import { PosTerminal } from './components/PosTerminal';
import { SalesHistory } from './components/SalesHistory';
import { StockTransfers } from './components/StockTransfers';
import { PurchaseOrders } from './components/PurchaseOrders';
import { CustomerDirectory } from './components/CustomerDirectory';
import { TenantsManager } from './components/TenantsManager';
import { LoginScreen } from './components/LoginScreen';
import { AiAssistantModal } from './components/AiAssistantModal';
import { ReceiptModal } from './components/ReceiptModal';
import { 
  Building2, 
  Store, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info,
  ShieldCheck,
  Package,
  Layers
} from 'lucide-react';
import { Customer } from './types';

const AppContent: React.FC = () => {
  const { 
    currentTenant, 
    setCurrentTenant, 
    tenants, 
    notifications, 
    removeNotification, 
    setSelectedCustomer 
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<string>('network');
  const [isRegisterBranchModalOpen, setIsRegisterBranchModalOpen] = useState(false);

  const handleSelectCustomerForPos = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveTab('pos');
  };

  return (
    <div className="min-h-screen bg-[#eef2f3] text-[#1e293b] flex flex-col font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* Ambient Frosted Blur Background Orbs */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse duration-1000"></div>
      <div className="fixed top-1/3 -right-24 w-80 h-80 bg-blue-200/40 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed -bottom-12 left-1/3 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed top-2/3 -left-20 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTenantModal={() => setIsRegisterBranchModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {activeTab === 'network' && (
          <NetworkDashboard
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'pos' && <PosTerminal />}

        {activeTab === 'inventory' && <InventoryManager />}

        {activeTab === 'sales' && <SalesHistory />}

        {activeTab === 'transfers' && <StockTransfers />}

        {activeTab === 'purchase-orders' && <PurchaseOrders />}

        {activeTab === 'customers' && (
          <CustomerDirectory onSelectCustomerForPos={handleSelectCustomerForPos} />
        )}

        {activeTab === 'tenants' && <TenantsManager />}
      </main>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-xl border-t border-white/50 py-4 text-xs text-slate-500 relative z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50"></span>
            <span className="font-bold text-cyan-900">PharmaCentral Multi-Tenant Platform</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">DRAP & Pharmacopeia Standard Compliant</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span>Active Tenants: <strong className="text-cyan-950 font-bold">{tenants.length} Branches</strong></span>
            <span className="text-slate-400">•</span>
            <span>Active Branch: <strong className="text-cyan-950 font-bold">{currentTenant ? currentTenant.name : 'Central Network HQ'}</strong></span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AiAssistantModal />
      <ReceiptModal />
      
      {isRegisterBranchModalOpen && (
        <TenantsManager
          isOpenModalOnly={true}
          onCloseModal={() => setIsRegisterBranchModalOpen(false)}
        />
      )}

      {/* Floating Glass Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-3.5 rounded-2xl shadow-xl pointer-events-auto flex items-start gap-2.5 backdrop-blur-xl border animate-in slide-in-from-bottom-3 duration-200 ${
              notif.type === 'success'
                ? 'bg-white/80 text-slate-800 border-emerald-500/30 shadow-emerald-500/10'
                : notif.type === 'error'
                ? 'bg-white/80 text-slate-800 border-rose-500/30 shadow-rose-500/10'
                : notif.type === 'warning'
                ? 'bg-white/80 text-slate-800 border-amber-500/30 shadow-amber-500/10'
                : 'bg-white/80 text-slate-800 border-cyan-500/30 shadow-cyan-500/10'
            }`}
          >
            {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {notif.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
            {notif.type === 'info' && <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs">
              <div className="font-bold text-slate-900">{notif.title}</div>
              <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">{notif.message}</div>
            </div>

            <button
              onClick={() => removeNotification(notif.id)}
              className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <PharmacyProvider>
      <AppContent />
    </PharmacyProvider>
  );
}
