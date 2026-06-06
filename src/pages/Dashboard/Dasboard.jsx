import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Search, 
  RotateCcw, 
  Box, 
  Tag, 
  Layers, 
  DollarSign, 
  Activity, 
  Filter, 
  ClipboardList, 
  Blocks, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Package
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import DataTable from '../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';

import { SEEDED_ITEMS } from '../../utils/seeds';

const SEEDED_TRANSACTIONS = [
  { id: 'tx-001', serialNo: 'TX-001', date: '2026-06-01', type: 'Purchase', itemCode: 'IT-001', itemName: 'Screwdriver Set 12pcs', category: 'Hardware & Tools', brand: 'Bosch', price: 850, qty: 150, totalPrice: 127500 },
  { id: 'tx-002', serialNo: 'TX-002', date: '2026-06-01', type: 'Purchase', itemCode: 'IT-002', itemName: 'Circuit Breaker 16A', category: 'Electrical Supplies', brand: 'Schneider', price: 320, qty: 250, totalPrice: 80000 },
  { id: 'tx-003', serialNo: 'TX-003', date: '2026-06-02', type: 'Sales', itemCode: 'IT-001', itemName: 'Screwdriver Set 12pcs', category: 'Hardware & Tools', brand: 'Bosch', price: 850, qty: 20, totalPrice: 17000 },
  { id: 'tx-004', serialNo: 'TX-004', date: '2026-06-02', type: 'Sales', itemCode: 'IT-002', itemName: 'Circuit Breaker 16A', category: 'Electrical Supplies', brand: 'Schneider', price: 320, qty: 50, totalPrice: 16000 },
  { id: 'tx-005', serialNo: 'TX-005', date: '2026-06-02', type: 'Purchase', itemCode: 'IT-003', itemName: 'A4 Copier Paper (Rim)', category: 'Office Stationery', brand: 'HP', price: 280, qty: 100, totalPrice: 28000 },
  { id: 'tx-006', serialNo: 'TX-006', date: '2026-06-03', type: 'Sales', itemCode: 'IT-003', itemName: 'A4 Copier Paper (Rim)', category: 'Office Stationery', brand: 'HP', price: 280, qty: 15, totalPrice: 4200 },
  { id: 'tx-007', serialNo: 'TX-007', date: '2026-06-03', type: 'Purchase', itemCode: 'IT-004', itemName: 'N95 Safety Mask', category: 'Safety Gear', brand: '3M', price: 45, qty: 500, totalPrice: 22500 },
  { id: 'tx-008', serialNo: 'TX-008', date: '2026-06-03', type: 'Sales', itemCode: 'IT-004', itemName: 'N95 Safety Mask', category: 'Safety Gear', brand: '3M', price: 45, qty: 120, totalPrice: 5400 },
  { id: 'tx-009', serialNo: 'TX-009', date: '2026-06-04', type: 'Purchase', itemCode: 'IT-005', itemName: 'TMT Steel Rod 12mm', category: 'Raw Materials', brand: 'Tata Steel', price: 550, qty: 80, totalPrice: 44000 },
  { id: 'tx-010', serialNo: 'TX-010', date: '2026-06-04', type: 'Sales', itemCode: 'IT-005', itemName: 'TMT Steel Rod 12mm', category: 'Raw Materials', brand: 'Tata Steel', price: 550, qty: 10, totalPrice: 5500 }
];

export default function Dasboard() {
  const [masterItems, setMasterItems] = useState(() => {
    const saved = localStorage.getItem('master_items');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('master_items', JSON.stringify(SEEDED_ITEMS));
    return SEEDED_ITEMS;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('inventory_transactions');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('inventory_transactions', JSON.stringify(SEEDED_TRANSACTIONS));
    return SEEDED_TRANSACTIONS;
  });

  // Load other modules data for full-system metrics
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('production_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [kittingHistory, setKittingHistory] = useState(() => {
    const saved = localStorage.getItem('kitting_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [productionHistory, setProductionHistory] = useState(() => {
    const saved = localStorage.getItem('actual_production_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [testingHistory, setTestingHistory] = useState(() => {
    const saved = localStorage.getItem('testing_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: '',
    category: '',
    brand: '',
    stockLevel: '' // 'Stock Full' | 'Stock Low' | ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Sync state with storage updates
  useEffect(() => {
    const refreshData = () => {
      const savedMaster = localStorage.getItem('master_items');
      if (savedMaster) setMasterItems(JSON.parse(savedMaster));

      const savedTx = localStorage.getItem('inventory_transactions');
      if (savedTx) setTransactions(JSON.parse(savedTx));

      const savedOrders = localStorage.getItem('production_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedKitting = localStorage.getItem('kitting_history');
      if (savedKitting) setKittingHistory(JSON.parse(savedKitting));

      const savedProd = localStorage.getItem('actual_production_history');
      if (savedProd) setProductionHistory(JSON.parse(savedProd));

      const savedTesting = localStorage.getItem('testing_history');
      if (savedTesting) setTestingHistory(JSON.parse(savedTesting));
    };

    window.addEventListener('storage', refreshData);
    window.addEventListener('focus', refreshData);
    return () => {
      window.removeEventListener('storage', refreshData);
      window.removeEventListener('focus', refreshData);
    };
  }, []);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      category: '',
      brand: '',
      stockLevel: ''
    });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  // Compile active categories and brands for filtering dropdowns
  const categoriesList = useMemo(() => {
    return Array.from(new Set(masterItems.map(i => i.category))).filter(Boolean).sort();
  }, [masterItems]);

  const brandsList = useMemo(() => {
    return Array.from(new Set(masterItems.map(i => i.brand))).filter(Boolean).sort();
  }, [masterItems]);

  // Compute live stock summary metrics
  const computedStocks = useMemo(() => {
    return masterItems.map(item => {
      const openingQty = 0;

      // Extract transaction aggregates
      const itemTx = transactions.filter(t => t.itemCode === item.code);

      const purchaseQty = itemTx
        .filter(t => t.type === 'Purchase')
        .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

      const salesQty = itemTx
        .filter(t => t.type === 'Sales')
        .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

      const purchaseReturnQty = itemTx
        .filter(t => t.type === 'Purchase Return')
        .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

      const salesReturnQty = itemTx
        .filter(t => t.type === 'Sales Return')
        .reduce((sum, t) => sum + (Number(t.qty) || 0), 0);

      // Current Qty = Opening + Purchase - Sales - Purchase Return + Sales Return
      const currentQty = openingQty + purchaseQty - salesQty - purchaseReturnQty + salesReturnQty;
      const stockLevel = currentQty >= 30 ? 'Stock Full' : 'Stock Low';

      return {
        ...item,
        openingQty,
        purchaseQty,
        salesQty,
        purchaseReturnQty,
        salesReturnQty,
        currentQty,
        stockLevel
      };
    });
  }, [masterItems, transactions]);

  // Apply filters
  const filteredStocks = useMemo(() => {
    return computedStocks.filter(item => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.brand && item.brand !== filters.brand) return false;
      if (filters.stockLevel && item.stockLevel !== filters.stockLevel) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [computedStocks, filters]);

  // Compute KPI Card statistics
  const kpiStats = useMemo(() => {
    const totalOrders = orders.length;

    // Kitting completion rate
    const totalKittings = kittingHistory.length;
    const approvedKittings = kittingHistory.filter(h => h.status === 'Approved').length;
    const kittingRate = totalKittings > 0 ? Math.round((approvedKittings / totalKittings) * 100) : 0;

    // Production details
    const totalProducedCount = productionHistory.length;
    const totalProducedQty = productionHistory.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

    // QA testing pass rate
    const totalTestedCount = testingHistory.length;
    const approvedTestedCount = testingHistory.filter(t => t.testingStatus === 'Approved').length;
    const testingPassRate = totalTestedCount > 0 ? Math.round((approvedTestedCount / totalTestedCount) * 100) : 0;

    // Low stock count
    const lowStockCount = computedStocks.filter(s => s.currentQty < 30).length;

    return {
      totalOrders,
      approvedKittings,
      totalKittings,
      kittingRate,
      totalProducedCount,
      totalProducedQty,
      totalTestedCount,
      approvedTestedCount,
      testingPassRate,
      lowStockCount
    };
  }, [orders, kittingHistory, productionHistory, testingHistory, computedStocks]);

  // Group stock data by category for Bar Chart
  const categoryChartData = useMemo(() => {
    const categoryMap = {};
    computedStocks.forEach(item => {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = 0;
      }
      categoryMap[item.category] += Math.max(0, item.currentQty);
    });

    return Object.keys(categoryMap)
      .map(cat => ({
        name: cat,
        Quantity: categoryMap[cat]
      }))
      .sort((a, b) => b.Quantity - a.Quantity)
      .slice(0, 6); // Top 6 categories
  }, [computedStocks]);

  // QA testing status data for Pie Chart
  const qaPieData = useMemo(() => {
    const approved = testingHistory.filter(t => t.testingStatus === 'Approved').length;
    const rejected = testingHistory.filter(t => t.testingStatus === 'Rejected').length;
    
    // Default to seeded display if no testing history logs are found
    if (approved === 0 && rejected === 0) {
      return [
        { name: 'Approved', value: 8, color: '#10B981' },
        { name: 'Rejected', value: 2, color: '#EF4444' }
      ];
    }
    return [
      { name: 'Approved', value: approved, color: '#10B981' },
      { name: 'Rejected', value: rejected, color: '#EF4444' }
    ];
  }, [testingHistory]);

  // Find top 5 items running lowest on stock (< 30 items)
  const lowStockAlertItems = useMemo(() => {
    return computedStocks
      .filter(item => item.currentQty < 30)
      .sort((a, b) => a.currentQty - b.currentQty)
      .slice(0, 5);
  }, [computedStocks]);

  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);
  const paginatedStocks = filteredStocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "Serial No", "Item Code", "Item Name", "Category", "Brand", "Unit Price", 
    "Opening Qty", "Purchase Qty", "Sales Qty", "Purchase Return Qty", "Sales Return Qty", "Current Qty", "Stock Level"
  ];

  const renderRow = (item, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    const isFull = item.stockLevel === 'Stock Full';

    return (
      <tr key={item.code} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{globalIdx}</td>
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold whitespace-nowrap">{item.code}</td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 whitespace-nowrap uppercase">{item.name}</td>
        <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.category}</td>
        <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.brand}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-medium whitespace-nowrap">₹{item.price.toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-500 font-bold whitespace-nowrap">{item.openingQty}</td>
        <td className="px-4 py-3 text-center text-xs text-emerald-600 font-bold whitespace-nowrap">+{item.purchaseQty}</td>
        <td className="px-4 py-3 text-center text-xs text-rose-600 font-bold whitespace-nowrap">-{item.salesQty}</td>
        <td className="px-4 py-3 text-center text-xs text-amber-600 font-bold whitespace-nowrap">-{item.purchaseReturnQty}</td>
        <td className="px-4 py-3 text-center text-xs text-emerald-500 font-bold whitespace-nowrap">+{item.salesReturnQty}</td>
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-black whitespace-nowrap bg-indigo-50/20">{item.currentQty}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
            isFull ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {item.stockLevel}
          </span>
        </td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
    const isFull = item.stockLevel === 'Stock Full';

    return (
      <div key={item.code} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
              {globalIdx}
            </span>
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[150px]">{item.name}</span>
          </div>
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">
            {item.code}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Category / Brand</span>
            <span className="text-gray-700 font-medium">{item.category} ({item.brand})</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Unit Price</span>
            <span className="text-gray-700 font-medium">₹{item.price.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Opening / Purchase Qty</span>
            <span className="text-gray-700 font-medium">{item.openingQty} / <span className="text-emerald-600 font-bold">+{item.purchaseQty}</span></span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Sales / Current Qty</span>
            <span className="text-gray-700 font-medium"><span className="text-rose-600 font-bold">-{item.salesQty}</span> / <span className="text-indigo-600 font-bold">{item.currentQty}</span></span>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-[11px]">
          <span className="text-gray-400 uppercase text-[8px]">Stock Status</span>
          <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-black ${
            isFull ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {item.stockLevel}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0 bg-slate-50/20">

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Orders Card */}
        <div className="bg-white rounded-2xl border border-indigo-50/60 shadow-xs p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={24} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block">Total Orders</span>
            <span className="text-xl font-black text-slate-800 block">{kpiStats.totalOrders}</span>
            <span className="text-[9px] text-indigo-500 font-bold block mt-0.5">Production pipeline</span>
          </div>
        </div>

        {/* Kitting Completion Card */}
        <div className="bg-white rounded-2xl border border-indigo-50/60 shadow-xs p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Blocks size={24} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block">Full Kitting</span>
            <span className="text-xl font-black text-slate-800 block">{kpiStats.kittingRate}%</span>
            <span className="text-[9px] text-purple-500 font-bold block mt-0.5">
              {kpiStats.approvedKittings}/{kpiStats.totalKittings} approved
            </span>
          </div>
        </div>

        {/* Produced Quantity Card */}
        <div className="bg-white rounded-2xl border border-indigo-50/60 shadow-xs p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block">Manufactured</span>
            <span className="text-xl font-black text-slate-800 block">{kpiStats.totalProducedQty} <span className="text-xs font-semibold text-gray-400">pcs</span></span>
            <span className="text-[9px] text-emerald-500 font-bold block mt-0.5">{kpiStats.totalProducedCount} batches completed</span>
          </div>
        </div>

        {/* Quality Testing Pass Rate Card */}
        <div className="bg-white rounded-2xl border border-indigo-50/60 shadow-xs p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={24} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block">QA Test Pass Rate</span>
            <span className="text-xl font-black text-slate-800 block">{kpiStats.testingPassRate}%</span>
            <span className="text-[9px] text-blue-500 font-bold block mt-0.5">{kpiStats.approvedTestedCount}/{kpiStats.totalTestedCount} items approved</span>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="bg-white rounded-2xl border border-indigo-50/60 shadow-xs p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block">Low Stock Alerts</span>
            <span className="text-xl font-black text-slate-800 block">{kpiStats.lowStockCount}</span>
            <span className="text-[9px] text-rose-500 font-bold block mt-0.5">Items with stock &lt; 30</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics & Alerts Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Stocks Volume Chart */}
        <div className="bg-white rounded-2xl border border-indigo-50 shadow-xs p-5 lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Stock Levels by Category</h3>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-2 py-0.5 rounded-full">Top 6 Categories</span>
          </div>
          <div className="h-[250px] w-full text-xs">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 600, fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'extrabold', color: '#1E293B', textTransform: 'uppercase', fontSize: '11px' }}
                  />
                  <Bar dataKey="Quantity" radius={[8, 8, 0, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4F46E5' : '#8B5CF6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-medium">No category inventory items found</div>
            )}
          </div>
        </div>

        {/* Quality Testing Decisions (Pie Chart) & Low Stock alert lists */}
        <div className="bg-white rounded-2xl border border-indigo-50 shadow-xs p-5 space-y-3">
          <div className="pb-2 border-b border-slate-50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">QA QA/QC Breakdown</h3>
          </div>
          <div className="h-[160px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={qaPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {qaPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-lg font-black text-slate-800">{kpiStats.testingPassRate}%</span>
              <span className="text-[8px] text-gray-400 uppercase font-black tracking-wider">Pass Rate</span>
            </div>
          </div>
          {/* Pie Chart Legend */}
          <div className="flex justify-center gap-6 text-xs font-bold pt-2">
            {qaPieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid for Bottom Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts Widget */}
        <div className="bg-white rounded-2xl border border-indigo-50 shadow-xs p-5 lg:col-span-1 space-y-3 flex flex-col">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="text-rose-500" size={16} />
              <span>Critical Low Stock Items</span>
            </h3>
            <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full">
              {kpiStats.lowStockCount} Alert(s)
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1 scrollbar-thin">
            {lowStockAlertItems.length > 0 ? (
              lowStockAlertItems.map((item) => (
                <div 
                  key={item.code} 
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-50/30 border border-rose-100/40 hover:bg-rose-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-extrabold text-slate-800 block truncate max-w-[170px] uppercase">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold">
                      <span className="bg-slate-100 text-slate-700 px-1 py-0.2 rounded uppercase">{item.code}</span>
                      <span>•</span>
                      <span>{item.brand}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-rose-600 block">
                      {item.currentQty} Qty
                    </span>
                    <span className="text-[8px] text-rose-500 font-bold uppercase tracking-wider">
                      Requires order
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-xs py-10 space-y-2 font-medium">
                <ShieldCheck size={28} className="text-emerald-500" />
                <span>All catalog items are fully stocked!</span>
              </div>
            )}
          </div>
        </div>

        {/* Stock Catalog table view header and filters */}
        <div className="bg-white rounded-2xl border border-indigo-50 shadow-xs p-5 lg:col-span-2 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-50">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="text-indigo-600" size={16} />
                <span>Live Stock Inventory Monitor</span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5 font-bold">Catalog inventory tracking with transaction audits.</p>
            </div>
            {/* Desktop Clear Filters button */}
            <button
              onClick={handleClearFilters}
              className="hidden sm:flex items-center justify-center bg-gray-50 hover:bg-gray-150 border border-gray-200 text-gray-500 rounded-lg p-1.5 transition-colors shadow-xs"
              title="Clear Catalog Filters"
            >
              <RotateCcw size={14} className="mr-1" />
              <span className="text-xs font-extrabold">Reset</span>
            </button>
          </div>

          {/* Search bar and Filters Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {/* Search Input */}
            <div className="relative sm:col-span-1">
              <Search className="absolute left-2.5 top-[9px] text-gray-400" size={12} />
              <input
                type="text"
                placeholder="Search catalog..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-indigo-500 text-xs h-[32px]"
              />
            </div>
            
            {/* Category Dropdown */}
            <div className="sm:col-span-1">
              <SearchableDropdown
                options={categoriesList.map(c => ({ value: c, label: c }))}
                value={filters.category}
                onChange={(val) => setFilters({ ...filters, category: val })}
                placeholder="All Categories"
                className="h-[32px]"
                height="h-[32px]"
                rounded="rounded-lg"
              />
            </div>

            {/* Brand Dropdown */}
            <div className="sm:col-span-1">
              <SearchableDropdown
                options={brandsList.map(b => ({ value: b, label: b }))}
                value={filters.brand}
                onChange={(val) => setFilters({ ...filters, brand: val })}
                placeholder="All Brands"
                className="h-[32px]"
                height="h-[32px]"
                rounded="rounded-lg"
              />
            </div>

            {/* Stock Level Dropdown */}
            <div className="sm:col-span-1">
              <SearchableDropdown
                options={[
                  { value: 'Stock Full', label: 'Stock Full (Green)' },
                  { value: 'Stock Low', label: 'Stock Low (Red)' }
                ]}
                value={filters.stockLevel}
                onChange={(val) => setFilters({ ...filters, stockLevel: val })}
                placeholder="All Stock Levels"
                className="h-[32px]"
                height="h-[32px]"
                rounded="rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedStocks}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1400px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredStocks.length}
          itemsPerPageOptions={[50, 100, 200, 500, 1000]}
        />
      </div>

    </div>
  );
}
