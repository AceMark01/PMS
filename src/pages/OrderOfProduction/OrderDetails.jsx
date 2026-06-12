import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, Plus, RotateCcw, Filter, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';
import AddOrder from './AddOrder';
import { productionAPI } from '../../services/api';

export default function OrderDetails() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterItems, setMasterItems] = useState([]);
  const [loadingMasterItems, setLoadingMasterItems] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: '',
    baseCat: '',
    godown: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Fetch orders from Google Sheet API on component mount
  useEffect(() => {
    fetchOrders();
    fetchMasterItems();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await productionAPI.getProductionOrders();

      if (result.success) {
        // Transform the data to match your frontend structure
        const transformedOrders = result.orders.map(order => ({
          id: order.sNo?.toString() || `po-${order.sNo}`,
          sNo: order.sNo,
          timestamp: order.timestamp,
          productCode: order.productCode || '',
          productName: order.productName || '',
          baseCat: order.baseCat || '',
          qty: order.qty || '',
          godown: order.godown || ''
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

  const fetchMasterItems = async () => {
    setLoadingMasterItems(true);

    try {
      // If you have a dedicated endpoint for master items, use it
      // Otherwise, extract unique items from orders or keep using seeds
      // For now, we'll fetch master items from the API if available
      // You can add a getMasterItems function to your productionAPI

      // Fallback: Extract unique product info from orders once loaded
      // But since orders load async, we'll initially use empty array
      // and update when orders are loaded
      setMasterItems([]);

      // If you have a separate API endpoint for master items:
      // const result = await productionAPI.getMasterItems();
      // if (result.success) {
      //   setMasterItems(result.items);
      // }
    } catch (error) {
      console.error('Error fetching master items:', error);
    } finally {
      setLoadingMasterItems(false);
    }
  };

  // Update master items when orders are loaded (extract unique product info)
  useEffect(() => {
    if (orders.length > 0) {
      // Extract unique product combinations from orders
      const uniqueProducts = new Map();

      orders.forEach(order => {
        const key = `${order.productCode}|${order.productName}`;
        if (!uniqueProducts.has(key) && order.productCode && order.productName) {
          uniqueProducts.set(key, {
            code: order.productCode,
            name: order.productName,
            baseCat: order.baseCat
          });
        }
      });

      const items = Array.from(uniqueProducts.values()).map(item => ({
        id: item.code,
        code: item.code,
        name: item.name,
        category: item.baseCat
      }));

      setMasterItems(items);
    }
  }, [orders]);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      baseCat: '',
      godown: ''
    });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleCreateOrder = async (newOrder) => {
    setIsSubmitting(true);

    try {
      const formatTimestamp = () => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      };

      const orderData = {
        timestamp: formatTimestamp(),
        sNo: null, // Let backend auto-generate
        productCode: newOrder.productCode,
        productName: newOrder.productName,
        baseCat: newOrder.baseCat,
        qty: parseFloat(newOrder.qty),
        godown: newOrder.godown
      };

      const result = await productionAPI.addProductionOrder(orderData);

      if (result.success) {
        toast.success('Production Order created successfully!');
        setShowAddModal(false);

        // Refresh orders list from API
        await fetchOrders();
      } else {
        toast.error(`Failed to create order: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create production order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('Are you sure you want to cancel/delete this production order?')) {
      return;
    }

    try {
      // Find the order to get its S NO
      const orderToDelete = orders.find(o => o.id === id);
      if (!orderToDelete) {
        toast.error('Order not found');
        return;
      }

      const result = await productionAPI.deleteProductionOrder(orderToDelete.sNo);

      if (result.success) {
        toast.success('Production Order cancelled/deleted.');
        // Refresh orders list from API
        await fetchOrders();
      } else {
        toast.error(`Failed to delete order: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete production order');
    }
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
    }).reverse(); // Show latest orders first
  }, [orders, filters]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "Action", "S NO", "Timestamp", "Product Code", "Product Name", "Base Cat", "Order Quantity", "Godown"
  ];

  const renderRow = (item, idx) => {
    return (
      <tr key={item.id || idx} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <button
            onClick={() => handleDeleteOrder(item.id)}
            className="p-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition-all active:scale-95 inline-flex items-center justify-center"
            title="Cancel/Delete Order"
          >
            <Trash2 size={15} />
          </button>
        </td>
        <td className="px-4 py-3 text-center text-xs text-gray-600 whitespace-nowrap">{item.sNo}</td>
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{item.timestamp}</td>
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold whitespace-nowrap">{item.productCode}</td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 whitespace-nowrap uppercase">{item.productName}</td>
        <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.baseCat}</td>
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold whitespace-nowrap">{item.qty}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-medium whitespace-nowrap">{item.godown}</td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    return (
      <div key={item.id || idx} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
              #{item.sNo}
            </span>
            <span className="text-xs font-bold text-gray-900 uppercase">{item.productName}</span>
          </div>
          <button
            onClick={() => handleDeleteOrder(item.id)}
            className="p-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition"
            title="Cancel/Delete Order"
          >
            <Trash2 size={14} />
          </button>
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
          <div className="col-span-2">
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Godown</span>
            <span className="text-gray-700 font-medium">{item.godown}</span>
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

      {/* Header Filters & Add Button */}
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
            {!showMobileFilters && (
              <button
                onClick={() => setShowAddModal(true)}
                className="lg:hidden flex items-center justify-center bg-indigo-600 text-white rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
                title="Add Order"
              >
                <Plus size={16} />
              </button>
            )}
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

          </div>
        </div>

        {/* Desktop Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          disabled={isSubmitting}
          className="hidden lg:flex bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg items-center justify-center transition shadow-sm w-[38px] h-[38px] flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Create Production Order"
        >
          <Plus size={18} />
        </button>
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
          data={paginatedOrders}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1100px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredOrders.length}
          itemsPerPageOptions={[50, 100, 200, 500, 1000]}
        />
      </div>

      {/* Add Order Popup Modal Component */}
      <AddOrder
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateOrder}
        masterItems={masterItems}
        isSubmitting={isSubmitting}
      />

    </div>
  );
}