import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  Printer, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Building2,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { Sale } from '../types';
import { api } from '../services/api';

export const SalesHistory: React.FC = () => {
  const { 
    sales, 
    tenants, 
    currentTenant, 
    setCurrentTenant, 
    setActiveSaleReceipt, 
    refreshData, 
    addNotification 
  } = usePharmacy();

  const [search, setSearch] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');
  const [refundConfirmId, setRefundConfirmId] = useState<string | null>(null);

  const filteredSales = sales.filter((sale) => {
    const q = search.toLowerCase();
    const matchesSearch =
      sale.invoiceNumber.toLowerCase().includes(q) ||
      sale.customerName.toLowerCase().includes(q) ||
      (sale.doctorName && sale.doctorName.toLowerCase().includes(q)) ||
      (sale.prescriptionNumber && sale.prescriptionNumber.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (selectedPaymentMethod !== 'All' && sale.paymentMethod !== selectedPaymentMethod) return false;
    return true;
  });

  const totalGross = filteredSales
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.grandTotal, 0);

  const avgOrder = filteredSales.length > 0 ? totalGross / filteredSales.length : 0;

  const handleRefund = async (saleId: string) => {
    try {
      await api.refundSale(saleId);
      addNotification('success', 'Sale Refunded', 'Stock restored to inventory batches.');
      setRefundConfirmId(null);
      await refreshData();
    } catch (err: any) {
      addNotification('error', 'Refund Failed', err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Date', 'Branch', 'Customer', 'Doctor', 'Payment Method', 'Items Count', 'Grand Total', 'Status'];
    const rows = filteredSales.map((s) => {
      const tenant = tenants.find((t) => t.id === s.tenantId);
      return [
        s.invoiceNumber,
        new Date(s.date).toLocaleString(),
        tenant?.branchCode || s.tenantId,
        `"${s.customerName}"`,
        `"${s.doctorName || 'N/A'}"`,
        s.paymentMethod,
        s.items.length,
        s.grandTotal,
        s.status,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('info', 'Export Complete', 'Sales ledger CSV downloaded.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Metrics */}
      <div className="bg-white/50 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Sales & Dispensing Invoices Ledger
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-600/10 text-cyan-800 text-xs font-bold border border-cyan-500/20">
                {filteredSales.length} Transactions
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentTenant ? `Filtered for ${currentTenant.name}` : 'Showing transactions across all registered network branches.'}
            </p>
          </div>

          <button
            id="btn-export-sales-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/80 hover:bg-white text-slate-700 font-bold text-xs border border-white/80 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-700" />
            <span>Export CSV Report</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/50">
          <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/70 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales Revenue</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {currentTenant?.currency || 'PKR'} {totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/70 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Invoices</span>
            <div className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
              {filteredSales.length} Invoices
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/70 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Basket Value</span>
            <div className="text-xl font-extrabold text-cyan-900 mt-1 tracking-tight">
              {currentTenant?.currency || 'PKR'} {avgOrder.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white/50 backdrop-blur-xl p-4 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-sales-search"
            type="text"
            placeholder="Search by invoice #, patient or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-2xl border border-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 bg-white/70 backdrop-blur-md shadow-xs text-slate-800"
          />
        </div>

        {/* Payment Filter */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          <span className="text-slate-500 font-bold text-xs hidden sm:inline mr-1">Payment:</span>
          {['All', 'Cash', 'Card', 'Digital Wallet', 'Insurance Co-Pay'].map((pm) => (
            <button
              key={pm}
              onClick={() => setSelectedPaymentMethod(pm)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
                selectedPaymentMethod === pm
                  ? 'bg-slate-900/90 text-white shadow-md shadow-slate-900/20'
                  : 'bg-white/70 text-slate-600 hover:bg-white border border-white/70 shadow-xs'
              }`}
            >
              {pm === 'Insurance Co-Pay' ? 'Insurance' : pm}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white/50 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/60 border-b border-slate-200/50 text-cyan-950 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Invoice Details</th>
                <th className="px-5 py-3.5">Branch Location</th>
                <th className="px-5 py-3.5">Patient & Doctor</th>
                <th className="px-5 py-3.5">Dispensed Items</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Grand Total</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No sales invoices found matching filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const tenant = tenants.find((t) => t.id === sale.tenantId);
                  const isRefundConfirm = refundConfirmId === sale.id;

                  return (
                    <tr key={sale.id} className="hover:bg-white/60 transition-colors">
                      {/* Invoice & Date */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{sale.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                          <Calendar className="w-3 h-3 text-cyan-600" />
                          <span>{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-cyan-600/10 text-cyan-900 text-[11px] font-bold border border-cyan-500/20 shadow-xs">
                          {tenant?.branchCode || 'HQ'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{tenant?.city}</div>
                      </td>

                      {/* Patient & Doctor */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{sale.customerName}</div>
                        {sale.doctorName && (
                          <div className="text-[10px] text-slate-500 font-medium">Dr: {sale.doctorName}</div>
                        )}
                        {sale.prescriptionNumber && (
                          <div className="text-[9px] text-cyan-700 font-bold">Rx #{sale.prescriptionNumber}</div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5 max-w-[200px]">
                          {sale.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700 truncate font-medium">
                              • <strong className="text-slate-900 font-bold">{it.quantity}x</strong> {it.medicineName} ({it.batchNumber})
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/80 text-slate-700 text-[10px] font-bold border border-white/80 shadow-xs">
                          {sale.paymentMethod}
                        </span>
                        {sale.insuranceDetails && (
                          <div className="text-[9px] text-cyan-800 mt-0.5 font-bold">
                            Co-Pay: {sale.insuranceDetails.coPayPercent}%
                          </div>
                        )}
                      </td>

                      {/* Grand Total */}
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {tenant?.currency || 'PKR'} {sale.grandTotal.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Tax: +{sale.taxTotal.toFixed(2)}</div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {sale.status === 'completed' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 text-[10px] font-bold border border-emerald-500/20 shadow-xs">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-800 text-[10px] font-bold border border-rose-500/20 shadow-xs">
                            Refunded
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Receipt */}
                          <button
                            id={`btn-view-receipt-${sale.id}`}
                            onClick={() => setActiveSaleReceipt(sale)}
                            className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-white/80 shadow-xs transition-colors cursor-pointer"
                            title="View / Print Receipt"
                          >
                            <Printer className="w-3.5 h-3.5 text-cyan-700" />
                          </button>

                          {/* Refund Button */}
                          {sale.status === 'completed' && (
                            isRefundConfirm ? (
                              <div className="flex items-center gap-1">
                                <button
                                  id={`btn-confirm-refund-${sale.id}`}
                                  onClick={() => handleRefund(sale.id)}
                                  className="px-2.5 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-bold shadow-xs cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setRefundConfirmId(null)}
                                  className="px-2 py-1.5 bg-white/80 text-slate-700 rounded-xl text-[10px] font-bold border border-white/80 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                id={`btn-refund-${sale.id}`}
                                onClick={() => setRefundConfirmId(sale.id)}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 border border-rose-500/20 shadow-xs transition-colors cursor-pointer"
                                title="Process Refund & Restore Stock"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
