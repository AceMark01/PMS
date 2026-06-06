import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, CheckCircle, History, Search, RotateCcw } from 'lucide-react';
import ActualProductionPending from './ActualProductionPending';
import ActualProductionHistory from './ActualProductionHistory';
import ActualProductionForm from './ActualProductionForm';
import { TabSwitcher } from '../../components/StandardButtons';

export default function ActualProduction() {
  const [activeTab, setActiveTab] = useState('pending');

  // Load and manage kitting history (used to find Approved records)
  const [kittingHistory, setKittingHistory] = useState(() => {
    const saved = localStorage.getItem('kitting_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Load and manage actual production history logs
  const [productionHistory, setProductionHistory] = useState(() => {
    const saved = localStorage.getItem('actual_production_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Sync state with storage updates
  useEffect(() => {
    const handleStorageChange = () => {
      const savedKitting = localStorage.getItem('kitting_history');
      if (savedKitting) {
        setKittingHistory(JSON.parse(savedKitting));
      }
      const savedProd = localStorage.getItem('actual_production_history');
      if (savedProd) {
        setProductionHistory(JSON.parse(savedProd));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter approved costing cards that are not yet in production history
  const pendingProduction = useMemo(() => {
    const approvedKittings = kittingHistory.filter(h => h.status === 'Approved');
    const producedIds = new Set(productionHistory.map(p => p.kittingRecordId));
    return approvedKittings.filter(k => !producedIds.has(k.id));
  }, [kittingHistory, productionHistory]);

  // Filter pending items by search query
  const filteredPending = useMemo(() => {
    return pendingProduction.filter(record => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          record.productCode.toLowerCase().includes(q) ||
          record.productName.toLowerCase().includes(q) ||
          (record.jobCardNo && record.jobCardNo.toLowerCase().includes(q)) ||
          String(record.sNo).includes(q)
        );
      }
      return true;
    }).reverse();
  }, [pendingProduction, searchQuery]);

  // Filter production logs by search query
  const filteredHistory = useMemo(() => {
    return productionHistory.filter(record => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          record.productCode.toLowerCase().includes(q) ||
          record.productName.toLowerCase().includes(q) ||
          (record.jobCardNo && record.jobCardNo.toLowerCase().includes(q)) ||
          String(record.sNo).includes(q)
        );
      }
      return true;
    }).reverse();
  }, [productionHistory, searchQuery]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    toast.success('Filters cleared');
  };

  const handleOpenProductionForm = (recordId) => {
    const record = pendingProduction.find(p => p.id === recordId);
    if (record) {
      setSelectedRecord(record);
      setIsFormOpen(true);
    }
  };

  const handleSubmitProduction = (kittingRecordId, productionRecord) => {
    // Inject the kittingRecordId for cross-referencing
    const recordWithRef = {
      ...productionRecord,
      kittingRecordId
    };

    const updatedHistory = [...productionHistory, recordWithRef];
    setProductionHistory(updatedHistory);
    localStorage.setItem('actual_production_history', JSON.stringify(updatedHistory));
    setIsFormOpen(false);
    toast.success('Actual production log successfully submitted!');
  };

  const handleDeleteHistory = (historyId) => {
    if (window.confirm('Are you sure you want to delete this production log? This will revert the record back to Pending Production.')) {
      const updatedHistory = productionHistory.filter(h => h.id !== historyId);
      setProductionHistory(updatedHistory);
      localStorage.setItem('actual_production_history', JSON.stringify(updatedHistory));
      toast.success('Production record removed and order reverted to pending production.');
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Production', count: pendingProduction.length, icon: ClipboardCheck },
    { id: 'history', label: 'Production History', count: productionHistory.length, icon: History }
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 flex flex-col h-full min-h-0 bg-slate-50/30">
      {/* Tab switcher & Search bar row */}
      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 border-b border-indigo-100 pb-3">
        {/* Left Side: Tabs */}
        <TabSwitcher activeTab={activeTab} onTabChange={handleTabChange} tabs={tabs} />

        {/* Right Side: Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 xl:justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
            <input
              type="text"
              placeholder={activeTab === 'pending' ? "Search pending production..." : "Search history..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-indigo-500 text-xs md:text-sm h-[32px] md:h-[38px]"
            />
          </div>

          <button
            onClick={handleClearFilters}
            className="flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[32px] h-[32px] md:w-[38px] md:h-[38px] hover:bg-gray-100 transition-colors shadow-sm flex-shrink-0"
            title="Clear Filters"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 min-h-0">
        {activeTab === 'pending' ? (
          <ActualProductionPending 
            data={filteredPending} 
            onOpenProductionForm={handleOpenProductionForm}
          />
        ) : (
          <ActualProductionHistory 
            data={filteredHistory} 
            onDeleteHistory={handleDeleteHistory}
          />
        )}
      </div>

      {/* Actual Production Log form modal */}
      <ActualProductionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitProduction={handleSubmitProduction}
        record={selectedRecord}
      />
    </div>
  );
}
