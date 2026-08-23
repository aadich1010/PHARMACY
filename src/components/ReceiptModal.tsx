import React from 'react';
import { Printer, CheckCircle2, QrCode, Store, FileText } from 'lucide-react';
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
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white/85 backdrop-blur-2xl rounded-3xl max-w-md w-full border border-white/70 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="p-4.5 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-cyan-400/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm tracking-tight">Pharmacy Dispensing Receipt</h3>
          </div>
          <button
            onClick={() => setActiveSaleReceipt(null)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Thermal / Standard Invoice Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800 space-y-4 print:p-0">
          
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-300/80 pb-3">
            <h2 className="text-base font-bold text-slate-950 font-sans tracking-tight">
              {tenant?.name || 'PharmaCentral Network'}
            </h2>
            <div className="text-[11px] text-slate-600 font-sans">
              {tenant?.address || 'Medical Plaza, Central Hub'}, {tenant?.city}
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              DRAP License: {tenant?.licenseNumber || 'DRAP-PK-2026'} • Phone: {tenant?.phone || '+92 42 35912345'}
            </div>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] border-b border-dashed border-slate-300/80 pb-3 bg-white/50 p-2.5 rounded-xl border border-white/60">
            <div>
              <span className="text-slate-500 font-medium">Invoice:</span> <strong>{activeSaleReceipt.invoiceNumber}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">Date:</span> {new Date(activeSaleReceipt.date).toLocaleDateString()} {new Date(activeSaleReceipt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div>
              <span className="text-slate-500 font-medium">Patient:</span> <strong>{activeSaleReceipt.customerName}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">Dispenser:</span> {activeSaleReceipt.cashierName}
            </div>
            {activeSaleReceipt.doctorName && (
              <div>
                <span className="text-slate-500 font-medium">Prescribing Dr:</span> {activeSaleReceipt.doctorName}
              </div>
            )}
            {activeSaleReceipt.prescriptionNumber && (
              <div className="text-right">
                <span className="text-slate-500 font-medium">Rx #:</span> {activeSaleReceipt.prescriptionNumber}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-2 border-b border-dashed border-slate-300/80 pb-3">
            <div className="flex justify-between font-bold text-slate-900 text-[11px] px-1">
              <span>Item & Dosage</span>
              <span>Qty x Price</span>
              <span>Total</span>
            </div>

            {activeSaleReceipt.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5 text-[11px] bg-white/40 p-2 rounded-xl border border-white/50">
                <div className="flex justify-between font-medium text-slate-900">
                  <span className="truncate max-w-[170px] font-bold">{item.medicineName}</span>
                  <span>{item.quantity} x {item.unitPrice.toFixed(2)}</span>
                  <span className="font-bold text-cyan-950">{item.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Batch: {item.batchNumber}</span>
                  {item.dosageInstructions && <span className="text-cyan-800 font-medium">{item.dosageInstructions}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs bg-white/50 p-3 rounded-2xl border border-white/60">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Subtotal:</span>
              <span className="font-semibold">{tenant?.currency || 'PKR'} {activeSaleReceipt.subtotal.toFixed(2)}</span>
            </div>
            {activeSaleReceipt.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount Total:</span>
                <span>-{tenant?.currency || 'PKR'} {activeSaleReceipt.discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Sales Tax ({tenant?.taxRatePercent || 5}%):</span>
              <span>+{tenant?.currency || 'PKR'} {activeSaleReceipt.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-sm text-cyan-950 pt-2 border-t border-slate-200">
              <span>Net Grand Total:</span>
              <span className="text-cyan-900">{tenant?.currency || 'PKR'} {activeSaleReceipt.grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 pt-1">
              <span>Payment Mode:</span>
              <strong className="text-slate-800 uppercase">{activeSaleReceipt.paymentMethod}</strong>
            </div>
          </div>

          {/* Verification footer */}
          <div className="text-center pt-2 space-y-1 font-sans text-[10px] text-slate-500">
            <div>Medicines once sold cannot be returned without original batch receipt.</div>
            <div>Store cold chain items at 2-8°C. Keep out of reach of children.</div>
            <div className="font-bold text-cyan-950 pt-1">Thank you for choosing PharmaCentral!</div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-white/60 border-t border-slate-200/50 flex items-center justify-end gap-2.5">
          <button
            onClick={() => setActiveSaleReceipt(null)}
            className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold text-xs border border-white/80 shadow-xs cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>

      </div>
    </div>
  );
};
