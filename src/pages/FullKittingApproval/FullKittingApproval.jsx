import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, ClipboardCheck, History, Search, RotateCcw } from 'lucide-react';
import ApprovalPending from './ApprovalPending';
import ApprovalHistory from './ApprovalHistory';
import ApprovalForm from './ApprovalForm';
import { TabSwitcher } from '../../components/StandardButtons';

export default function FullKittingApproval() {
  const [activeTab, setActiveTab] = useState('pending');
  
  // Load and manage kitting history (which contains all pending/approved/rejected cards)
  const [kittingHistory, setKittingHistory] = useState(() => {
    const saved = localStorage.getItem('kitting_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Review States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Keep state updated in case localStorage updates from other pages
  useEffect(() => {
    const handleStorageChange = () => {
      const savedHistory = localStorage.getItem('kitting_history');
      if (savedHistory) {
        setKittingHistory(JSON.parse(savedHistory));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter: Pending Approvals (status is 'Pending' or not specified)
  const pendingApprovals = useMemo(() => {
    return kittingHistory.filter(
      h => !h.status || h.status === 'Pending'
    );
  }, [kittingHistory]);

  // Filter: Approval History (status is 'Approved' or 'Rejected')
  const approvedHistory = useMemo(() => {
    return kittingHistory.filter(
      h => h.status === 'Approved' || h.status === 'Rejected'
    );
  }, [kittingHistory]);

  // Filter pending approvals by search term
  const filteredPending = useMemo(() => {
    return pendingApprovals.filter(record => {
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
    }).reverse();
  }, [pendingApprovals, searchQuery]);

  // Filter history records by search term
  const filteredHistory = useMemo(() => {
    return approvedHistory.filter(record => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          record.productCode.toLowerCase().includes(q) ||
          record.productName.toLowerCase().includes(q) ||
          record.baseCat.toLowerCase().includes(q) ||
          record.rawNames.toLowerCase().includes(q) ||
          (record.jobCardNo && record.jobCardNo.toLowerCase().includes(q))
        );
      }
      return true;
    }).reverse();
  }, [approvedHistory, searchQuery]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    toast.success('Filters cleared');
  };

  const handleOpenApprovalForm = (recordId) => {
    const record = kittingHistory.find(h => h.id === recordId);
    if (record) {
      setSelectedRecord(record);
      setIsFormOpen(true);
    }
  };

  const handleApproveDecision = (recordId, status, remarks) => {
    // Update the record status inside kitting_history
    const updatedHistory = kittingHistory.map(h => {
      if (h.id === recordId) {
        return {
          ...h,
          status,
          jobCardNo: status === 'Approved' ? `JC-${h.sNo}` : '',
          remarks
        };
      }
      return h;
    });

    setKittingHistory(updatedHistory);
    localStorage.setItem('kitting_history', JSON.stringify(updatedHistory));
    setIsFormOpen(false);
    toast.success(`Costing record successfully ${status === 'Approved' ? 'approved' : 'rejected'}!`);
  };

  const handleDeleteHistory = (historyId) => {
    if (window.confirm('Are you sure you want to delete this approval history record? This will revert the production order back to Pending.')) {
      const record = kittingHistory.find(h => h.id === historyId);
      
      if (record) {
        // Load production orders to revert kitting status
        const savedOrders = localStorage.getItem('production_orders');
        if (savedOrders) {
          const orders = JSON.parse(savedOrders);
          const updatedOrders = orders.map(o => {
            if (Number(o.sNo) === Number(record.sNo) || (o.productCode === record.productCode && o.timestamp === record.timestamp)) {
              const { status, ...rest } = o; // strip 'Kitted' status
              return rest;
            }
            return o;
          });
          localStorage.setItem('production_orders', JSON.stringify(updatedOrders));
        }
      }

      const updatedHistory = kittingHistory.filter(h => h.id !== historyId);
      setKittingHistory(updatedHistory);
      localStorage.setItem('kitting_history', JSON.stringify(updatedHistory));
      toast.success('Approval record removed and order reverted to pending.');
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Approvals', count: pendingApprovals.length, icon: ClipboardCheck },
    { id: 'history', label: 'Approval History', count: approvedHistory.length, icon: History }
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
              placeholder={activeTab === 'pending' ? "Search pending approvals..." : "Search history..."}
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
          <ApprovalPending 
            data={filteredPending} 
            onOpenApprovalForm={handleOpenApprovalForm}
          />
        ) : (
          <ApprovalHistory 
            data={filteredHistory} 
            onDeleteHistory={handleDeleteHistory}
          />
        )}
      </div>

      {/* Shared Approval Modal Form */}
      <ApprovalForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onApprove={handleApproveDecision}
        record={selectedRecord}
      />
    </div>
  );
}
