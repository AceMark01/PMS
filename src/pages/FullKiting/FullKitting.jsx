import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Blocks, ClipboardList, History, Search, RotateCcw } from 'lucide-react';
import KittingPending from './KittingPending';
import KittingHistory from './KittingHistory';
import FullKittingForm from './FullKittingForm';
import SearchableDropdown from '../../components/SearchableDropdown';
import { SEEDED_ORDERS } from '../../utils/seeds';
import { TabSwitcher } from '../../components/StandardButtons';

export default function FullKitting() {
  const [activeTab, setActiveTab] = useState('pending');
  
  // Load and manage production orders
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('production_orders');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('production_orders', JSON.stringify(SEEDED_ORDERS));
    return SEEDED_ORDERS;
  });

  // Load and manage kitting history
  const [kittingHistory, setKittingHistory] = useState(() => {
    const saved = localStorage.getItem('kitting_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState('');
  const [godown, setGodown] = useState('');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  // Keep state updated in case localStorage updates from other pages
  useEffect(() => {
    const handleStorageChange = () => {
      const savedOrders = localStorage.getItem('production_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
      const savedHistory = localStorage.getItem('kitting_history');
      if (savedHistory) {
        setKittingHistory(JSON.parse(savedHistory));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter orders to only display those with 'CUSTOMIZE ORDER' which are not yet processed ('Kitted')
  const pendingOrders = useMemo(() => {
    return orders.filter(
      order => order.baseCat === 'CUSTOMIZE ORDER' && order.status !== 'Kitted'
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

  const handleSaveKittingRecord = (orderId, historyRecord) => {
    const orderIds = Array.isArray(orderId) ? orderId : [orderId];
    const idsSet = new Set(orderIds);

    // 1. Update order status to 'Kitted' in production_orders
    const updatedOrders = orders.map(o => {
      if (idsSet.has(o.id)) {
        return { ...o, status: 'Kitted' };
      }
      return o;
    });
    setOrders(updatedOrders);
    localStorage.setItem('production_orders', JSON.stringify(updatedOrders));

    // 2. Add costing card record to kitting history
    const updatedHistory = [...kittingHistory, historyRecord];
    setKittingHistory(updatedHistory);
    localStorage.setItem('kitting_history', JSON.stringify(updatedHistory));

    setIsFormOpen(false);
    toast.success('Costing card saved to kitting history!');
  };

  const handleDeleteHistory = (historyId) => {
    if (window.confirm('Are you sure you want to delete this costing record? This will revert the production order back to Pending.')) {
      const record = kittingHistory.find(h => h.id === historyId);
      let updatedOrders = [...orders];
      
      if (record) {
        const sNos = String(record.sNo).split(',').map(s => Number(s.trim())).filter(Boolean);
        const sNosSet = new Set(sNos);

        // Find orders matching by sNo in the list or productCode + timestamp
        updatedOrders = orders.map(o => {
          if (sNosSet.has(Number(o.sNo)) || (o.productCode === record.productCode && o.timestamp === record.timestamp)) {
            const { status, ...rest } = o; // strip status
            return rest;
          }
          return o;
        });
        setOrders(updatedOrders);
        localStorage.setItem('production_orders', JSON.stringify(updatedOrders));
      }

      const updatedHistory = kittingHistory.filter(h => h.id !== historyId);
      setKittingHistory(updatedHistory);
      localStorage.setItem('kitting_history', JSON.stringify(updatedHistory));
      toast.success('Record removed and order reverted to pending.');
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Kitting', count: pendingOrders.length, icon: ClipboardList },
    { id: 'history', label: 'Kitting History', count: kittingHistory.length, icon: History }
  ];

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
