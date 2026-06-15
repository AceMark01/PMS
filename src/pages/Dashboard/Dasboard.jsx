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

import { productionAPI } from '../../services/api';

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

const formatIndianNumber = (num) => {
  if (num === undefined || num === null || isNaN(Number(num))) return '0';
  const val = Number(num);
  if (val >= 10000000) {
    return `${(val / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (val >= 100000) {
    return `${(val / 100000).toFixed(2).replace(/\.00$/, '')} L`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(2).replace(/\.00$/, '')} K`;
  }
  return val.toString();
};

export default function Dasboard() {
  const masterItems = SEEDED_ITEMS;

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [kittingHistory, setKittingHistory] = useState([]);
  const [productionHistory, setProductionHistory] = useState([]);
  const [testingHistory, setTestingHistory] = useState([]);
  const [inventory, setInventory] = useState([]);

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ordersRes, jobCardRes, actualProdRes, costingRes, inventoryRes] = await Promise.all([
          productionAPI.getSheetData('PRODUCTION_ORDERS', { headerRow: 6 }),
          productionAPI.getSheetData('JOB CARD', { headerRow: 6 }),
          productionAPI.getSheetData('ACTUAL PRODUCTION', { headerRow: 6 }),
          productionAPI.getSheetData('Costing-History', { headerRow: 1 }),
          productionAPI.getSheetData('Live IMS', { headerRow: 1 })
        ]);

        let transformedOrders = [];
        if (ordersRes.success) {
          transformedOrders = (ordersRes.records || []).map(order => ({
            id: order.rowIndex?.toString() || `po-${order.sNo}`,
            sNo: order.sNo,
            timestamp: order.timestamp,
            productCode: order.productCode || '',
            productName: order.productName || '',
            baseCat: order.baseCat || '',
            qty: Number(order.qty) || 0,
            godown: order.godown || '',
            checkJc: order.checkJc || '',
            actual1: order.actual1 || ''
          }));
          setOrders(transformedOrders);
        }

        if (costingRes.success && ordersRes.success) {
          const transformedKitting = (costingRes.records || []).map(record => {
            const firstSNo = String(record.sNo).split(',')[0]?.trim();
            const matchedOrder = transformedOrders.find(o => String(o.sNo).trim() === firstSNo);
            return {
              id: record.rowIndex?.toString() || `hist-${record.sNo}`,
              rowIndex: record.rowIndex,
              sNo: record.sNo,
              timestamp: record.timestamp,
              productCode: matchedOrder ? matchedOrder.productCode : '',
              productName: matchedOrder ? matchedOrder.productName : (record.fGName || record.fgName || ''),
              baseCat: matchedOrder ? matchedOrder.baseCat : '',
              qty: Number(record.planQty || record.qty || (matchedOrder ? matchedOrder.qty : 0)) || 0,
              status: matchedOrder
                ? (matchedOrder.checkJc
                  ? (matchedOrder.checkJc.toLowerCase() === 'rejected' ? 'Rejected' : 'Approved')
                  : (matchedOrder.actual1 ? 'Pending' : 'Draft'))
                : 'Pending'
            };
          });
          setKittingHistory(transformedKitting);
        }

        if (actualProdRes.success) {
          const transformedProduction = (actualProdRes.records || []).map(record => ({
            id: record.rowIndex?.toString() || `prod-${record.sNo}`,
            rowIndex: record.rowIndex,
            jobCardNo: record.jCJobCard || record['jC-JobCard'] || record.jcJobCard || record.jobCardNo || '',
            sNo: record.sNo,
            timestamp: record.timestamp,
            productCode: record.productCode || '',
            productName: record.productName || '',
            qty: Number(record.qty) || 0,
            dateOfProduction: record.dateOfProduction || '',
            rawName1: record.rawName1 || '',
            rawQty1: record.rawQty1 || '',
            rawName2: record.rawName2 || '',
            rawQty2: record.rawQty2 || '',
            rawName3: record.rawName3 || '',
            rawQty3: record.rawQty3 || '',
            rawName4: record.rawName4 || '',
            rawQty4: record.rawQty4 || '',
            rawName5: record.rawName5 || '',
            rawQty5: record.rawQty5 || '',
            rawName6: record.rawName6 || '',
            rawQty6: record.rawQty6 || '',
            rawName7: record.rawName7 || '',
            rawQty7: record.rawQty7 || '',
            rawName8: record.rawName8 || '',
            rawQty8: record.rawQty8 || '',
            rawName9: record.rawName9 || '',
            rawQty9: record.rawQty9 || '',
            rawName10: record.rawName10 || '',
            rawQty10: record.rawQty10 || '',
          }));
          setProductionHistory(transformedProduction);
        }

        if (jobCardRes.success) {
          const historyJobCards = (jobCardRes.records || []).filter(row => {
            const valAJ = row.__rowValues && row.__rowValues[35];
            const valAK = row.__rowValues && row.__rowValues[36];
            return valAJ && valAK && valAJ.toString().trim() !== '' && valAK.toString().trim() !== '';
          });
          const transformedTesting = historyJobCards.map(jc => {
            const testingStatus = jc.__rowValues?.[38] || 'Approved';
            return {
              id: jc.id,
              rowIndex: jc.rowIndex,
              jobCardNo: jc.jobCardNo || jc.jCJobCard || jc.jcJobCard || '',
              sNo: jc.sNo,
              timestamp: jc.timestamp,
              testingStatus: testingStatus
            };
          });
          setTestingHistory(transformedTesting);
        }

        if (inventoryRes.success) {
          let fetchedData = inventoryRes.records || [];
          const masterItemsList = SEEDED_ITEMS;
          let updated = [...fetchedData];
          masterItemsList.forEach(item => {
            const exists = updated.some(inv => inv.productCode === item.code);
            if (!exists) {
              updated.push({
                productCode: item.code,
                productName: item.name,
                maxLevel: 500,
                prodGroup: item.category,
                closingStock: 0
              });
            }
          });
          setInventory(updated);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
        toast.error('Failed to load dashboard metrics from spreadsheet');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    return inventory.map(item => {
      // Find matching item in SEEDED_ITEMS to extract brand and price
      const seedItem = masterItems.find(si => si.code === item.productCode) || {};

      const currentQty = Number(item.closingStock) || 0;
      const maxLevel = Number(item.maxLevel) || 500;
      const stockLevel = currentQty >= maxLevel * 0.2 ? 'Stock Full' : 'Stock Low';

      return {
        code: item.productCode,
        name: item.productName,
        category: item.prodGroup || seedItem.category || 'General',
        brand: seedItem.brand || 'General',
        price: seedItem.price || 0,
        openingQty: 0,
        purchaseQty: 0,
        salesQty: 0,
        purchaseReturnQty: 0,
        salesReturnQty: 0,
        currentQty: currentQty,
        stockLevel: stockLevel
      };
    });
  }, [inventory, masterItems]);

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

    // Kitting completion rate: approved job cards over total production orders
    const approvedKittings = kittingHistory.filter(h => h.status === 'Approved').length;
    const kittingRate = totalOrders > 0 ? Math.round((approvedKittings / totalOrders) * 100) : 0;

    // Production details
    const totalProducedCount = productionHistory.length;
    const totalProducedQty = productionHistory.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

    // QA testing pass rate
    const totalTestedCount = testingHistory.length;
    const approvedTestedCount = testingHistory.filter(t => (t.testingStatus || '').toLowerCase() === 'approved').length;
    const testingPassRate = totalTestedCount > 0 ? Math.round((approvedTestedCount / totalTestedCount) * 100) : 0;

    // Low stock count
    const lowStockCount = computedStocks.filter(s => s.stockLevel === 'Stock Low').length;

    return {
      totalOrders,
      approvedKittings,
      kittingRate,
      totalProducedCount,
      totalProducedQty,
      totalTestedCount,
      approvedTestedCount,
      testingPassRate,
      lowStockCount
    };
  }, [orders, kittingHistory, productionHistory, testingHistory, computedStocks]);

  const topFG = useMemo(() => {
    const fgTotals = {};
    productionHistory.forEach(p => {
      const name = p.productName || p.productCode || 'Unknown';
      const qty = Number(p.qty) || 0;
      fgTotals[name] = (fgTotals[name] || 0) + qty;
    });
    const sorted = Object.entries(fgTotals)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
    return sorted[0] || { name: 'N/A', qty: 0 };
  }, [productionHistory]);

  const topRaw = useMemo(() => {
    const rawTotals = {};
    productionHistory.forEach(p => {
      for (let i = 1; i <= 10; i++) {
        const name = p[`rawName${i}`];
        const qty = Number(p[`rawQty${i}`]) || 0;
        if (name && name.trim() !== '') {
          const cleanName = name.trim().toUpperCase();
          rawTotals[cleanName] = (rawTotals[cleanName] || 0) + qty;
        }
      }
    });
    const sorted = Object.entries(rawTotals)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);
    return sorted[0] || { name: 'N/A', qty: 0 };
  }, [productionHistory]);

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    return dateStr.toString().includes(today);
  };

  const todayPlanningReport = useMemo(() => {
    return orders.filter(o => o.timestamp && isToday(o.timestamp));
  }, [orders]);

  const todayProductionReport = useMemo(() => {
    return productionHistory.filter(p => isToday(p.timestamp) || isToday(p.dateOfProduction));
  }, [productionHistory]);

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

  // Find top 5 items running lowest on stock (Stock Low)
  const lowStockAlertItems = useMemo(() => {
    return computedStocks
      .filter(item => item.stockLevel === 'Stock Low')
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
          <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${isFull ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
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
          <span className={`px-2 py-0.5 rounded text-[8px] uppercase font-black ${isFull ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
            {item.stockLevel}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full overflow-y-auto bg-slate-50/20 scrollbar-thin">

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
              {kpiStats.approvedKittings} approved
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
            <span className="text-[9px] text-blue-500 font-bold block mt-0.5">{kpiStats.approvedTestedCount} items approved</span>
          </div>
        </div>

        {/* Top FG Produced Card */}
        <div className="bg-white rounded-2xl border border-indigo-50/60 shadow-xs p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <Box size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block truncate">Top Product (FG)</span>
            <span className="text-sm font-black text-slate-800 block truncate uppercase mt-0.5" title={topFG.name}>{topFG.name}</span>
            <span className="text-[10px] text-orange-500 font-extrabold block mt-0.5">{topFG.qty.toLocaleString('en-IN')} Pcs produced</span>
          </div>
        </div>

        {/* Top Raw Material Card */}
        <div className="bg-white rounded-2xl border border-indigo-50/60 shadow-xs p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Layers size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold block truncate">Top Raw Material</span>
            <span className="text-sm font-black text-slate-800 block truncate uppercase mt-0.5" title={topRaw.name}>{topRaw.name}</span>
            <span className="text-[10px] text-amber-600 font-extrabold block mt-0.5">{topRaw.qty.toLocaleString('en-IN')} units consumed</span>
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
                  <YAxis tickLine={false} axisLine={false} tickFormatter={formatIndianNumber} tick={{ fill: '#64748B', fontWeight: 600 }} />
                  <Tooltip
                    formatter={(value) => [formatIndianNumber(value), 'Quantity']}
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

      {/* Today's Planning & Production Reports */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Today's Planning Report */}
        <div className="bg-white rounded-2xl border border-indigo-50 shadow-xs p-5 flex flex-col min-w-0">
          <div className="pb-3 border-b border-slate-100 mb-3 flex items-center gap-2">
            <ClipboardList className="text-indigo-600" size={18} />
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Today's Planning Report</h3>
              <p className="text-[9px] text-gray-400 font-bold">Production orders created or scheduled for today.</p>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto min-h-[220px] max-h-[300px] scrollbar-thin">
            {todayPlanningReport.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-indigo-50/30 text-indigo-700 font-black uppercase text-[10px] tracking-wider border-b border-indigo-100/50">
                    <th className="py-2.5 px-3">S NO</th>
                    <th className="py-2.5 px-3">Product Code</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-center">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todayPlanningReport.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-3 text-gray-500 font-mono">{row.sNo}</td>
                      <td className="py-2 px-3 text-indigo-600 font-bold">{row.productCode}</td>
                      <td className="py-2 px-3 text-gray-800 uppercase font-semibold truncate max-w-[150px]">{row.productName}</td>
                      <td className="py-2 px-3 text-center text-indigo-600 font-black">{row.qty}</td>
                      <td className="py-2 px-3 text-center text-gray-400 font-medium">
                        {row.timestamp ? row.timestamp.split(' ')[1] || row.timestamp : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10 space-y-2 font-medium text-center">
                <ClipboardList size={32} className="text-gray-300 animate-pulse" />
                <span>No production orders planned today</span>
              </div>
            )}
          </div>
        </div>

        {/* Today's Actual Production Report */}
        <div className="bg-white rounded-2xl border border-indigo-50 shadow-xs p-5 flex flex-col min-w-0">
          <div className="pb-3 border-b border-slate-100 mb-3 flex items-center gap-2">
            <Activity className="text-emerald-600" size={18} />
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Today's Actual Production Report</h3>
              <p className="text-[9px] text-gray-400 font-bold">Actual production log entries submitted today.</p>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto min-h-[220px] max-h-[300px] scrollbar-thin">
            {todayProductionReport.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-emerald-50/30 text-emerald-700 font-black uppercase text-[10px] tracking-wider border-b border-emerald-100/50">
                    <th className="py-2.5 px-3">Job Card</th>
                    <th className="py-2.5 px-3">Product Code</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-center">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {todayProductionReport.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-3 text-emerald-600 font-bold">{row.jobCardNo}</td>
                      <td className="py-2 px-3 text-indigo-600 font-bold">{row.productCode}</td>
                      <td className="py-2 px-3 text-gray-800 uppercase font-semibold truncate max-w-[150px]">{row.productName}</td>
                      <td className="py-2 px-3 text-center text-emerald-600 font-black">{row.qty}</td>
                      <td className="py-2 px-3 text-center text-gray-400 font-medium">
                        {row.timestamp ? row.timestamp.split(' ')[1] || row.timestamp : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10 space-y-2 font-medium text-center">
                <Activity size={32} className="text-gray-300 animate-pulse" />
                <span>No production logs submitted today</span>
              </div>
            )}
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
                      {typeof item.currentQty === 'number'
                        ? item.currentQty.toFixed(3)
                        : parseFloat(item.currentQty).toFixed(3)} Qty
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[500px] flex-shrink-0">
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
