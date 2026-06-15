import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, ClipboardCheck, History, Search, RotateCcw } from 'lucide-react';
import ApprovalPending from './ApprovalPending';
import ApprovalHistory from './ApprovalHistory';
import ApprovalForm from './ApprovalForm';
import ColumnToggle from '../../components/ColumnToggle';
import { TabSwitcher } from '../../components/StandardButtons';
import { productionAPI } from '../../services/api';

const parseStringToNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const clean = val.toString().replace(/[^\d.-]/g, '');
  const num = Number(clean);
  return isNaN(num) ? 0 : num;
};

export default function FullKittingApproval() {
  const [activeTab, setActiveTab] = useState('pending');

  const pendingToggleableHeaders = useMemo(() => [
    "S NO", "Timestamp", "Product code", "Product Name", "BAse Cat", "Order Quantity", "Raw Names", "Raw Quantities", "FG Available Qty", "Total Raw Required Qty", "Total Raw Cost", "Extra Amount", "Total Production Cost", "Selling Price", "Profit / Loss Amount", "Profit / Loss %", "Costing Image"
  ], []);

  const historyToggleableHeaders = useMemo(() => [
    "JOB Card No.", "S NO", "Timestamp", "Product code", "Product Name", "BAse Cat", "Order Quantity", "Raw Names", "Raw Quantities", "FG Available Qty", "Total Raw Required Qty", "Total Raw Cost", "Extra Amount", "Total Production Cost", "Selling Price", "Profit / Loss Amount", "Profit / Loss %", "Status", "Costing Image"
  ], []);

  const [visibleColumns, setVisibleColumns] = useState([
    "JOB Card No.", "S NO", "Timestamp", "Product code", "Product Name", "BAse Cat", "Order Quantity", "Raw Names", "Raw Quantities", "FG Available Qty", "Total Raw Required Qty", "Total Raw Cost", "Extra Amount", "Total Production Cost", "Selling Price", "Profit / Loss Amount", "Profit / Loss %", "Status", "Costing Image"
  ]);

  const handleToggleColumn = (columnName) => {
    setVisibleColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  const [orders, setOrders] = useState([]);
  const [kittingHistory, setKittingHistory] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter Toolbar States
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Review States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const generateJobCardNo = async () => {
    const result = await productionAPI.getSheetData('JOB CARD', { headerRow: 6 });
    let nextNum = 1;
    if (result.success && result.records && result.records.length > 0) {
      const nums = result.records
        .map(r => {
          const jc = r.jCJobCard || r['jC-JobCard'] || r.jcJobCard || r.jobCardNo || '';
          const match = jc.match(/JC-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);

      if (nums.length > 0) {
        nextNum = Math.max(...nums) + 1;
      }
    }
    return `JC-${String(nextNum).padStart(3, '0')}`;
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [result, historyResult, kittingResult] = await Promise.all([
        productionAPI.getSheetData('PRODUCTION_ORDERS', { headerRow: 6 }),
        productionAPI.getSheetData('JOB CARD', { headerRow: 6 }),
        productionAPI.getSheetData('Costing-History')
      ]);
      let transformedOrders = [];
      if (result.success) {
        transformedOrders = result.records.map(order => ({
          id: order.sNo?.toString() || `po-${order.sNo}`,
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
      } else {
        toast.error(`Failed to load orders: ${result.error}`);
      }

      // Fetch history records from JOB CARD sheet
      if (historyResult.success) {
        setHistoryRecords(historyResult.records);
      } else {
        toast.error(`Failed to load approval history: ${historyResult.error}`);
      }

      if (kittingResult.success) {
        const transformedKitting = (kittingResult.records || []).map(record => {
          const firstSNo = String(record.sNo).split(',')[0]?.trim();
          const matchedOrder = transformedOrders.find(o => String(o.sNo).trim() === firstSNo);

          return {
            id: record.rowIndex?.toString() || `hist-${record.sNo}`,
            rowIndex: record.rowIndex,
            kittingTicket: record.kittingTicket || '',
            sNo: record.sNo,
            timestamp: record.timestamp,
            productCode: matchedOrder ? matchedOrder.productCode : '',
            productName: matchedOrder ? matchedOrder.productName : (record.fGName || record.fgName || ''),
            baseCat: matchedOrder ? matchedOrder.baseCat : '',
            qty: parseStringToNumber(record.planQty || record.qty || (matchedOrder ? matchedOrder.qty : 0)),
            rawNames: record.requiredRawMaterialName || record.rawNames || '',
            rawQuantities: record.rawQty || record.rawQuantities || '',
            fgAvailableQty: parseStringToNumber(record.fGAvailableQty || record.fgAvailableQty || 0),
            totalRawRequiredQty: parseStringToNumber(record.totalRawRequiredQty || 0),
            totalRawCost: parseStringToNumber(record.totalRawCost || 0),
            extraAmount: parseStringToNumber(record.extraAmount || 0),
            totalProductionCost: parseStringToNumber(record.totalProductionCost || 0),
            sellingPrice: parseStringToNumber(record.sellingPrice || 0),
            profitLoss: parseStringToNumber(record.profitLoss !== undefined ? record.profitLoss : (record['profit/LossAmount'] || 0)),
            profitLossPercent: parseStringToNumber(record.profitLossPercent !== undefined ? record.profitLossPercent : (record['profit/Loss%'] || 0)),
            costingImage: record.pDFLink || record.pdfLink || record.costingImage || '',
            status: matchedOrder
              ? (matchedOrder.checkJc
                ? (matchedOrder.checkJc.toLowerCase() === 'rejected' ? 'Rejected' : 'Approved')
                : (matchedOrder.actual1 ? 'Pending' : 'Draft'))
              : 'Pending'
          };
        });
        setKittingHistory(transformedKitting);
      } else {
        toast.error(`Failed to load costing history: ${kittingResult.error}`);
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

  // Filter: Pending Approvals (status is 'Pending' in Costing-History)
  const pendingApprovals = useMemo(() => {
    return kittingHistory.filter(kh => kh.status && kh.status.trim().toLowerCase() === 'pending');
  }, [kittingHistory]);

  // Filter: Approval History (from JOB CARD sheet)
  const approvedHistory = useMemo(() => {
    return historyRecords
      .filter(record => record && record.sNo && record.sNo.toString().trim() !== '')
      .map(record => {
        const firstSNo = String(record.sNo).split(',')[0]?.trim();
        const matchedOrder = orders.find(o => String(o.sNo).trim() === firstSNo);
        const matchedCosting = kittingHistory.find(kh => String(kh.sNo).trim() === firstSNo);

        return {
          id: record.rowIndex?.toString() || `hist-${record.sNo}`,
          rowIndex: record.rowIndex,
          jobCardNo: record.jCJobCard || record['jC-JobCard'] || record.jcJobCard || record.jobCardNo || '',
          sNo: record.sNo,
          timestamp: record.timestamp,
          productCode: record.productCode || (matchedOrder ? matchedOrder.productCode : ''),
          productName: record.productName || (matchedOrder ? matchedOrder.productName : ''),
          baseCat: matchedOrder ? matchedOrder.baseCat : '',
          qty: parseStringToNumber(record.qty || (matchedOrder ? matchedOrder.qty : 0)),
          rawNames: matchedCosting ? matchedCosting.rawNames : '',
          rawQuantities: matchedCosting ? matchedCosting.rawQuantities : '',
          fgAvailableQty: matchedCosting ? matchedCosting.fgAvailableQty : 0,
          totalRawRequiredQty: matchedCosting ? matchedCosting.totalRawRequiredQty : 0,
          totalRawCost: matchedCosting ? matchedCosting.totalRawCost : 0,
          extraAmount: matchedCosting ? matchedCosting.extraAmount : 0,
          totalProductionCost: matchedCosting ? matchedCosting.totalProductionCost : 0,
          sellingPrice: matchedCosting ? matchedCosting.sellingPrice : 0,
          profitLoss: matchedCosting ? matchedCosting.profitLoss : 0,
          profitLossPercent: matchedCosting ? matchedCosting.profitLossPercent : 0,
          status: record.approvalStatus || 'Approved',
          costingImage: matchedCosting ? matchedCosting.costingImage : '',
          remarks: record.approvalRemarks || ''
        };
      });
  }, [historyRecords, orders, kittingHistory]);

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

    const loadToast = toast.loading(`${status === 'Approved' ? 'Approving' : 'Rejecting'} costing card on Google Sheets...`);
    try {
      // 1. Generate Job Card No if Approved
      let jobCardNo = '';
      if (status === 'Approved') {
        jobCardNo = await generateJobCardNo();
      }

      // 2. Insert into JOB CARD sheet
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timestamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      const rowData = [
        timestamp,                  // Col A: Timestamp
        '',                         // Col B: JC-Job Card (Formula generated in sheet, do not submit)
        record.sNo,                 // Col C: S NO
        record.productCode || '',   // Col D: ProductCode
        record.productName || '',   // Col E: ProductName
        record.qty || '0',          // Col F: Order Quantity
        '',                         // Col G: Date Of Production
        status,                     // Col H: Approval Status
        remarks || ''               // Col I: Approval Remarks
      ];

      await productionAPI.insertRow('JOB CARD', rowData);

      toast.success(`Costing record successfully ${status === 'Approved' ? 'approved' : 'rejected'}!`, { id: loadToast });
      setIsFormOpen(false);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit approval status.', { id: loadToast });
    }
  };

  const handleDeleteHistory = async (historyId) => {
    if (window.confirm('Are you sure you want to delete this approval history record? This will revert the production order back to Pending.')) {
      const record = approvedHistory.find(h => h.id === historyId);
      if (!record) return;

      const loadToast = toast.loading('Reverting costing card and approval record...');
      try {
        // 1. Delete the row from JOB CARD sheet
        await productionAPI.deleteRow('JOB CARD', record.rowIndex);

        toast.success('Approval record removed and order reverted to pending successfully!', { id: loadToast });
        await fetchOrders();
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

          <ColumnToggle
            headers={activeTab === 'pending' ? pendingToggleableHeaders : historyToggleableHeaders}
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
          />
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 min-h-0">
        {activeTab === 'pending' ? (
          <ApprovalPending
            data={filteredPending}
            onOpenApprovalForm={handleOpenApprovalForm}
            visibleColumns={visibleColumns}
          />
        ) : (
          <ApprovalHistory
            data={filteredHistory}
            onDeleteHistory={handleDeleteHistory}
            visibleColumns={visibleColumns}
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
