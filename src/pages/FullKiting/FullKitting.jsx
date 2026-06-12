import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Blocks, ClipboardList, History, Search, RotateCcw } from 'lucide-react';
import KittingPending from './KittingPending';
import KittingHistory from './KittingHistory';
import FullKittingForm from './FullKittingForm';
import SearchableDropdown from '../../components/SearchableDropdown';
import { TabSwitcher } from '../../components/StandardButtons';
import { productionAPI } from '../../services/api';

export default function FullKitting() {
  const [activeTab, setActiveTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState('');
  const [godown, setGodown] = useState('');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await productionAPI.getProductionOrders();
      if (result.success) {
        const transformedOrders = result.orders.map(order => ({
          id: order.sNo?.toString() || `po-${order.sNo}`,
          sNo: order.sNo,
          timestamp: order.timestamp,
          productCode: order.productCode || '',
          productName: order.productName || '',
          baseCat: order.baseCat || '',
          qty: Number(order.qty) || 0,
          godown: order.godown || '',
          rawNames: order.rawNames || '',
          rawQuantities: order.rawQuantities || '',
          fgAvailableQty: Number(order.fgAvailableQty) || 0,
          totalRawRequiredQty: Number(order.totalRawRequiredQty) || 0,
          totalRawCost: Number(order.totalRawCost) || 0,
          extraAmount: Number(order.extraAmount) || 0,
          totalProductionCost: Number(order.totalProductionCost) || 0,
          sellingPrice: Number(order.sellingPrice) || 0,
          profitLoss: Number(order.profitLoss) || 0,
          profitLossPercent: Number(order.profitLossPercent) || 0,
          costingImage: order.costingImage || '',
          checkJc: order.checkJc || ''
        }));
        setOrders(transformedOrders);
      } else {
        toast.error(`Failed to load orders: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to connect to spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders to only display those with 'CUSTOMIZE ORDER' which are not yet processed
  const pendingOrders = useMemo(() => {
    return orders.filter(
      order => order.baseCat === 'CUSTOMIZE ORDER' && !order.rawNames
    );
  }, [orders]);

  // Compile active godowns for the filter dropdown based on all pending custom orders
  const godownsList = useMemo(() => {
    return Array.from(new Set(pendingOrders.map(o => o.godown))).filter(Boolean).sort();
  }, [pendingOrders]);

  // Apply search/filtering for pending orders
  const filteredPendingOrders = useMemo(() => {
    return pendingOrders.filter(order => {
      if (godown && order.godown !== godown) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          order.productCode.toLowerCase().includes(q) ||
          order.productName.toLowerCase().includes(q) ||
          order.baseCat.toLowerCase().includes(q) ||
          order.godown.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [pendingOrders, godown, searchQuery]);

  // Compile kitting history records from sheet orders that have costing card details
  const kittingHistory = useMemo(() => {
    return orders
      .filter(o => o.baseCat === 'CUSTOMIZE ORDER' && o.rawNames)
      .map(o => ({
        id: `kh-${o.sNo}`,
        sNo: o.sNo,
        timestamp: o.timestamp,
        productCode: o.productCode,
        productName: o.productName,
        baseCat: o.baseCat,
        qty: o.qty,
        rawNames: o.rawNames,
        rawQuantities: o.rawQuantities,
        fgAvailableQty: o.fgAvailableQty,
        totalRawRequiredQty: o.totalRawRequiredQty,
        totalRawCost: o.totalRawCost,
        extraAmount: o.extraAmount,
        totalProductionCost: o.totalProductionCost,
        sellingPrice: o.sellingPrice,
        profitLoss: o.profitLoss,
        profitLossPercent: o.profitLossPercent,
        costingImage: o.costingImage,
        status: o.checkJc || 'Pending',
        jobCardNo: o.checkJc?.startsWith('JC-') ? o.checkJc : ''
      }));
  }, [orders]);

  // Apply search/filtering for history records
  const filteredHistory = useMemo(() => {
    return kittingHistory.filter(record => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          record.productCode.toLowerCase().includes(q) ||
          record.productName.toLowerCase().includes(q) ||
          record.baseCat.toLowerCase().includes(q) ||
          record.rawNames.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [kittingHistory, searchQuery]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setGodown('');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setGodown('');
    toast.success('Filters cleared');
  };

  const handleOpenKittingForm = (orderId = '') => {
    setSelectedOrderId(orderId);
    setIsFormOpen(true);
  };

  const handleSaveKittingRecord = async (orderId, historyRecord) => {
    const sNos = Array.isArray(orderId) ? orderId : [orderId];

    const loadToast = toast.loading('Saving costing check to Google Sheets...');
    try {
      const result = await productionAPI.updateKittingData(sNos, {
        rawNames: historyRecord.rawNames,
        rawQuantities: historyRecord.rawQuantities,
        fgAvailableQty: historyRecord.fgAvailableQty,
        totalRawRequiredQty: historyRecord.totalRawRequiredQty,
        totalRawCost: historyRecord.totalRawCost,
        extraAmount: historyRecord.extraAmount,
        totalProductionCost: historyRecord.totalProductionCost,
        sellingPrice: historyRecord.sellingPrice,
        profitLoss: historyRecord.profitLoss,
        profitLossPercent: historyRecord.profitLossPercent,
        costingImage: historyRecord.costingImage
      });

      if (result.success) {
        toast.success('Costing card saved successfully!', { id: loadToast });
        setIsFormOpen(false);
        await fetchOrders();
      } else {
        toast.error(`Failed to save costing card: ${result.error}`, { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save costing card to sheet.', { id: loadToast });
    }
  };

  const handleDeleteHistory = async (historyId) => {
    if (window.confirm('Are you sure you want to delete this costing record? This will revert the production order back to Pending.')) {
      const record = kittingHistory.find(h => h.id === historyId);
      if (!record) return;

      const sNos = String(record.sNo).split(',').map(s => Number(s.trim())).filter(Boolean);

      const loadToast = toast.loading('Reverting costing card from Google Sheets...');
      try {
        const result = await productionAPI.clearKittingData(sNos);
        if (result.success) {
          toast.success('Record reverted to pending successfully!', { id: loadToast });
          await fetchOrders();
        } else {
          toast.error(`Failed to revert record: ${result.error}`, { id: loadToast });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to revert costing card.', { id: loadToast });
      }
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Kitting', count: pendingOrders.length, icon: ClipboardList },
    { id: 'history', label: 'Kitting History', count: kittingHistory.length, icon: History }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading kitting orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 flex flex-col h-full min-h-0 bg-slate-50/30">
      {/* Unified Tabs & Filter Toolbar Row */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 border-b border-indigo-100 pb-3">
        {/* Left Side: Tabs */}
        <TabSwitcher activeTab={activeTab} onTabChange={handleTabChange} tabs={tabs} />

        {/* Right Side: Shared Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 xl:justify-end">
          {/* Search bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'pending' ? "Search pending orders..." : "Search history..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-indigo-500 text-xs md:text-sm h-[32px] md:h-[38px]"
            />
          </div>

          {/* Godown Dropdown (Only for pending list) */}
          {activeTab === 'pending' && (
            <div className="w-full sm:w-[150px]">
              <SearchableDropdown
                options={godownsList.map(g => ({ value: g, label: g }))}
                value={godown}
                onChange={setGodown}
                placeholder="All Godowns"
                className="h-[32px] md:h-[38px] w-full"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>
          )}

          <button
            onClick={handleClearFilters}
            className="flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[32px] h-[32px] md:w-[38px] md:h-[38px] hover:bg-gray-100 transition-colors shadow-sm flex-shrink-0"
            title="Clear Filters"
          >
            <RotateCcw size={15} />
          </button>

          {/* Full Kitting Button */}
          <button
            onClick={() => handleOpenKittingForm('')}
            className="flex bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg items-center justify-center gap-1.5 transition shadow-sm px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold active:scale-95 whitespace-nowrap flex-shrink-0"
            title="Open Full Kitting Form"
          >
            <Blocks size={16} />
            <span>Full Kitting</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 min-h-0">
        {activeTab === 'pending' ? (
          <KittingPending 
            data={filteredPendingOrders} 
          />
        ) : (
          <KittingHistory 
            data={filteredHistory} 
            onDeleteHistory={handleDeleteHistory}
          />
        )}
      </div>

      {/* Shared Costing Form Modal */}
      <FullKittingForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveKittingRecord}
        pendingOrders={pendingOrders}
        initialOrderId={selectedOrderId}
      />
    </div>
  );
}
