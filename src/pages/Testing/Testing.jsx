import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, CheckCircle, History, Search, RotateCcw } from 'lucide-react';
import TestingPending from './TestingPending';
import TestingApproval from './TestingApproval';
import TestingForm from './TestingForm';
import { TabSwitcher } from '../../components/StandardButtons';

export default function Testing() {
  const [activeTab, setActiveTab] = useState('pending');

  // Load and manage actual production logs (read-only reference)
  const [actualProductionHistory, setActualProductionHistory] = useState(() => {
    const saved = localStorage.getItem('actual_production_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Load and manage testing approval history logs
  const [testingHistory, setTestingHistory] = useState(() => {
    const saved = localStorage.getItem('testing_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Sync state with storage updates
  useEffect(() => {
    const handleStorageChange = () => {
      const savedProd = localStorage.getItem('actual_production_history');
      if (savedProd) {
        setActualProductionHistory(JSON.parse(savedProd));
      }
      const savedTesting = localStorage.getItem('testing_history');
      if (savedTesting) {
        setTestingHistory(JSON.parse(savedTesting));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter actual production logs that are not yet tested
  const pendingTesting = useMemo(() => {
    const testedProdIds = new Set(testingHistory.map(t => t.productionRecordId));
    return actualProductionHistory.filter(ap => !testedProdIds.has(ap.id));
  }, [actualProductionHistory, testingHistory]);

  // Filter pending items by search query
  const filteredPending = useMemo(() => {
    return pendingTesting.filter(record => {
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
  }, [pendingTesting, searchQuery]);

  // Filter testing history logs by search query
  const filteredHistory = useMemo(() => {
    return testingHistory.filter(record => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          record.productCode.toLowerCase().includes(q) ||
          record.productName.toLowerCase().includes(q) ||
          (record.jobCardNo && record.jobCardNo.toLowerCase().includes(q)) ||
          String(record.sNo).includes(q) ||
          record.testingStatus.toLowerCase().includes(q)
        );
      }
      return true;
    }).reverse();
  }, [testingHistory, searchQuery]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    toast.success('Filters cleared');
  };

  const handleOpenTestingForm = (recordId) => {
    const record = pendingTesting.find(p => p.id === recordId);
    if (record) {
      setSelectedRecord(record);
      setIsFormOpen(true);
    }
  };

  const handleSubmitTesting = (productionRecordId, testingRecord) => {
    const updatedHistory = [...testingHistory, testingRecord];
    setTestingHistory(updatedHistory);
    localStorage.setItem('testing_history', JSON.stringify(updatedHistory));
    setIsFormOpen(false);
    toast.success(`Quality testing successfully submitted: ${testingRecord.testingStatus}!`);
  };

  const handleDeleteHistory = (historyId) => {
    if (window.confirm('Are you sure you want to delete this testing record? This will revert the record back to Pending Testing.')) {
      const updatedHistory = testingHistory.filter(h => h.id !== historyId);
      setTestingHistory(updatedHistory);
      localStorage.setItem('testing_history', JSON.stringify(updatedHistory));
      toast.success('Testing log deleted and job reverted back to pending testing.');
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Testing', count: pendingTesting.length, icon: ClipboardCheck },
    { id: 'history', label: 'Testing History', count: testingHistory.length, icon: History }
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
              placeholder={activeTab === 'pending' ? "Search pending testing..." : "Search testing history..."}
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
          <TestingPending 
            data={filteredPending} 
            onOpenTestingForm={handleOpenTestingForm}
          />
        ) : (
          <TestingApproval 
            data={filteredHistory} 
            onDeleteHistory={handleDeleteHistory}
          />
        )}
      </div>

      {/* Quality review form modal */}
      <TestingForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitTesting={handleSubmitTesting}
        record={selectedRecord}
      />
    </div>
  );
}
