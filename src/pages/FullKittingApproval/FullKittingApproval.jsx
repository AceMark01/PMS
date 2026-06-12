import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, ClipboardCheck, History, Search, RotateCcw } from 'lucide-react';
import ApprovalPending from './ApprovalPending';
import ApprovalHistory from './ApprovalHistory';
import ApprovalForm from './ApprovalForm';
import { TabSwitcher } from '../../components/StandardButtons';
import { productionAPI } from '../../services/api';

export default function FullKittingApproval() {
  const [activeTab, setActiveTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Review States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

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

      // Fetch history records from Kitting Approval History sheet
      const historyResult = await productionAPI.getKittingApprovalHistory();
      if (historyResult.success) {
        setHistoryRecords(historyResult.records);
      } else {
        toast.error(`Failed to load approval history: ${historyResult.error}`);
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

  // Filter: Pending Approvals (status is 'Pending')
  const pendingApprovals = useMemo(() => {
    return orders
      .filter(o => o.baseCat === 'CUSTOMIZE ORDER' && o.rawNames && (!o.checkJc || o.checkJc === 'Pending' || o.checkJc === ''))
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
        status: 'Pending',
        jobCardNo: '',
        remarks: ''
      }));
  }, [orders]);

  // Filter: Approval History (from Kitting Approval History sheet)
  const approvedHistory = useMemo(() => {
    return historyRecords;
  }, [historyRecords]);

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
    const record = pendingApprovals.find(h => h.id === recordId);
    if (record) {
      setSelectedRecord(record);
      setIsFormOpen(true);
    }
  };

  const handleApproveDecision = async (recordId, status, remarks) => {
    const record = pendingApprovals.find(h => h.id === recordId);
    if (!record) return;

    const sNos = String(record.sNo).split(',').map(s => Number(s.trim())).filter(Boolean);

    const loadToast = toast.loading(`${status === 'Approved' ? 'Approving' : 'Rejecting'} costing card on Google Sheets...`);
    try {
      const result = await productionAPI.approveKittingData(sNos, status, remarks);
      if (result.success) {
        toast.success(`Costing record successfully ${status === 'Approved' ? 'approved' : 'rejected'}!`, { id: loadToast });
        setIsFormOpen(false);
        await fetchOrders();
      } else {
        toast.error(`Failed to update approval status: ${result.error}`, { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit approval status.', { id: loadToast });
    }
  };

  const handleDeleteHistory = async (historyId) => {
    if (window.confirm('Are you sure you want to delete this approval history record? This will revert the production order back to Pending.')) {
      const record = approvedHistory.find(h => h.id === historyId);
      if (!record) return;

      const sNos = String(record.sNo).split(',').map(s => Number(s.trim())).filter(Boolean);

      const loadToast = toast.loading('Reverting costing card and approval record...');
      try {
        const result = await productionAPI.clearKittingData(sNos);
        if (result.success) {
          toast.success('Approval record removed and order reverted to pending successfully!', { id: loadToast });
          await fetchOrders();
        } else {
          toast.error(`Failed to revert record: ${result.error}`, { id: loadToast });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to revert approval record.', { id: loadToast });
      }
    }
  };

  const tabs = [
    { id: 'pending', label: 'Pending Approvals', count: pendingApprovals.length, icon: ClipboardCheck },
    { id: 'history', label: 'Approval History', count: approvedHistory.length, icon: History }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading kitting approvals...</p>
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
