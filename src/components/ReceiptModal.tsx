import React from 'react';
import { Printer, CheckCircle2, QrCode, Store, FileText, X } from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { Sale } from '../types';

export const ReceiptModal: React.FC = () => {
  const { activeSaleReceipt, setActiveSaleReceipt, tenants } = usePharmacy();

  if (!activeSaleReceipt) return null;

  const tenant = tenants.find((t) => t.id === activeSaleReceipt.tenantId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="printable-receipt-wrapper"
      className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in"
    >
      <div className="bg-white/90 backdrop-blur-2xl rounded-3xl max-w-md w-full border border-white/70 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar (Screen Only) */}
        <div className="no-print p-4.5 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight leading-none">Pharmacy Dispensing Invoice</h3>
              <p className="text-[10px] text-cyan-200/80 font-medium mt-0.5">80mm Thermal Receipt Layout</p>
            </div>
          </div>
          <button
            id="btn-close-receipt-modal"
            onClick={() => setActiveSaleReceipt(null)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer transition-colors"
            aria-label="Close receipt modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal / Standard Invoice Body */}
        <div 
          id="printable-receipt"
          className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800 space-y-3.5"
        >
          
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-300/80 pb-3 print-border-dashed">
            <div className="inline-block border border-slate-900 px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider mb-1">
              Official Tax Invoice
            </div>
            <h2 className="text-base font-bold text-slate-950 font-sans tracking-tight uppercase print-text-black">
              {tenant?.name || 'PharmaCentral Network'}
            </h2>
            <div className="text-[11px] text-slate-600 font-sans print-text-black">
              {tenant?.address || 'Medical Plaza, Central Hub'}, {tenant?.city || 'Main Branch'}
            </div>
            <div className="text-[10px] text-slate-500 font-sans print-text-black">
              Phone: {tenant?.phone || '+92 42 35912345'}
            </div>
            <div className="text-[9px] text-slate-500 font-sans pt-0.5 print-text-black">
              DRAP Drug License: <strong>{tenant?.licenseNumber || 'DRAP-PK-2026'}</strong>
              {tenant?.taxRegistrationNumber && (
                <> • NTN/STRN: <strong>{tenant.taxRegistrationNumber}</strong></>
              )}
            </div>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] border-b border-dashed border-slate-300/80 pb-3 bg-white/50 p-2.5 rounded-xl border border-white/60 print-border-dashed print-bg-transparent print:p-0">
            <div>
              <span className="text-slate-500 print-text-black">Inv #:</span> <strong>{activeSaleReceipt.invoiceNumber}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 print-text-black">Date:</span> {new Date(activeSaleReceipt.date).toLocaleDateString()} {new Date(activeSaleReceipt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div>
              <span className="text-slate-500 print-text-black">Patient:</span> <strong>{activeSaleReceipt.customerName}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 print-text-black">Dispenser:</span> {activeSaleReceipt.cashierName}
            </div>
            {activeSaleReceipt.doctorName && (
              <div className="col-span-2 text-[10px] pt-0.5 border-t border-slate-100 print-border-dashed">
                <span className="text-slate-500 print-text-black">Prescribing Doctor:</span> <strong>{activeSaleReceipt.doctorName}</strong>
                {activeSaleReceipt.prescriptionNumber && (
                  <span className="ml-2 text-slate-500 print-text-black">(Rx #{activeSaleReceipt.prescriptionNumber})</span>
                )}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300/80 pb-3 print-border-dashed">
            <div className="flex justify-between font-bold text-slate-900 text-[11px] border-b border-slate-200 pb-1 print-border-solid print-text-black">
              <span className="w-1/2">Item Description</span>
              <span className="w-1/4 text-center">Qty x Rate</span>
              <span className="w-1/4 text-right">Total</span>
            </div>

            {activeSaleReceipt.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5 text-[11px] bg-white/40 p-1.5 rounded-lg border border-white/50 print-bg-transparent print:p-0 print:border-none">
                <div className="flex justify-between items-start font-medium text-slate-900 print-text-black">
                  <div className="w-1/2 pr-1">
                    <div className="font-bold text-slate-950 leading-tight print-text-black">{item.medicineName}</div>
                    <div className="text-[9px] text-slate-500 font-sans print-text-black">
                      Batch: {item.batchNumber}
                    </div>
                  </div>
                  <div className="w-1/4 text-center text-[10px] pt-0.5 print-text-black">
                    {item.quantity} x {item.unitPrice.toFixed(2)}
                  </div>
                  <div className="w-1/4 text-right font-bold text-slate-950 pt-0.5 print-text-black">
                    {item.totalAmount.toFixed(2)}
                  </div>
                </div>
                {item.dosageInstructions && (
                  <div className="text-[10px] text-cyan-900 italic pl-1 print-text-black font-sans">
                    ↳ {item.dosageInstructions}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals Calculation */}
          <div className="space-y-1.5 text-xs bg-white/50 p-3 rounded-2xl border border-white/60 print-bg-transparent print:p-0 print:border-none">
            <div className="flex justify-between">
              <span className="text-slate-600 print-text-black">Gross Subtotal:</span>
              <span className="font-semibold print-text-black">{tenant?.currency || 'PKR'} {activeSaleReceipt.subtotal.toFixed(2)}</span>
            </div>
            {activeSaleReceipt.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold print-text-black">
                <span>Discount Total:</span>
                <span>-{tenant?.currency || 'PKR'} {activeSaleReceipt.discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 print-text-black">
              <span>Sales Tax ({tenant?.taxRatePercent || 5}%):</span>
              <span className="print-text-black">+{tenant?.currency || 'PKR'} {activeSaleReceipt.taxTotal.toFixed(2)}</span>
            </div>
            
            {/* Grand Total */}
            <div className="flex justify-between font-extrabold text-sm text-slate-950 pt-2 border-t-2 border-dashed border-slate-300 print-border-dashed print-text-black">
              <span>NET PAYABLE:</span>
              <span className="text-base tracking-tight">{tenant?.currency || 'PKR'} {activeSaleReceipt.grandTotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-[11px] text-slate-600 pt-1.5 border-t border-slate-100 print-border-dashed print-text-black">
              <span>Payment Mode:</span>
              <strong className="text-slate-800 uppercase print-text-black">{activeSaleReceipt.paymentMethod}</strong>
            </div>
          </div>

          {/* Simulated Thermal Barcode */}
          <div className="text-center pt-2 pb-1">
            <div className="font-mono text-[16px] tracking-widest text-slate-800 font-bold select-none leading-none print-text-black">
              ||| | |||| | |||||| || | |||| |||
            </div>
            <div className="text-[9px] text-slate-500 tracking-wider font-mono mt-1 print-text-black">
              *{activeSaleReceipt.invoiceNumber}*
            </div>
          </div>

          {/* Verification & Compliance Footer */}
          <div className="text-center pt-1 space-y-1 font-sans text-[10px] text-slate-500 border-t border-dashed border-slate-200 print-border-dashed print-text-black">
            <div>Medicines once sold cannot be returned without original batch receipt.</div>
            <div>Store cold chain items at 2-8°C. Keep all medicines out of reach of children.</div>
            <div className="font-bold text-slate-900 pt-0.5 print-text-black">Thank you for trusting {tenant?.name || 'PharmaCentral'}!</div>
          </div>
        </div>

        {/* Modal Bottom Actions (Screen Only) */}
        <div className="no-print p-4 bg-white/70 border-t border-slate-200/60 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-sans hidden sm:block">
            Auto-formatted for 80mm POS thermal printers
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              id="btn-close-receipt"
              onClick={() => setActiveSaleReceipt(null)}
              className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold text-xs border border-slate-200 shadow-xs cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              id="btn-print-invoice"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
