import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  RotateCw, 
  Layers, 
  BarChart3, 
  LineChart as LineIcon, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  DollarSign,
  Boxes,
  Package,
  Percent,
  Coins
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  ComposedChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine,
  Cell
} from 'recharts';
import { NetworkAnalytics, Tenant } from '../types';

interface NetworkPerformanceChartsProps {
  analytics: NetworkAnalytics;
  tenants: Tenant[];
  onNavigateBranch?: (tenantId: string) => void;
}

// Consistent and vibrant brand colors for branches in charts
const BRANCH_COLORS = [
  '#0891b2', // Cyan 600
  '#0d9488', // Teal 600
  '#2563eb', // Blue 600
  '#7c3aed', // Purple 600
  '#d97706', // Amber 600
  '#db2777', // Pink 600
  '#059669', // Emerald 600
];

export const NetworkPerformanceCharts: React.FC<NetworkPerformanceChartsProps> = ({ 
  analytics, 
  tenants, 
  onNavigateBranch 
}) => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'inventory_value' | 'turnover' | 'category'>('revenue');
  const [revenueChartType, setRevenueChartType] = useState<'stacked' | 'grouped' | 'area'>('stacked');
  const [inventoryMetric, setInventoryMetric] = useState<'valuation' | 'units' | 'efficiency'>('valuation');
  const [timeRange, setTimeRange] = useState<'6m' | '3m'>('6m');
  const [selectedBranches, setSelectedBranches] = useState<string[]>(() => 
    tenants.map(t => t.branchCode)
  );

  // Sync selected branches if tenants change
  const branchCodes = useMemo(() => tenants.map(t => t.branchCode), [tenants]);

  const toggleBranch = (code: string) => {
    setSelectedBranches(prev => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev; // Keep at least one branch selected
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const selectAllBranches = () => setSelectedBranches(branchCodes);

  // Filtered monthly revenue data based on time range
  const filteredMonthlyData = useMemo(() => {
    const raw = analytics.monthlyRevenueByTenant || [];
    if (timeRange === '3m') {
      return raw.slice(-3);
    }
    return raw;
  }, [analytics.monthlyRevenueByTenant, timeRange]);

  // Dynamic branch color mapping
  const branchColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    tenants.forEach((t, i) => {
      map[t.branchCode] = BRANCH_COLORS[i % BRANCH_COLORS.length];
    });
    return map;
  }, [tenants]);

  // Turnover metric calculations & highlights
  const turnoverData = analytics.tenantTurnoverMetrics || [];
  
  const fastestBranch = useMemo(() => {
    if (!turnoverData.length) return null;
    return [...turnoverData].sort((a, b) => b.turnoverRate - a.turnoverRate)[0];
  }, [turnoverData]);

  const topRevenueBranch = useMemo(() => {
    if (!analytics.tenantComparisons?.length) return null;
    return [...analytics.tenantComparisons].sort((a, b) => b.revenue - a.revenue)[0];
  }, [analytics.tenantComparisons]);

  // Branch inventory value and asset comparison data
  const inventoryValueData = useMemo(() => {
    const comparisons = analytics.tenantComparisons || [];
    const totalGroupVal = comparisons.reduce((sum, c) => sum + c.inventoryValue, 0);

    return comparisons.map((c) => {
      const sharePercent = totalGroupVal > 0 ? Number(((c.inventoryValue / totalGroupVal) * 100).toFixed(1)) : 0;
      const capitalEfficiency = c.inventoryValue > 0 ? Number(((c.revenue / c.inventoryValue) * 100).toFixed(1)) : 0;
      const avgUnitCost = c.stockItemsCount > 0 ? Math.round(c.inventoryValue / c.stockItemsCount) : 0;

      return {
        tenantId: c.tenantId,
        branchCode: c.branchCode,
        tenantName: c.tenantName,
        city: c.city,
        inventoryValue: c.inventoryValue,
        stockItemsCount: c.stockItemsCount,
        revenue: c.revenue,
        lowStockCount: c.lowStockCount,
        sharePercent,
        capitalEfficiency,
        avgUnitCost,
      };
    });
  }, [analytics.tenantComparisons]);

  const totalNetworkInventory = useMemo(() => {
    return (analytics.tenantComparisons || []).reduce((sum, c) => sum + c.inventoryValue, 0);
  }, [analytics.tenantComparisons]);

  const avgBranchInventory = useMemo(() => {
    if (!analytics.tenantComparisons?.length) return 0;
    return Math.round(totalNetworkInventory / analytics.tenantComparisons.length);
  }, [totalNetworkInventory, analytics.tenantComparisons]);

  const highestInventoryBranch = useMemo(() => {
    if (!inventoryValueData.length) return null;
    return [...inventoryValueData].sort((a, b) => b.inventoryValue - a.inventoryValue)[0];
  }, [inventoryValueData]);

  // Custom Glassmorphic Tooltip for Revenue Chart
  const CustomRevenueTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);
      return (
        <div className="bg-slate-950/90 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-2xl text-white text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-white/15 pb-2">
            <span className="font-bold text-cyan-300 text-sm">{label} 2026</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
              Monthly Audit
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {payload.map((entry: any, index: number) => {
              const branchCode = entry.name;
              const tenantMatch = tenants.find(t => t.branchCode === branchCode);
              const branchName = tenantMatch ? tenantMatch.name.split(' - ')[1] || tenantMatch.name : branchCode;
              const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';

              return (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" 
                      style={{ backgroundColor: entry.color || entry.fill }}
                    />
                    <span className="text-slate-300 font-medium truncate max-w-[120px]">{branchName} ({branchCode})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white">PKR {Number(entry.value).toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 mt-1 border-t border-white/15 flex justify-between font-bold text-cyan-300">
            <span>Total Network Revenue:</span>
            <span>PKR {total.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Glassmorphic Tooltip for Inventory Valuation Chart
  const CustomInventoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/90 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-2xl text-white text-xs space-y-2.5 min-w-[250px]">
          <div className="border-b border-white/15 pb-2 flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-cyan-300">{data.branchCode}</span>
              <span className="text-[11px] text-slate-300 ml-1.5 font-medium truncate max-w-[130px] inline-block align-bottom">{data.tenantName}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold">
              {data.sharePercent}% Group Share
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Inventory Valuation:</span>
              <span className="font-extrabold text-cyan-300 text-sm">PKR {Number(data.inventoryValue).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Physical Stock Count:</span>
              <span className="font-semibold text-slate-200">{Number(data.stockItemsCount).toLocaleString()} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Average Unit Cost:</span>
              <span className="font-medium text-slate-300">PKR {data.avgUnitCost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Low Stock Formulations:</span>
              <span className={`font-bold ${data.lowStockCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {data.lowStockCount > 0 ? `${data.lowStockCount} Items Below Threshold` : 'Optimal'}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/15">
              <span className="text-slate-400">Revenue-to-Asset Efficiency:</span>
              <span className="font-bold text-emerald-300">{data.capitalEfficiency}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Glassmorphic Tooltip for Turnover Chart
  const CustomTurnoverTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/90 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-2xl text-white text-xs space-y-2.5 min-w-[240px]">
          <div className="border-b border-white/15 pb-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-cyan-300">{data.branchCode}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                data.efficiencyStatus === 'High Velocity' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : data.efficiencyStatus === 'Optimal'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {data.efficiencyStatus}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">{data.tenantName}</div>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Inventory Turnover Rate:</span>
              <span className="font-extrabold text-cyan-300 text-sm">{data.turnoverRate}x / yr</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Industry Target Benchmark:</span>
              <span className="font-semibold text-slate-300">{data.targetBenchmark || 5.0}x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Days Sales in Inventory (DSI):</span>
              <span className="font-bold text-amber-300">{data.daysSalesInventory} Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stock Valuation:</span>
              <span className="font-medium text-slate-200">PKR {Number(data.inventoryValuation).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fast-Moving Drug Class:</span>
              <span className="font-medium text-emerald-300">{data.topFastMovingCategory || 'Antibiotics'}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-7 shadow-xl shadow-blue-500/5 space-y-6">
      
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-cyan-600/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-cyan-950 tracking-tight">
              Network Financial & Inventory Performance Visualizer
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comparative analysis of monthly revenue trends, inventory turnover velocity, and working capital efficiency across all branches.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-xs self-start lg:self-auto overflow-x-auto max-w-full">
          <button
            id="tab-chart-revenue"
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'revenue'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-950 hover:bg-white/50'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Monthly Revenue</span>
          </button>

          <button
            id="tab-chart-inventory-val"
            onClick={() => setActiveTab('inventory_value')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory_value'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-950 hover:bg-white/50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Inventory Value by Branch</span>
          </button>

          <button
            id="tab-chart-turnover"
            onClick={() => setActiveTab('turnover')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'turnover'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-950 hover:bg-white/50'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Inventory Turnover (ITR)</span>
          </button>

          <button
            id="tab-chart-category"
            onClick={() => setActiveTab('category')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'category'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-600 hover:text-cyan-950 hover:bg-white/50'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Therapeutic Velocity</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Highlight Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3.5 border border-white/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Group Inventory Value</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-cyan-950">PKR {totalNetworkInventory.toLocaleString()}</span>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              {tenants.length} Branches
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Live aggregated stock valuation across network</span>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3.5 border border-white/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Avg Branch Stock Valuation</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-extrabold text-cyan-950">PKR {avgBranchInventory.toLocaleString()}</span>
            <span className="text-[11px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
              Balanced
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Mean working capital per retail branch</span>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3.5 border border-white/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Highest Asset Branch</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-extrabold text-cyan-950 truncate max-w-[150px]">
              {highestInventoryBranch ? highestInventoryBranch.branchCode : 'APX-01'}
            </span>
            <span className="text-[11px] font-extrabold text-teal-700">
              PKR {highestInventoryBranch ? (highestInventoryBranch.inventoryValue / 1000).toFixed(0) + 'k' : '0k'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block truncate">
            {highestInventoryBranch ? highestInventoryBranch.tenantName : 'Central Pharmacy'}
          </span>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-3.5 border border-white/80 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Top Revenue Contributor</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-extrabold text-cyan-950 truncate max-w-[140px]">
              {topRevenueBranch ? topRevenueBranch.branchCode : 'APX-01'}
            </span>
            <span className="text-[11px] font-bold text-cyan-700">
              PKR {topRevenueBranch ? (topRevenueBranch.revenue / 1000).toFixed(1) + 'k' : '68.5k'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block truncate">
            {topRevenueBranch ? topRevenueBranch.tenantName : 'Downtown Hub'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MONTHLY REVENUE VISUALIZATION */}
      {/* ========================================================================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Sub-controls: Chart Type & Branch Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/60 p-3 rounded-2xl border border-white/70">
            {/* Chart Type Selector */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-700" /> Chart Style:
              </span>
              <button
                id="btn-rev-stacked"
                onClick={() => setRevenueChartType('stacked')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  revenueChartType === 'stacked'
                    ? 'bg-cyan-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white'
                }`}
              >
                Stacked Bar (Total Group)
              </button>
              <button
                id="btn-rev-grouped"
                onClick={() => setRevenueChartType('grouped')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  revenueChartType === 'grouped'
                    ? 'bg-cyan-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white'
                }`}
              >
                Side-by-Side Comparison
              </button>
              <button
                id="btn-rev-area"
                onClick={() => setRevenueChartType('area')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  revenueChartType === 'area'
                    ? 'bg-cyan-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white'
                }`}
              >
                Area Trend Trajectory
              </button>
            </div>

            {/* Time Frame Selector */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-700" /> Period:
              </span>
              <button
                onClick={() => setTimeRange('6m')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === '6m' ? 'bg-cyan-700 text-white' : 'bg-white/80 text-slate-600'
                }`}
              >
                Last 6 Months
              </button>
              <button
                onClick={() => setTimeRange('3m')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeRange === '3m' ? 'bg-cyan-700 text-white' : 'bg-white/80 text-slate-600'
                }`}
              >
                Q3 Recent
              </button>
            </div>
          </div>

          {/* Branch Interactive Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Filter className="w-3 h-3 text-cyan-700" /> Active Branches:
            </span>
            {tenants.map((t, idx) => {
              const isSelected = selectedBranches.includes(t.branchCode);
              const color = branchColorMap[t.branchCode] || BRANCH_COLORS[0];
              return (
                <button
                  key={t.id}
                  onClick={() => toggleBranch(t.branchCode)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'bg-white/40 text-slate-400 border-dashed border-slate-300 opacity-60'
                  }`}
                  style={{ borderColor: isSelected ? color : undefined }}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: isSelected ? color : '#cbd5e1' }}
                  />
                  <span>{t.branchCode}</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">({t.city})</span>
                </button>
              );
            })}

            {selectedBranches.length < branchCodes.length && (
              <button
                onClick={selectAllBranches}
                className="text-[11px] font-bold text-cyan-700 hover:underline cursor-pointer ml-1"
              >
                Select All
              </button>
            )}
          </div>

          {/* Recharts Canvas */}
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {revenueChartType === 'area' ? (
                <AreaChart data={filteredMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <defs>
                    {tenants.map((t, i) => {
                      const color = branchColorMap[t.branchCode] || BRANCH_COLORS[i % BRANCH_COLORS.length];
                      return (
                        <linearGradient key={t.id} id={`grad-${t.branchCode}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.45} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomRevenueTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                  />
                  {tenants
                    .filter(t => selectedBranches.includes(t.branchCode))
                    .map((t, i) => {
                      const color = branchColorMap[t.branchCode] || BRANCH_COLORS[i % BRANCH_COLORS.length];
                      return (
                        <Area
                          key={t.id}
                          type="monotone"
                          dataKey={t.branchCode}
                          name={t.branchCode}
                          stroke={color}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill={`url(#grad-${t.branchCode})`}
                        />
                      );
                    })}
                </AreaChart>
              ) : (
                <BarChart data={filteredMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomRevenueTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                  />
                  {tenants
                    .filter(t => selectedBranches.includes(t.branchCode))
                    .map((t, i) => {
                      const color = branchColorMap[t.branchCode] || BRANCH_COLORS[i % BRANCH_COLORS.length];
                      return (
                        <Bar
                          key={t.id}
                          dataKey={t.branchCode}
                          name={t.branchCode}
                          stackId={revenueChartType === 'stacked' ? 'a' : undefined}
                          fill={color}
                          radius={revenueChartType === 'grouped' ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                        />
                      );
                    })}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVENTORY VALUE ACROSS BRANCHES */}
      {/* ========================================================================= */}
      {activeTab === 'inventory_value' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Sub-controls: Inventory Metric View */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/60 p-3 rounded-2xl border border-white/70">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-700" /> Visualization Metric:
              </span>
              <button
                id="btn-inv-metric-val"
                onClick={() => setInventoryMetric('valuation')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inventoryMetric === 'valuation'
                    ? 'bg-cyan-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white'
                }`}
              >
                Stock Valuation (PKR)
              </button>
              <button
                id="btn-inv-metric-units"
                onClick={() => setInventoryMetric('units')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inventoryMetric === 'units'
                    ? 'bg-cyan-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white'
                }`}
              >
                Physical Stock Units
              </button>
              <button
                id="btn-inv-metric-eff"
                onClick={() => setInventoryMetric('efficiency')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inventoryMetric === 'efficiency'
                    ? 'bg-cyan-900 text-white shadow-xs'
                    : 'bg-white/80 text-slate-700 hover:bg-white'
                }`}
              >
                Revenue-to-Asset Efficiency
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-cyan-950">
              <span className="px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-800 border border-teal-500/20">
                Network Total: PKR {totalNetworkInventory.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Recharts Canvas for Inventory Value */}
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {inventoryMetric === 'efficiency' ? (
                <ComposedChart data={inventoryValueData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                  <XAxis dataKey="branchCode" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis 
                    yAxisId="left"
                    stroke="#0891b2" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `PKR ${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#10b981" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomInventoryTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="inventoryValue" 
                    name="Inventory Valuation (PKR)" 
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  >
                    {inventoryValueData.map((entry, index) => (
                      <Cell key={`cell-inv-${index}`} fill={branchColorMap[entry.branchCode] || BRANCH_COLORS[index % BRANCH_COLORS.length]} />
                    ))}
                  </Bar>
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="capitalEfficiency" 
                    name="Revenue / Stock Ratio (%)" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  />
                </ComposedChart>
              ) : (
                <BarChart data={inventoryValueData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                  <XAxis dataKey="branchCode" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => inventoryMetric === 'valuation' ? `PKR ${(val / 1000).toFixed(0)}k` : `${val}u`}
                  />
                  <Tooltip content={<CustomInventoryTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                  />
                  {inventoryMetric === 'valuation' && (
                    <ReferenceLine 
                      y={avgBranchInventory} 
                      stroke="#0d9488" 
                      strokeDasharray="4 4" 
                      strokeWidth={2}
                      label={{ 
                        value: `Avg Branch Asset (PKR ${(avgBranchInventory / 1000).toFixed(0)}k)`, 
                        fill: '#0f766e', 
                        fontSize: 11, 
                        position: 'top',
                        fontWeight: 700
                      }} 
                    />
                  )}
                  <Bar 
                    dataKey={inventoryMetric === 'valuation' ? 'inventoryValue' : 'stockItemsCount'} 
                    name={inventoryMetric === 'valuation' ? 'Inventory Valuation (PKR)' : 'Stocked Units Count'} 
                    radius={[8, 8, 0, 0]}
                    barSize={44}
                  >
                    {inventoryValueData.map((entry, index) => (
                      <Cell key={`cell-bar-${index}`} fill={branchColorMap[entry.branchCode] || BRANCH_COLORS[index % BRANCH_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Branch Inventory Breakdown Matrix */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/70 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs text-cyan-950">Branch Inventory Valuation & Capital Matrix</h4>
              <span className="text-[11px] text-slate-500 font-medium">Consolidated Asset Audit</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 text-slate-500 font-semibold text-[11px]">
                  <th className="pb-2 pl-2">Branch Code & Location</th>
                  <th className="pb-2">Stock Valuation</th>
                  <th className="pb-2">Group Share</th>
                  <th className="pb-2">Physical Units</th>
                  <th className="pb-2">Avg Unit Cost</th>
                  <th className="pb-2">Stock Health</th>
                  {onNavigateBranch && <th className="pb-2 text-right pr-2">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryValueData.map((branch) => {
                  return (
                    <tr key={branch.tenantId} className="hover:bg-white/80 transition-colors">
                      <td className="py-2.5 pl-2">
                        <div className="font-bold text-slate-900">{branch.branchCode}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{branch.tenantName} ({branch.city})</div>
                      </td>
                      <td className="py-2.5 font-bold text-cyan-950 text-sm">
                        PKR {Number(branch.inventoryValue).toLocaleString()}
                      </td>
                      <td className="py-2.5 font-semibold text-teal-700">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200">
                          {branch.sharePercent}%
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-700">
                        {Number(branch.stockItemsCount).toLocaleString()} units
                      </td>
                      <td className="py-2.5 font-medium text-slate-600">
                        PKR {branch.avgUnitCost}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          branch.lowStockCount === 0
                            ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-800 border-amber-500/30'
                        }`}>
                          {branch.lowStockCount === 0 ? 'Optimal' : `${branch.lowStockCount} Low Items`}
                        </span>
                      </td>
                      {onNavigateBranch && (
                        <td className="py-2.5 text-right pr-2">
                          <button
                            onClick={() => onNavigateBranch(branch.tenantId)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-800 font-bold text-[11px] border border-cyan-500/20 transition-all cursor-pointer"
                          >
                            Inspect Inventory →
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVENTORY TURNOVER RATES (ITR) & DSI */}
      {/* ========================================================================= */}
      {activeTab === 'turnover' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Informational Banner on Pharmacy ITR */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-600/15 text-cyan-800 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-cyan-950">Pharmacy Inventory Turnover Formula:</span>
                <span className="text-slate-600 block mt-0.5">
                  <code className="bg-white/80 px-1.5 py-0.5 rounded text-cyan-900 font-mono font-semibold">
                    Turnover Multiple = Annualized COGS / Stock Valuation
                  </code>
                  {' '}• Community pharmacy benchmark is <strong>4.5x - 6.5x</strong>. Higher turns maximize cash flow and minimize batch expiration waste.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-500/30">
                Target: 5.0x / yr
              </span>
            </div>
          </div>

          {/* Dual Axis Composed Chart: Turnover Rate vs Days Sales of Inventory (DSI) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-cyan-950 text-sm">
                  Turnover Multiples vs. Days Sales in Inventory (DSI)
                </h3>
                <p className="text-xs text-slate-500">
                  Bars represent yearly turnover frequency (higher is faster); Line represents shelf holding duration in days (lower is leaner).
                </p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={turnoverData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.4)" />
                  <XAxis dataKey="branchCode" stroke="#64748b" fontSize={12} tickLine={false} />
                  
                  {/* Left Y-Axis: Turnover Multiples (e.g. 5.8x) */}
                  <YAxis 
                    yAxisId="left"
                    stroke="#0891b2" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val}x`}
                    domain={[0, 10]}
                  />

                  {/* Right Y-Axis: Days in Inventory (e.g. 65 Days) */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#d97706" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val}d`}
                    domain={[0, 120]}
                  />

                  <Tooltip content={<CustomTurnoverTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                  />

                  {/* Industry Standard Reference Line */}
                  <ReferenceLine 
                    yAxisId="left" 
                    y={5.0} 
                    stroke="#059669" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{ 
                      value: 'Target Benchmark (5.0x)', 
                      fill: '#047857', 
                      fontSize: 11, 
                      position: 'top',
                      fontWeight: 700
                    }} 
                  />

                  {/* Turnover Rate Bars */}
                  <Bar 
                    yAxisId="left"
                    dataKey="turnoverRate" 
                    name="Turnover Rate (Multiple)" 
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  >
                    {turnoverData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.turnoverRate >= 6.5 
                            ? '#059669' // Emerald for high velocity
                            : entry.turnoverRate >= 4.5 
                            ? '#0891b2' // Cyan for optimal
                            : '#d97706' // Amber for slower turns
                        } 
                      />
                    ))}
                  </Bar>

                  {/* DSI Line */}
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="daysSalesInventory" 
                    name="Days Sales in Stock (DSI)" 
                    stroke="#d97706" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#d97706', strokeWidth: 2, stroke: '#fff' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comprehensive Branch Inventory Velocity Table */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/70 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs text-cyan-950">Branch Inventory Velocity Matrix</h4>
              <span className="text-[11px] text-slate-500 font-medium">Ranked by Asset Efficiency</span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/60 text-slate-500 font-semibold text-[11px]">
                  <th className="pb-2 pl-2">Branch Code & Name</th>
                  <th className="pb-2">Turnover Rate</th>
                  <th className="pb-2">Holding Duration (DSI)</th>
                  <th className="pb-2">Stock Valuation</th>
                  <th className="pb-2">Fast-Moving Drug Class</th>
                  <th className="pb-2">Velocity Status</th>
                  {onNavigateBranch && <th className="pb-2 text-right pr-2">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {turnoverData.map((branch) => {
                  return (
                    <tr key={branch.tenantId} className="hover:bg-white/80 transition-colors">
                      <td className="py-2.5 pl-2">
                        <div className="font-bold text-slate-900">{branch.branchCode}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]">{branch.tenantName}</div>
                      </td>
                      <td className="py-2.5 font-bold text-cyan-950 text-sm">
                        {branch.turnoverRate}x <span className="text-[10px] text-slate-400 font-normal">/ yr</span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-700">
                        {branch.daysSalesInventory} Days
                      </td>
                      <td className="py-2.5 font-medium text-slate-700">
                        PKR {Number(branch.inventoryValuation).toLocaleString()}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 text-[11px] font-semibold border border-cyan-100">
                          {branch.topFastMovingCategory || 'Antibiotics'}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          branch.efficiencyStatus === 'High Velocity'
                            ? 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30'
                            : branch.efficiencyStatus === 'Optimal'
                            ? 'bg-cyan-500/15 text-cyan-800 border-cyan-500/30'
                            : 'bg-amber-500/15 text-amber-800 border-amber-500/30'
                        }`}>
                          {branch.efficiencyStatus}
                        </span>
                      </td>
                      {onNavigateBranch && (
                        <td className="py-2.5 text-right pr-2">
                          <button
                            onClick={() => onNavigateBranch(branch.tenantId)}
                            className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-cyan-800 font-bold text-[11px] border border-white/80 shadow-2xs transition-all cursor-pointer"
                          >
                            Inspect Inventory →
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: THERAPEUTIC CATEGORY VELOCITY */}
      {/* ========================================================================= */}
      {activeTab === 'category' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h3 className="font-bold text-cyan-950 text-sm">
              Cross-Network Therapeutic Category Turnover Multiples
            </h3>
            <p className="text-xs text-slate-500">
              Assessing pharmaceutical movement rates across critical formulary therapeutic classifications.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={analytics.categoryVelocityMetrics || []} 
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(203, 213, 225, 0.4)" />
                <XAxis 
                  type="number" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false}
                  tickFormatter={(val) => `${val}x`}
                  domain={[0, 8.5]}
                />
                <YAxis 
                  type="category" 
                  dataKey="category" 
                  stroke="#0f172a" 
                  fontSize={11} 
                  tickLine={false}
                  width={120}
                  fontWeight={600}
                />
                <Tooltip 
                  formatter={(val: any) => [`${val}x / yr`, 'Turnover Rate']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    backdropFilter: 'blur(12px)',
                    borderColor: 'rgba(255, 255, 255, 0.2)', 
                    borderRadius: '16px', 
                    color: '#fff',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                  }}
                />
                <ReferenceLine 
                  x={5.0} 
                  stroke="#059669" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Target 5.0x', fill: '#059669', fontSize: 10, position: 'top' }}
                />
                <Bar dataKey="turnoverRate" fill="#0891b2" radius={[0, 8, 8, 0]}>
                  {(analytics.categoryVelocityMetrics || []).map((entry, index) => (
                    <Cell 
                      key={`cat-cell-${index}`}
                      fill={entry.turnoverRate >= 6.0 ? '#059669' : entry.turnoverRate >= 4.5 ? '#0891b2' : '#d97706'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};
