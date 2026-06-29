import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, RotateCcw, Filter } from 'lucide-react';
import DataTable from '../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';
import ColumnToggle from '../../components/ColumnToggle';
import { productionAPI, indentAPI } from '../../services/api';

const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr || dateStr.trim() === '' || dateStr === '-') return '-';
  // Check if it matches ISO date-time or similar that can be parsed by Date
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    // If it cannot be parsed by Date, check if it's already in DD/MM/YYYY or DD-MM-YYYY format
    const match = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function OrderDetails() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: '',
    baseCat: '',
    godown: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const allHeaders = useMemo(() => [
    "Select",
    "Timestamp", 
    "S NO", 
    "ProductCode", 
    "ProductName", 
    "BaseCat", 
    "Order Quantity", 
    "Godown",
    "Actual Production Done",
    "Production Pending Qty",
    "Date of completion"
  ], []);

  const [visibleColumns, setVisibleColumns] = useState([
    "Select",
    "Timestamp", 
    "S NO", 
    "ProductCode", 
    "ProductName", 
    "BaseCat", 
    "Order Quantity", 
    "Godown",
    "Actual Production Done",
    "Production Pending Qty",
    "Date of completion"
  ]);

  const handleToggleColumn = (columnName) => {
    setVisibleColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  // Fetch orders from Google Sheet API on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await productionAPI.getSheetData('PRODUCTION_ORDERS', { headerRow: 6 });

      if (result.success) {
        // Transform the data to match your frontend structure
        const transformedOrders = result.records
          .filter(order => order.sNo || order.productCode || order.productName)
          .map(order => ({
            id: order.rowIndex.toString(),
            sNo: order.sNo || '',
            timestamp: order.timestamp || '',
            productCode: order.productCode || '',
            productName: order.productName || '',
            baseCat: order.baseCat || '',
            qty: order.qty || '',
            godown: order.godown || '',
            orderCancel: order.orderCancel || '',
            actualProductionDone: order.actualProductionDone || '',
            productionPendingQty: order.productionPendingQty || '',
            dateOfCompleteProduction: order.dateOfCompleteProduction || '',
            rowIndex: order.rowIndex
          }));

        setOrders(transformedOrders);
      } else {
        setError(result.error || 'Failed to load orders');
        toast.error(`Failed to load orders: ${result.error}`);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to connect to server. Please check your connection.');
      toast.error('Failed to connect to server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      baseCat: '',
      godown: ''
    });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };


  // Compile active categories and godowns for filters from API data
  const categoriesList = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.baseCat))).filter(Boolean).sort();
  }, [orders]);

  const godownsList = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.godown))).filter(Boolean).sort();
  }, [orders]);

  // Apply search/filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filters.baseCat && order.baseCat !== filters.baseCat) return false;
      if (filters.godown && order.godown !== filters.godown) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          (order.productCode && order.productCode.toLowerCase().includes(q)) ||
          (order.productName && order.productName.toLowerCase().includes(q)) ||
          (order.baseCat && order.baseCat.toLowerCase().includes(q)) ||
          (order.godown && order.godown.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => Number(a.sNo || 0) - Number(b.sNo || 0)); // Sort by serial no in ascending order
  }, [orders, filters]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAllSelected = useMemo(() => {
    if (paginatedOrders.length === 0) return false;
    return paginatedOrders.every(item => selectedIds.includes(item.id));
  }, [paginatedOrders, selectedIds]);

  const handleSelectAllChange = (checked) => {
    if (checked) {
      const pageIds = paginatedOrders.map(item => item.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedOrders.map(item => item.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleCheckboxChange = (itemId, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, itemId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== itemId));
    }
  };

  const tableHeaders = useMemo(() => {
    return allHeaders
      .map(h => {
        if (h === 'Select') {
          return (
            <input
              key="select-all"
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => handleSelectAllChange(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer mx-auto block"
            />
          );
        }
        return h;
      })
      .filter(h => {
        if (h.key === 'select-all') return true;
        return visibleColumns.includes(h);
      });
  }, [allHeaders, visibleColumns, isAllSelected]);

  const handlePreClose = async () => {
    alert("You have selected items for Pre-Closing.");
    const confirmed = window.confirm("Are you sure you want to submit Pre-Closing for the selected records?");
    if (!confirmed) return;

    const loadToast = toast.loading('Submitting Pre-Closing records...');
    try {
      const selectedRecords = orders.filter(o => selectedIds.includes(o.id));

      for (const item of selectedRecords) {
        const todayDateStr = new Date().toLocaleDateString('en-IN').replace(/\//g, '-');
        const rowData = [
          todayDateStr,                      // A: Date
          item.sNo || '',                    // B: S No
          item.productCode || '',            // C: Product Code
          item.productName || '',            // D: Product Name
          item.baseCat || '',                // E: basecat
          item.productionPendingQty || '',   // F: Pending Qty
          '',                                // G: Reorder Level
          '',                                // H: Max Level
          '',                                // I: Closing Stock
          '',                                // J: Reorder Qty
          '',                                // K
          '',                                // L
          '',                                // M
          '',                                // N
          '',                                // O
          '',                                // P
          item.actualProductionDone || '',   // Q: Total Production
          item.productionPendingQty || '',   // R: Production Pending Qty
          item.dateOfCompleteProduction || '' // S: Last Product Date
        ];

        const res = await indentAPI.insertRow('PreClosed', rowData);
        if (!res.success) {
          throw new Error(res.error || 'Failed to submit row');
        }
      }

      toast.success('Pre-Closing records successfully submitted!', { id: loadToast });
      setSelectedIds([]);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to submit Pre-Closing: ${err.message || err}`, { id: loadToast });
    }
  };

  const renderRow = (item, idx) => {
    return (
      <tr key={item.id || idx} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <input
            type="checkbox"
            checked={selectedIds.includes(item.id)}
            onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer mx-auto block"
          />
        </td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{item.timestamp}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{item.sNo}</td>
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold whitespace-nowrap">{item.productCode}</td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 whitespace-nowrap uppercase">{item.productName}</td>
        <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.baseCat}</td>
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold whitespace-nowrap">{item.qty}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-medium whitespace-nowrap">{item.godown}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-semibold whitespace-nowrap">{item.actualProductionDone || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-semibold whitespace-nowrap">{item.productionPendingQty || '-'}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{formatDateToDDMMYYYY(item.dateOfCompleteProduction)}</td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    return (
      <div key={item.id || idx} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100 relative">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
              #{item.sNo}
            </span>
            <span className="text-xs font-bold text-gray-900 uppercase">{item.productName}</span>
          </div>
          <input
            type="checkbox"
            checked={selectedIds.includes(item.id)}
            onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Timestamp</span>
            <span className="text-gray-700 font-medium">{item.timestamp}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Product Code</span>
            <span className="text-indigo-600 font-bold">{item.productCode}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Base Cat</span>
            <span className="text-gray-700 font-medium">{item.baseCat}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-black">Order Quantity</span>
            <span className="text-indigo-600 font-black">{item.qty}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-bold">Production Done</span>
            <span className="text-gray-700 font-medium">{item.actualProductionDone || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-bold">Pending Qty</span>
            <span className="text-amber-600 font-bold">{item.productionPendingQty || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-bold">Godown</span>
            <span className="text-gray-700 font-medium">{item.godown}</span>
          </div>
          <div className="col-span-2 border-t border-slate-100 pt-1.5 mt-1">
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Date of completion</span>
            <span className="text-gray-700 font-medium">{formatDateToDDMMYYYY(item.dateOfCompleteProduction)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading production orders...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">

      {/* Header Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">

          {/* Search bar */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search production orders..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-indigo-500 text-xs md:text-sm h-[32px] md:h-[38px]"
              />
            </div>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`lg:hidden flex items-center justify-center rounded-lg shadow-sm h-[32px] w-[32px] flex-shrink-0 transition ${showMobileFilters ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              title="Toggle Filters"
            >
              <Filter size={14} />
            </button>
            <button
              onClick={handleClearFilters}
              className="lg:hidden flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
              title="Clear Filters"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Filters Dropdown Group */}
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>

            {/* Base Cat (Category) Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[150px]">
              <SearchableDropdown
                options={categoriesList.map(c => ({ value: c, label: c }))}
                value={filters.baseCat}
                onChange={(val) => setFilters({ ...filters, baseCat: val })}
                placeholder="All Categories"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            {/* Godown Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[150px]">
              <SearchableDropdown
                options={godownsList.map(g => ({ value: g, label: g }))}
                value={filters.godown}
                onChange={(val) => setFilters({ ...filters, godown: val })}
                placeholder="All Godowns"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            <button
              onClick={handleClearFilters}
              className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] hover:bg-gray-100 transition-colors shadow-sm"
              title="Clear Filters"
            >
              <RotateCcw size={16} />
            </button>

            <ColumnToggle
              headers={allHeaders.filter(h => h !== 'Select')}
              visibleColumns={visibleColumns}
              onToggleColumn={handleToggleColumn}
            />

            {selectedIds.length > 0 && (
              <button
                onClick={handlePreClose}
                className="flex bg-rose-600 hover:bg-rose-700 text-white rounded-lg items-center justify-center gap-1.5 transition shadow-sm px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold active:scale-95 whitespace-nowrap flex-shrink-0"
              >
                <span>Submit Pre-Closing ({selectedIds.length})</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-2 sm:px-0">
        <div className="text-sm text-gray-600">
          Showing {filteredOrders.length} of {orders.length} production orders
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          allHeaders={allHeaders}
          visibleColumns={visibleColumns}
          data={paginatedOrders}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1400px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredOrders.length}
          itemsPerPageOptions={[50, 100, 200, 500, 1000]}
        />
      </div>

    </div>
  );
}