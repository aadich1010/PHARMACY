import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2,
  Calendar, 
  Package, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Barcode,
  ThermometerSnowflake,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { InventoryItem, MedicineCategory, DosageForm, InventoryBatch } from '../types';
import { api } from '../services/api';

const CATEGORIES: ('All' | MedicineCategory)[] = [
  'All',
  'Antibiotics',
  'Analgesics & Pain',
  'Cardiovascular',
  'Diabetes & Endocrine',
  'Respiratory',
  'Gastrointestinal',
  'Pediatric',
  'Dermatological',
  'Vitamins & Supplements',
  'Psychiatric & Neuro',
  'Medical Devices'
];

export const InventoryManager: React.FC = () => {
  const { 
    inventory, 
    currentTenant, 
    tenants, 
    suppliers, 
    refreshData, 
    addNotification, 
    openAiModalWithTab, 
    addToCart,
    reorderReport,
    setIsReorderAlertOpen,
    checkReorderStatus,
    createReorderPurchaseOrder
  } = usePharmacy();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterType, setFilterType] = useState<'all' | 'low-stock' | 'expiring-soon' | 'rx-only'>('all');
  const [expandedMedicineId, setExpandedMedicineId] = useState<string | null>(null);
  const [isAuditingReorders, setIsAuditingReorders] = useState(false);

  // Modals
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [selectedMedForBatch, setSelectedMedForBatch] = useState<InventoryItem | null>(null);

  // New Medicine Form State
  const [newMed, setNewMed] = useState({
    brandName: '',
    genericName: '',
    sku: '',
    barcode: '',
    category: 'Antibiotics' as MedicineCategory,
    dosageForm: 'Tablet' as DosageForm,
    strength: '',
    manufacturer: '',
    description: '',
    defaultStorage: 'Room Temperature' as 'Room Temperature' | 'Cold Chain (2-8°C)' | 'Store below 25°C',
    requiresPrescription: false,
    unitPackSize: 1,
  });

  // New Batch Form State
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    manufactureDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    purchasePrice: 100,
    sellingPrice: 130,
    mrp: 135,
    stockQuantity: 50,
    locationRack: 'A-01',
    supplierId: suppliers[0]?.id || 'sup-1',
    isControlledSubstance: false,
  });

  // Quick adjust batch stock
  const [adjustingBatchId, setAdjustingBatchId] = useState<string | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(0);

  // Filter items
  const filteredInventory = inventory.filter((item) => {
    // Search query
    const q = search.toLowerCase();
    const matchesSearch = 
      item.brandName.toLowerCase().includes(q) ||
      item.genericName.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.barcode.includes(q);

    if (!matchesSearch) return false;

    // Category
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

    // Filter Type
    if (filterType === 'low-stock' && !item.isLowStock) return false;
    if (filterType === 'expiring-soon' && !item.isExpiringSoon && !item.isExpired) return false;
    if (filterType === 'rx-only' && !item.requiresPrescription) return false;

    return true;
  });

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const generatedSku = newMed.sku || `${newMed.brandName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const generatedBarcode = newMed.barcode || `8964${Math.floor(100000000 + Math.random() * 900000000)}`;

      await api.createMedicine({
        ...newMed,
        sku: generatedSku,
        barcode: generatedBarcode,
      });

      addNotification('success', 'Medicine Added', `${newMed.brandName} added to master catalog.`);
      setIsAddMedModalOpen(false);
      setNewMed({
        brandName: '',
        genericName: '',
        sku: '',
        barcode: '',
        category: 'Antibiotics',
        dosageForm: 'Tablet',
        strength: '',
        manufacturer: '',
        description: '',
        defaultStorage: 'Room Temperature',
        requiresPrescription: false,
        unitPackSize: 1,
      });
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Failed to Add Medicine', err.message);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedForBatch || !currentTenant) {
      addNotification('error', 'Select Branch', 'Please select a specific pharmacy branch to add inventory batches.');
      return;
    }

    try {
      await api.createBatch({
        ...newBatch,
        medicineId: selectedMedForBatch.id,
        tenantId: currentTenant.id,
      });

      addNotification('success', 'Batch Added', `Batch ${newBatch.batchNumber} added for ${selectedMedForBatch.brandName}.`);
      setIsAddBatchModalOpen(false);
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Failed to Add Batch', err.message);
    }
  };

  const handleSaveStockAdjustment = async (batchId: string) => {
    try {
      await api.updateBatch(batchId, { stockQuantity: adjustQuantity });
      addNotification('success', 'Stock Adjusted', `Batch stock updated to ${adjustQuantity} units.`);
      setAdjustingBatchId(null);
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Failed to Adjust Stock', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {currentTenant ? `${currentTenant.name} Inventory` : 'Consolidated Network Inventory'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-600/10 text-cyan-800 text-xs font-bold border border-cyan-500/20">
              {filteredInventory.length} Medicines
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentTenant 
              ? `Manage batch stock, expiry alerts, and rack locations for branch ${currentTenant.branchCode}.` 
              : 'Viewing aggregate stock across all tenant pharmacy branches.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Reorder Threshold Audit */}
          <button
            id="btn-run-threshold-audit"
            onClick={() => {
              setIsAuditingReorders(true);
              setTimeout(() => {
                checkReorderStatus({ forceNotify: true });
                setIsAuditingReorders(false);
              }, 400);
            }}
            disabled={isAuditingReorders}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <AlertTriangle className={`w-4 h-4 text-amber-600 ${isAuditingReorders ? 'animate-bounce' : ''}`} />
            <span>{isAuditingReorders ? 'Auditing...' : 'Check Thresholds'}</span>
          </button>

          {/* AI Reorder Assistant */}
          <button
            id="btn-ai-forecast-reorder"
            onClick={() => openAiModalWithTab('reorder')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer hover:scale-[1.01]"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
            <span>AI Reorder Plan</span>
          </button>

          {/* Add Medicine to Catalog */}
          <button
            id="btn-open-add-med-modal"
            onClick={() => setIsAddMedModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-md shadow-slate-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-300" />
            <span>New Formulation</span>
          </button>
        </div>
      </div>

      {/* Interactive Inventory Reorder Alert Banner */}
      {reorderReport && reorderReport.lowStockCount > 0 && (
        <div 
          id="inventory-reorder-alert-banner"
          className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/10 border border-amber-300/80 rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-lg shadow-amber-500/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {reorderReport.lowStockCount} Medicines Below Reorder Threshold ({reorderReport.thresholdUsed} units)
                </span>
                {reorderReport.outOfStockCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
                    {reorderReport.outOfStockCount} Out of Stock
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {reorderReport.tenantName}: Estimated replenishment cost is{' '}
                <strong className="text-amber-900 font-bold">
                  {reorderReport.currency} {reorderReport.totalEstimatedReorderCost.toLocaleString()}
                </strong>
                . Action required to avoid stockouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              id="btn-banner-view-reorders"
              onClick={() => setIsReorderAlertOpen(true)}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              Open Reorder Center
            </button>
            <button
              id="btn-banner-filter-low"
              onClick={() => setFilterType('low-stock')}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl border border-amber-300 bg-white/80 hover:bg-white text-amber-900 font-semibold text-xs transition-colors cursor-pointer"
            >
              Filter in Table
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-inventory-search"
              type="text"
              placeholder="Search by brand, generic name, SKU or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-2xl border border-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white/70 backdrop-blur-md shadow-xs text-slate-800"
            />
          </div>

          {/* Quick Filter Status Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              id="filter-all"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterType === 'all' 
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20' 
                  : 'bg-white/60 hover:bg-white/90 text-slate-600 border border-white/60 shadow-xs'
              }`}
            >
              All Items
            </button>
            <button
              id="filter-low-stock"
              onClick={() => setFilterType('low-stock')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'low-stock' 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20' 
                  : 'bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 border border-amber-500/20 shadow-xs'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Alerts</span>
            </button>
            <button
              id="filter-expiring"
              onClick={() => setFilterType('expiring-soon')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'expiring-soon' 
                  ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20' 
                  : 'bg-rose-500/10 text-rose-900 hover:bg-rose-500/20 border border-rose-500/20 shadow-xs'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Expiring Soon</span>
            </button>
            <button
              id="filter-rx"
              onClick={() => setFilterType('rx-only')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'rx-only' 
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20' 
                  : 'bg-blue-500/10 text-blue-900 hover:bg-blue-500/20 border border-blue-500/20 shadow-xs'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Prescription Only</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 border-t border-slate-200/50 scrollbar-none text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white/50 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/60 border-b border-slate-200/50 text-cyan-950 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-4">Medicine & Strength</th>
                <th className="px-5 py-4">Category & Form</th>
                <th className="px-5 py-4">Active Batches</th>
                <th className="px-5 py-4">Current Stock</th>
                <th className="px-5 py-4">Retail Price</th>
                <th className="px-5 py-4">Nearest Expiry</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 text-slate-700">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 font-medium">
                    No medications found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isExpanded = expandedMedicineId === item.id;
                  const availableBatches = item.batches || [];
                  const activeBatchesCount = availableBatches.length;

                  // Expiry color tag
                  let expiryTagColor = 'bg-cyan-500/10 text-cyan-900 border-cyan-500/20';
                  if (item.isExpired) {
                    expiryTagColor = 'bg-rose-500/15 text-rose-900 border-rose-500/30 font-bold';
                  } else if (item.isExpiringSoon) {
                    expiryTagColor = 'bg-amber-500/15 text-amber-900 border-amber-500/30 font-bold';
                  }

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-white/40 transition-colors">
                        {/* Medicine info */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{item.brandName}</span>
                            {item.defaultStorage.includes('Cold') && (
                              <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-600" title="Cold Chain (2-8°C)" />
                            )}
                            {item.requiresPrescription && (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-800 text-[10px] font-bold border border-cyan-500/20">
                                Rx
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{item.genericName} • {item.strength}</div>
                          <div className="text-[10px] text-slate-400">SKU: {item.sku}</div>
                        </td>

                        {/* Category & Form */}
                        <td className="px-5 py-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/80 text-cyan-950 text-[11px] font-semibold border border-white/70 shadow-xs">
                            {item.category}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">Form: {item.dosageForm}</div>
                        </td>

                        {/* Batch count & toggle */}
                        <td className="px-5 py-4">
                          {(() => {
                            const threshold = currentTenant?.lowStockDefaultThreshold || 20;
                            const depletedCount = availableBatches.filter((b) => b.stockQuantity === 0).length;
                            const lowCount = availableBatches.filter((b) => b.stockQuantity > 0 && b.stockQuantity <= threshold).length;

                            return (
                              <div className="space-y-1">
                                <button
                                  id={`btn-expand-batches-${item.id}`}
                                  onClick={() => setExpandedMedicineId(isExpanded ? null : item.id)}
                                  className="flex items-center gap-1.5 text-slate-700 font-bold hover:text-cyan-700 cursor-pointer"
                                >
                                  <Layers className="w-3.5 h-3.5 text-cyan-600" />
                                  <span>{activeBatchesCount} Batch{activeBatchesCount === 1 ? '' : 'es'}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>

                                {/* Batch stock warning indicators in main row */}
                                <div className="flex flex-col gap-0.5">
                                  {depletedCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-800 border border-rose-300/80 text-[10px] font-bold w-fit">
                                      <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                                      {depletedCount} depleted batch{depletedCount > 1 ? 'es' : ''}
                                    </span>
                                  )}
                                  {lowCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-900 border border-amber-300/80 text-[10px] font-bold w-fit">
                                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                      {lowCount} low stock batch{lowCount > 1 ? 'es' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Total Stock */}
                        <td className="px-5 py-4">
                          <div className={`font-bold text-sm ${item.isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                            {item.totalStock} units
                          </div>
                          {item.isLowStock && (
                            <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          )}
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-cyan-950">
                            {currentTenant?.currency || 'PKR'} {item.lowestPrice.toFixed(2)}
                          </div>
                          {item.lowestPrice !== item.highestPrice && (
                            <div className="text-[10px] text-slate-400">
                              up to {currentTenant?.currency || 'PKR'} {item.highestPrice.toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* Nearest Expiry */}
                        <td className="px-5 py-4">
                          {item.nearestExpiry ? (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${expiryTagColor}`}>
                              {item.nearestExpiry} {item.isExpired ? '(Expired)' : item.isExpiringSoon ? '(<90d)' : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">No Batches</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Add to POS Cart */}
                            <button
                              id={`btn-add-cart-${item.id}`}
                              onClick={() => addToCart(item)}
                              disabled={item.totalStock === 0}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                item.totalStock === 0
                                  ? 'bg-white/40 text-slate-400 cursor-not-allowed border border-white/40'
                                  : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-xs'
                              }`}
                            >
                              + POS Cart
                            </button>

                            {/* Add Batch */}
                            <button
                              id={`btn-add-batch-${item.id}`}
                              onClick={() => {
                                setSelectedMedForBatch(item);
                                setIsAddBatchModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-bold border border-white/80 shadow-xs transition-colors cursor-pointer"
                              title="Add new stock batch for this medicine"
                            >
                              + Batch
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Batch Detail Drawer */}
                      {isExpanded && (
                        <tr className="bg-white/30 backdrop-blur-md border-y border-white/60">
                          <td colSpan={7} className="px-6 py-5">
                            <div className="space-y-4">
                              {/* Header with summary stats */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                                <div>
                                  <h4 className="font-bold text-xs text-cyan-950 flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-cyan-700" />
                                    <span>Individual Batches for {item.brandName}</span>
                                    <span className="text-[10px] text-slate-500 font-normal">
                                      ({currentTenant ? currentTenant.name : 'All Branches'})
                                    </span>
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                      Total: {availableBatches.length} Batches
                                    </span>
                                    {availableBatches.filter(b => b.stockQuantity === 0).length > 0 && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-800 font-bold border border-rose-300 flex items-center gap-1">
                                        <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                                        {availableBatches.filter(b => b.stockQuantity === 0).length} Depleted
                                      </span>
                                    )}
                                    {availableBatches.filter(b => b.stockQuantity > 0 && b.stockQuantity <= (currentTenant?.lowStockDefaultThreshold || 20)).length > 0 && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 font-bold border border-amber-300 flex items-center gap-1">
                                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                        {availableBatches.filter(b => b.stockQuantity > 0 && b.stockQuantity <= (currentTenant?.lowStockDefaultThreshold || 20)).length} Low Stock
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    id={`btn-add-batch-drawer-${item.id}`}
                                    onClick={() => {
                                      setSelectedMedForBatch(item);
                                      setIsAddBatchModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add New Batch</span>
                                  </button>
                                </div>
                              </div>

                              {availableBatches.length === 0 ? (
                                <div className="p-5 bg-white/60 rounded-2xl border border-white/70 text-center text-slate-400 text-xs">
                                  No active batches currently registered for this formulation.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                  {availableBatches.map((batch) => {
                                    const isAdjusting = adjustingBatchId === batch.id;
                                    const threshold = currentTenant?.lowStockDefaultThreshold || 20;
                                    const isOutOfStock = batch.stockQuantity === 0;
                                    const isCriticalLow = !isOutOfStock && batch.stockQuantity <= Math.max(5, Math.floor(threshold / 2));
                                    const isLowStock = !isOutOfStock && !isCriticalLow && batch.stockQuantity <= threshold;
                                    const isOptimal = batch.stockQuantity > threshold;

                                    const initialQty = batch.initialQuantity || Math.max(batch.stockQuantity, 50);
                                    const percent = isOutOfStock ? 0 : Math.min(100, Math.max(5, Math.round((batch.stockQuantity / initialQty) * 100)));

                                    return (
                                      <div
                                        key={batch.id}
                                        id={`batch-card-${batch.id}`}
                                        className={`backdrop-blur-md p-4 rounded-2xl relative space-y-3 transition-all ${
                                          isOutOfStock 
                                            ? 'bg-rose-50/80 border-2 border-rose-400/90 shadow-md shadow-rose-500/10' 
                                            : isCriticalLow
                                            ? 'bg-amber-50/80 border-2 border-amber-400/90 shadow-md shadow-amber-500/10'
                                            : isLowStock
                                            ? 'bg-amber-50/40 border border-amber-300 shadow-sm shadow-amber-500/5'
                                            : 'bg-white/80 border border-white/80 shadow-lg shadow-cyan-950/5'
                                        }`}
                                      >
                                        {/* Status Strip */}
                                        {isOutOfStock ? (
                                          <div className="flex items-center justify-between px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold tracking-wide">
                                            <span className="flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" />
                                              OUT OF STOCK (0 UNITS)
                                            </span>
                                            <span>REORDER REQUIRED</span>
                                          </div>
                                        ) : isCriticalLow ? (
                                          <div className="flex items-center justify-between px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg text-[10px] font-bold tracking-wide">
                                            <span className="flex items-center gap-1">
                                              <AlertTriangle className="w-3 h-3" />
                                              CRITICALLY LOW STOCK
                                            </span>
                                            <span>{batch.stockQuantity} UNITS LEFT</span>
                                          </div>
                                        ) : isLowStock ? (
                                          <div className="flex items-center justify-between px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold">
                                            <span className="flex items-center gap-1">
                                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                              LOW STOCK BATCH
                                            </span>
                                            <span>≤ {threshold} threshold</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-between px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-lg text-[10px] font-medium">
                                            <span className="flex items-center gap-1">
                                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                              ADEQUATE INVENTORY
                                            </span>
                                            <span>Optimal Stock</span>
                                          </div>
                                        )}

                                        {/* Batch Top Details */}
                                        <div className="flex items-center justify-between pt-0.5">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-xs text-cyan-950 bg-cyan-600/10 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">
                                              {batch.batchNumber}
                                            </span>
                                          </div>
                                          <span className="text-[10px] text-slate-600 font-bold">
                                            Rack: <strong className="text-slate-900 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">{batch.locationRack}</strong>
                                          </span>
                                        </div>

                                        {/* Stock Level Display & Visual Progress Meter */}
                                        <div className="p-2.5 rounded-xl bg-white/70 border border-white/80 space-y-1.5">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-500 font-medium">Available Quantity:</span>
                                            <span className={`font-extrabold text-xs ${
                                              isOutOfStock ? 'text-rose-600 font-black' :
                                              isCriticalLow ? 'text-amber-800 font-black' :
                                              isLowStock ? 'text-amber-700' : 'text-cyan-800'
                                            }`}>
                                              {batch.stockQuantity} units {isOutOfStock ? '(Depleted)' : ''}
                                            </span>
                                          </div>
                                          {/* Mini Stock Fill Bar */}
                                          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full transition-all duration-300 ${
                                                isOutOfStock ? 'bg-rose-500 w-0' :
                                                isCriticalLow ? 'bg-rose-500' :
                                                isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                                              }`}
                                              style={{ width: `${percent}%` }}
                                            />
                                          </div>
                                          <div className="flex justify-between text-[9px] text-slate-400">
                                            <span>0</span>
                                            <span>Threshold: {threshold}</span>
                                            <span>Cap: {initialQty}</span>
                                          </div>
                                        </div>

                                        {/* Grid Details */}
                                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                          <div>
                                            <span className="text-slate-400 block text-[10px]">Expiry Date</span>
                                            <span className="font-bold text-slate-800">{batch.expiryDate}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400 block text-[10px]">Purchase Cost</span>
                                            <span className="text-slate-700 font-semibold">{currentTenant?.currency || 'PKR'} {batch.purchasePrice}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400 block text-[10px]">Retail MRP</span>
                                            <span className="font-bold text-slate-900">{currentTenant?.currency || 'PKR'} {batch.sellingPrice}</span>
                                          </div>
                                          <div>
                                            <span className="text-slate-400 block text-[10px]">Margin</span>
                                            <span className="font-bold text-emerald-700">
                                              {batch.sellingPrice > batch.purchasePrice 
                                                ? `+${Math.round(((batch.sellingPrice - batch.purchasePrice) / batch.purchasePrice) * 100)}%` 
                                                : '0%'}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Stock Adjuster / Action Bar */}
                                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                                          {isAdjusting ? (
                                            <div className="flex items-center gap-1.5 w-full">
                                              <input
                                                id={`input-adjust-${batch.id}`}
                                                type="number"
                                                className="w-16 px-2 py-1 text-xs border border-cyan-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-xs"
                                                value={adjustQuantity}
                                                onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                                              />
                                              <button
                                                id={`btn-save-adjust-${batch.id}`}
                                                onClick={() => handleSaveStockAdjustment(batch.id)}
                                                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-[10px] font-bold cursor-pointer shadow-xs"
                                              >
                                                Save
                                              </button>
                                              <button
                                                id={`btn-cancel-adjust-${batch.id}`}
                                                onClick={() => setAdjustingBatchId(null)}
                                                className="px-2 py-1 bg-white text-slate-700 rounded-xl text-[10px] border border-slate-200 cursor-pointer shadow-xs"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          ) : (
                                            <>
                                              <button
                                                id={`btn-start-adjust-${batch.id}`}
                                                onClick={() => {
                                                  setAdjustingBatchId(batch.id);
                                                  setAdjustQuantity(batch.stockQuantity);
                                                }}
                                                className="text-[10px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-bold cursor-pointer transition-colors"
                                              >
                                                <Edit3 className="w-3 h-3" /> Adjust Stock
                                              </button>
                                              
                                              <div className="flex items-center gap-1.5">
                                                <button
                                                  id={`btn-dispense-batch-${batch.id}`}
                                                  onClick={() => addToCart(item, batch, 1)}
                                                  disabled={batch.stockQuantity === 0}
                                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-xs ${
                                                    batch.stockQuantity === 0
                                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                      : 'bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-900 border border-cyan-500/20'
                                                  }`}
                                                >
                                                  Dispense Batch
                                                </button>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Formulation / Medicine */}
      {isAddMedModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-white/70 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Medicine to Catalog</h3>
              <button
                id="btn-close-add-med-modal"
                onClick={() => setIsAddMedModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm cursor-pointer shadow-xs border border-white/70"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Brand Name *</label>
                  <input
                    id="input-med-brand"
                    type="text"
                    required
                    placeholder="e.g. Augmentin 625mg"
                    value={newMed.brandName}
                    onChange={(e) => setNewMed({ ...newMed, brandName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Generic Name *</label>
                  <input
                    id="input-med-generic"
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin + Clavulanate"
                    value={newMed.genericName}
                    onChange={(e) => setNewMed({ ...newMed, genericName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Category</label>
                  <select
                    id="select-med-category"
                    value={newMed.category}
                    onChange={(e) => setNewMed({ ...newMed, category: e.target.value as MedicineCategory })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Dosage Form</label>
                  <select
                    id="select-med-dosage-form"
                    value={newMed.dosageForm}
                    onChange={(e) => setNewMed({ ...newMed, dosageForm: e.target.value as DosageForm })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  >
                    {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Inhaler', 'Drops', 'Sachet', 'Device'].map((form) => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Strength</label>
                  <input
                    id="input-med-strength"
                    type="text"
                    placeholder="e.g. 500mg, 10mg/ml"
                    value={newMed.strength}
                    onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Manufacturer</label>
                  <input
                    id="input-med-mfg"
                    type="text"
                    placeholder="e.g. GSK, Pfizer, Getz"
                    value={newMed.manufacturer}
                    onChange={(e) => setNewMed({ ...newMed, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-cyan-950 block mb-1">Storage Condition</label>
                <select
                  id="select-med-storage"
                  value={newMed.defaultStorage}
                  onChange={(e) => setNewMed({ ...newMed, defaultStorage: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                >
                  <option value="Room Temperature">Room Temperature (&lt;25°C)</option>
                  <option value="Cold Chain (2-8°C)">Cold Chain (2-8°C Refrigerator)</option>
                  <option value="Store below 25°C">Store below 25°C</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="check-med-prescription"
                  type="checkbox"
                  checked={newMed.requiresPrescription}
                  onChange={(e) => setNewMed({ ...newMed, requiresPrescription: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="check-med-prescription" className="font-bold text-slate-700 cursor-pointer">
                  Requires Doctor's Prescription (Rx Only)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/50">
                <button
                  type="button"
                  id="btn-cancel-add-med"
                  onClick={() => setIsAddMedModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold border border-white/80 shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-new-med"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Save Formulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Batch to Medicine */}
      {isAddBatchModalOpen && selectedMedForBatch && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 sm:p-7 border border-white/70 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Add Stock Batch</h3>
                <p className="text-xs text-slate-500">{selectedMedForBatch.brandName} • {currentTenant?.name}</p>
              </div>
              <button
                id="btn-close-add-batch-modal"
                onClick={() => setIsAddBatchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm cursor-pointer shadow-xs border border-white/70"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Batch Number *</label>
                  <input
                    id="input-batch-number"
                    type="text"
                    required
                    placeholder="e.g. BAT-2026-X1"
                    value={newBatch.batchNumber}
                    onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Location Rack *</label>
                  <input
                    id="input-batch-rack"
                    type="text"
                    required
                    placeholder="e.g. A-12, FRIDGE-01"
                    value={newBatch.locationRack}
                    onChange={(e) => setNewBatch({ ...newBatch, locationRack: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Manufacture Date</label>
                  <input
                    id="input-batch-mfg-date"
                    type="date"
                    value={newBatch.manufactureDate}
                    onChange={(e) => setNewBatch({ ...newBatch, manufactureDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Expiry Date *</label>
                  <input
                    id="input-batch-exp-date"
                    type="date"
                    required
                    value={newBatch.expiryDate}
                    onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Stock Qty *</label>
                  <input
                    id="input-batch-qty"
                    type="number"
                    required
                    min="1"
                    value={newBatch.stockQuantity}
                    onChange={(e) => setNewBatch({ ...newBatch, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Purchase Cost</label>
                  <input
                    id="input-batch-cost"
                    type="number"
                    step="0.01"
                    value={newBatch.purchasePrice}
                    onChange={(e) => setNewBatch({ ...newBatch, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Retail MRP</label>
                  <input
                    id="input-batch-selling"
                    type="number"
                    step="0.01"
                    value={newBatch.sellingPrice}
                    onChange={(e) => setNewBatch({ ...newBatch, sellingPrice: Number(e.target.value), mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-cyan-950 block mb-1">Supplier</label>
                <select
                  id="select-batch-supplier"
                  value={newBatch.supplierId}
                  onChange={(e) => setNewBatch({ ...newBatch, supplierId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/50">
                <button
                  type="button"
                  id="btn-cancel-add-batch"
                  onClick={() => setIsAddBatchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold border border-white/80 shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-new-batch"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Confirm & Receive Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
