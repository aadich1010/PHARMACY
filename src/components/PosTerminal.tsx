import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Receipt, 
  CreditCard, 
  Banknote, 
  Sparkles, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  ShieldAlert, 
  Calendar,
  Wallet,
  Building,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePharmacy } from '../context/PharmacyContext';
import { InventoryItem, MedicineCategory, Customer } from '../types';

export const PosTerminal: React.FC = () => {
  const { 
    inventory, 
    currentTenant, 
    cart, 
    selectedCustomer, 
    setSelectedCustomer, 
    customers, 
    doctorName, 
    setDoctorName, 
    prescriptionNumber, 
    setPrescriptionNumber, 
    paymentMethod, 
    setPaymentMethod, 
    cartNotes, 
    setCartNotes, 
    addToCart, 
    updateCartQuantity, 
    updateCartBatch, 
    updateCartDiscount, 
    updateCartDosage, 
    removeFromCart, 
    clearCart, 
    checkoutSale, 
    openAiModalWithTab, 
    addNotification 
  } = usePharmacy();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const [coPayPercent, setCoPayPercent] = useState<number>(20);
  const [insuranceProvider, setInsuranceProvider] = useState<string>('Jubilee Health Insurance');
  const [insuranceClaimNum, setInsuranceClaimNum] = useState<string>('CLM-2026-9901');

  // Filter medicines
  const filteredMedicines = inventory.filter((item) => {
    const q = search.toLowerCase();
    const matches = 
      item.brandName.toLowerCase().includes(q) ||
      item.genericName.toLowerCase().includes(q) ||
      item.barcode.includes(q) ||
      item.sku.toLowerCase().includes(q);

    if (!matches) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    return true;
  });

  // Calculate totals
  const taxRate = (currentTenant?.taxRatePercent || 5) / 100;
  let subtotal = 0;
  let totalDiscount = 0;

  cart.forEach((c) => {
    const gross = c.unitPrice * c.quantity;
    const disc = gross * (c.discountPercent / 100);
    subtotal += gross;
    totalDiscount += disc;
  });

  const netAfterDiscount = subtotal - totalDiscount;
  const taxAmount = netAfterDiscount * taxRate;
  const grandTotal = Number((netAfterDiscount + taxAmount).toFixed(2));

  // Change calculator
  const numericTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, numericTendered - grandTotal);

  // Check for allergy conflicts
  const allergyAlerts: string[] = [];
  if (selectedCustomer && selectedCustomer.allergies && selectedCustomer.allergies.length > 0) {
    selectedCustomer.allergies.forEach((allergy) => {
      const allergyLower = allergy.toLowerCase();
      cart.forEach((c) => {
        const medGeneric = c.medicine.genericName.toLowerCase();
        const medBrand = c.medicine.brandName.toLowerCase();
        if (
          (allergyLower.includes('penicillin') && (medGeneric.includes('amoxicillin') || medBrand.includes('augmentin'))) ||
          (allergyLower.includes('aspirin') && (medGeneric.includes('aspirin') || medGeneric.includes('ibuprofen'))) ||
          medGeneric.includes(allergyLower)
        ) {
          allergyAlerts.push(`CRITICAL ALLERGY CONFLICT: Patient is allergic to "${allergy}", but cart contains "${c.medicine.brandName}" (${c.medicine.genericName})!`);
        }
      });
    });
  }

  const handleCheckout = async () => {
    if (allergyAlerts.length > 0) {
      const proceed = confirm(`ALLERGY WARNING DETECTED:\n\n${allergyAlerts.join('\n')}\n\nDo you want to override and dispense anyway?`);
      if (!proceed) return;
    }

    const sale = await checkoutSale();
    if (sale) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
      setCashTendered('');
    }
  };

  return (
    <div className="pb-12 space-y-6">
      {/* Alert Banner if No Branch Selected */}
      {!currentTenant && (
        <div className="p-4 bg-amber-500/15 backdrop-blur-md border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-900 text-xs shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong>Network HQ View:</strong> Please select a specific pharmacy branch from the top bar dropdown to enable checkout and accurate branch tax/stock deduction.
          </div>
        </div>
      )}

      {/* Main Dual Grid: Catalog (Left) + Cart & Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 Columns: Product Catalog */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Search & Category Header */}
          <div className="bg-white/50 backdrop-blur-xl p-5 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-pos-search"
                  type="text"
                  placeholder="Scan barcode or type brand / generic medicine name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-2xl border border-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white/70 backdrop-blur-md shadow-xs"
                  autoFocus
                />
              </div>

              {/* AI Prescription OCR / Reader button */}
              <button
                id="btn-pos-scan-rx"
                onClick={() => openAiModalWithTab('prescription')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-900 text-xs font-bold transition-colors cursor-pointer shrink-0 border border-cyan-500/20 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>AI Rx Parser</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none text-xs">
              {['All', 'Antibiotics', 'Analgesics & Pain', 'Cardiovascular', 'Diabetes & Endocrine', 'Respiratory', 'Gastrointestinal', 'Vitamins & Supplements'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/20'
                      : 'bg-white/60 hover:bg-white/90 text-slate-600 border border-white/60 shadow-xs'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[680px] overflow-y-auto pr-1">
            {filteredMedicines.length === 0 ? (
              <div className="col-span-2 p-8 bg-white/50 backdrop-blur-xl rounded-3xl border border-white/60 text-center text-slate-400 text-xs shadow-sm">
                No matching medications found in catalog.
              </div>
            ) : (
              filteredMedicines.map((item) => {
                const availableBatches = (item.batches || []).filter((b) => b.stockQuantity > 0);
                const hasStock = availableBatches.length > 0;
                const activeBatch = availableBatches[0];

                return (
                  <div
                    key={item.id}
                    className={`bg-white/50 backdrop-blur-xl rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-xl shadow-blue-500/5 ${
                      hasStock 
                        ? 'border-white/60 hover:border-cyan-400 hover:bg-white/70 hover:shadow-2xl' 
                        : 'border-white/40 opacity-60 bg-white/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-cyan-800 tracking-wider">
                            {item.category}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-0.5">{item.brandName}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{item.genericName} • {item.strength}</p>
                        </div>
                        {item.requiresPrescription && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-800 text-[10px] font-bold border border-cyan-500/20 shrink-0">
                            Rx
                          </span>
                        )}
                      </div>

                      {/* Stock & Batch Tag */}
                      <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-slate-200/50">
                        <div>
                          <span className="text-slate-400 text-[10px] block font-medium">Stock</span>
                          <span className={`font-bold ${item.totalStock <= 10 ? 'text-amber-600' : 'text-slate-800'}`}>
                            {item.totalStock} units
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block font-medium">Price</span>
                          <span className="font-bold text-cyan-700">
                            {currentTenant?.currency || 'PKR'} {item.lowestPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Add Button */}
                    <div className="mt-3.5 pt-2">
                      <button
                        id={`btn-pos-add-${item.id}`}
                        onClick={() => addToCart(item, activeBatch, 1)}
                        disabled={!hasStock}
                        className={`w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          hasStock
                            ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-md shadow-cyan-600/20'
                            : 'bg-white/40 text-slate-400 cursor-not-allowed border border-white/40'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{hasStock ? 'Add to Dispensing Cart' : 'Out of Stock'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 5 Columns: Active POS Cart & Billing Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/70 shadow-2xl shadow-blue-500/10 p-5 sm:p-6 space-y-4 sticky top-24">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-600/15 flex items-center justify-center text-cyan-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Dispensing Terminal</h3>
              </div>
              {cart.length > 0 && (
                <button
                  id="btn-clear-cart"
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Patient & Prescription Info Box */}
            <div className="bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-white/70 space-y-2.5 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-950 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-700" /> Patient & Rx Details
                </span>
                {selectedCustomer && (
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold"
                  >
                    Reset Patient
                  </button>
                )}
              </div>

              {/* Customer Selector */}
              <select
                id="select-pos-customer"
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const cust = customers.find((c) => c.id === e.target.value) || null;
                  setSelectedCustomer(cust);
                }}
                className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 text-xs shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
              >
                <option value="">Walk-in Patient (General)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.chronicConditions.join(', ') || 'No chronic tags'}
                  </option>
                ))}
              </select>

              {/* Doctor Name & Rx Input */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  id="input-pos-doctor"
                  type="text"
                  placeholder="Doctor Name (Optional)"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-white/80 text-xs bg-white/90 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
                <input
                  id="input-pos-rx"
                  type="text"
                  placeholder="Prescription / Rx #"
                  value={prescriptionNumber}
                  onChange={(e) => setPrescriptionNumber(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-white/80 text-xs bg-white/90 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              {/* Allergy Warning Banner */}
              {allergyAlerts.length > 0 && (
                <div className="p-3 bg-rose-500/15 backdrop-blur-md border border-rose-500/30 rounded-xl text-rose-900 text-[11px] font-bold space-y-1">
                  {allergyAlerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Cart is empty. Click medicines from the catalog on the left to dispense.
                </div>
              ) : (
                cart.map((item, idx) => {
                  const lineTotal = item.unitPrice * item.quantity * (1 - item.discountPercent / 100);
                  const availableBatches = (item.medicine.batches || []).filter((b) => b.stockQuantity > 0);

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-white/70 backdrop-blur-md rounded-2xl border border-white/70 text-xs space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{item.medicine.brandName}</div>
                          <div className="text-[10px] text-slate-500">{item.medicine.genericName}</div>
                        </div>
                        <button
                          id={`btn-remove-cart-${idx}`}
                          onClick={() => removeFromCart(idx)}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Batch Selector (FIFO recommended) */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 shrink-0 font-bold">Batch:</span>
                        <select
                          id={`select-cart-batch-${idx}`}
                          value={item.selectedBatch.id}
                          onChange={(e) => {
                            const b = item.medicine.batches.find((x) => x.id === e.target.value);
                            if (b) updateCartBatch(idx, b);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-white/80 text-[11px] bg-white/90 w-full shadow-xs"
                        >
                          {availableBatches.map((batch) => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batchNumber} (Exp: {batch.expiryDate} • Avail: {batch.stockQuantity} • {currentTenant?.currency || 'PKR'} {batch.sellingPrice})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity & Discount & Line Total */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                        <div className="flex items-center gap-1.5">
                          <button
                            id={`btn-qty-minus-${idx}`}
                            onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center font-bold text-slate-700 border border-white/80 shadow-xs cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-slate-900 w-6 text-center">{item.quantity}</span>
                          <button
                            id={`btn-qty-plus-${idx}`}
                            onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center font-bold text-slate-700 border border-white/80 shadow-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right font-bold text-cyan-950">
                          {currentTenant?.currency || 'PKR'} {lineTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* AI Safety Check Trigger */}
            {cart.length > 1 && (
              <button
                id="btn-pos-interaction-check"
                onClick={() => openAiModalWithTab('interactions')}
                className="w-full py-2 rounded-xl bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-900 text-xs font-bold flex items-center justify-center gap-1.5 border border-cyan-500/20 shadow-xs cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>Check Drug-to-Drug Interactions for Cart ({cart.length} items)</span>
              </button>
            )}

            {/* Payment & Billing Breakdown */}
            {cart.length > 0 && (
              <div className="pt-3 border-t border-slate-200/50 space-y-3.5 text-xs">
                {/* Method selector */}
                <div>
                  <label className="font-bold text-cyan-950 block mb-1.5">Payment Method</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['Cash', 'Card', 'Digital Wallet', 'Insurance Co-Pay'] as const).map((method) => (
                      <button
                        key={method}
                        id={`btn-pay-${method.replace(/\s+/g, '-').toLowerCase()}`}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold text-center transition-all cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                            : 'bg-white/60 hover:bg-white text-slate-600 border border-white/70 shadow-xs'
                        }`}
                      >
                        {method === 'Insurance Co-Pay' ? 'Insurance' : method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash Tendered & Change if Cash */}
                {paymentMethod === 'Cash' && (
                  <div className="grid grid-cols-2 gap-2 bg-white/70 backdrop-blur-md p-2.5 rounded-2xl border border-white/70 shadow-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Cash Received</span>
                      <input
                        id="input-cash-tendered"
                        type="number"
                        placeholder="0.00"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-white/80 bg-white text-xs font-bold shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block">Change Due</span>
                      <div className="font-bold text-cyan-700 text-sm mt-1.5">
                        {currentTenant?.currency || 'PKR'} {changeDue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="space-y-1.5 pt-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Gross Subtotal:</span>
                    <span className="font-semibold text-slate-800">{currentTenant?.currency || 'PKR'} {subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount Total:</span>
                      <span>-{currentTenant?.currency || 'PKR'} {totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax ({currentTenant?.taxRatePercent || 5}%):</span>
                    <span className="font-semibold text-slate-800">+{currentTenant?.currency || 'PKR'} {taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-cyan-950 text-base pt-2.5 border-t border-slate-200/50">
                    <span>Grand Total:</span>
                    <span className="text-cyan-700">
                      {currentTenant?.currency || 'PKR'} {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout & Dispense Action */}
                <button
                  id="btn-checkout-sale"
                  onClick={handleCheckout}
                  disabled={!currentTenant}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    currentTenant
                      ? 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-cyan-600/25 hover:scale-[1.01]'
                      : 'bg-white/40 text-slate-400 cursor-not-allowed border border-white/40'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span>Dispense & Generate Receipt</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
