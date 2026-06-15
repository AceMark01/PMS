import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Blocks, ClipboardList, History, Search, RotateCcw } from 'lucide-react';
import KittingPending from './KittingPending';
import KittingHistory from './KittingHistory';
import FullKittingForm from './FullKittingForm';
import ColumnToggle from '../../components/ColumnToggle';
import SearchableDropdown from '../../components/SearchableDropdown';
import { TabSwitcher } from '../../components/StandardButtons';
import { productionAPI } from '../../services/api';

const parseStringToNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const clean = val.toString().replace(/[^\d.-]/g, '');
  const num = Number(clean);
  return isNaN(num) ? 0 : num;
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function FullKitting() {
  const [activeTab, setActiveTab] = useState('pending');

  const pendingToggleableHeaders = useMemo(() => [
    "S NO", "Timestamp", "Product code", "Product Name", "BAse Cat", "Order Quantity", "GoDown"
  ], []);

  const historyToggleableHeaders = useMemo(() => [
    "Ticket ID", "S NO", "Timestamp", "Product code", "Product Name", "BAse Cat", "Order Quantity",
    "Raw Names", "Raw Quantities", "FG Available Qty", "Total Raw Required Qty", "Total Raw Cost", "Extra Amount", "Total Production Cost", "Selling Price", "Profit / Loss Amount", "Profit / Loss %", "Costing Image"
  ], []);

  const [visibleColumns, setVisibleColumns] = useState([
    "S NO", "Timestamp", "Product code", "Product Name", "BAse Cat", "Order Quantity", "GoDown",
    "Ticket ID", "Raw Names", "Raw Quantities", "FG Available Qty", "Total Raw Required Qty", "Total Raw Cost", "Extra Amount", "Total Production Cost", "Selling Price", "Profit / Loss Amount", "Profit / Loss %", "Costing Image"
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
      const [result, historyResult] = await Promise.all([
        productionAPI.getSheetData('PRODUCTION_ORDERS', { headerRow: 6 }),
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
          planned1: order.planned1 || '',
          actual1: order.actual1 || ''
        }));
        setOrders(transformedOrders);
      } else {
        toast.error(`Failed to load orders: ${result.error}`);
      }

      if (historyResult.success) {
        const transformedHistory = (historyResult.records || []).map(record => {
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
              ? (matchedOrder.checkJc ? (matchedOrder.checkJc.toLowerCase() === 'rejected' ? 'Rejected' : 'Approved') : 'Pending')
              : 'Pending'
          };
        });
        setKittingHistory(transformedHistory);
      } else {
        toast.error(`Failed to load kitting history: ${historyResult.error}`);
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

  // Filter orders to only display those where Planned 1 (col-O) is not null, and Actual 1 is null
  const pendingOrders = useMemo(() => {
    return orders.filter(order => {
      const hasPlanned1 = order.planned1 !== undefined && order.planned1 !== null && order.planned1.toString().trim() !== '';
      const hasActual1 = order.actual1 !== undefined && order.actual1 !== null && order.actual1.toString().trim() !== '';
      return hasPlanned1 && !hasActual1;
    });
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

  const handleSaveKittingRecord = async (records) => {
    const loadToast = toast.loading('Saving costing check to Google Sheets...');
    try {
      const historyResult = await productionAPI.getSheetData('Costing-History');
      const historyRecords = historyResult.success ? historyResult.records : [];

      const timestamp = formatDate(new Date());

      const sNosToDelete = records.map(r => r.sNo?.toString().trim()).filter(Boolean);

      // 1. Delete existing rows for these S Nos to avoid duplicates and ensure clean replacement
      if (historyRecords.length > 0 && sNosToDelete.length > 0) {
        const matches = historyRecords
          .filter(r => sNosToDelete.includes(r.sNo?.toString().trim()))
          .map(r => r.rowIndex);

        matches.sort((a, b) => b - a);
        for (const rowIndex of matches) {
          await productionAPI.deleteRow('Costing-History', rowIndex);
        }
      }

      // 2. Prepare the expanded rows for batch insert
      const rowsToInsert = [];
      for (const record of records) {
        const sNo = record.sNo?.toString().trim();

        const rawNames = record.costingData.requiredRawMaterialName ? record.costingData.requiredRawMaterialName.split(',').map(s => s.trim()) : [];
        const rawQties = record.costingData.rawQty ? record.costingData.rawQty.split(',').map(s => s.trim()) : [];
        const rawCosts = record.costingData.rawCost ? record.costingData.rawCost.split(',').map(s => s.trim()) : [];
        const availableRawQties = record.costingData.availableRawQty ? record.costingData.availableRawQty.split(',').map(s => s.trim()) : [];
        const indentQties = record.costingData.indentQty ? record.costingData.indentQty.split(',').map(s => s.trim()) : [];

        const numMaterials = Math.max(1, rawNames.length);

        for (let i = 0; i < numMaterials; i++) {
          const rowData = [
            timestamp,
            record.costingData.kittingTicket || '',
            sNo,
            record.costingData.fgName || '',
            record.costingData.planQty || '0',
            rawNames[i] || '',
            rawQties[i] || '0',
            rawCosts[i] || '0',
            availableRawQties[i] || '0',
            indentQties[i] || '0',
            record.costingData.fgAvailableQty || '0',
            record.costingData.totalRawRequiredQty || '0',
            record.costingData.totalRawCost || '0',
            record.costingData.extraAmount || '0',
            record.costingData.totalProductionCost || '0',
            record.costingData.sellingPrice || '0',
            record.costingData.profitLoss || '0',
            record.costingData.profitLossPercent || '0',
            record.costingData.pdfLink || ''
          ];
          rowsToInsert.push(rowData);
        }
      }

      // 3. Batch insert all the newly expanded rows
      if (rowsToInsert.length > 0) {
        const result = await productionAPI.batchInsertRows('Costing-History', rowsToInsert);
        if (!result.success) {
          throw new Error(result.error || 'Failed to insert costing rows');
        }
      }

      toast.success('Costing card saved successfully!', { id: loadToast });
      setIsFormOpen(false);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to save costing card: ${err.message}`, { id: loadToast });
    }
  };

  const handleDeleteHistory = async (historyId) => {
    if (window.confirm('Are you sure you want to delete this costing record? This will revert the production order back to Pending.')) {
      const record = kittingHistory.find(h => h.id === historyId);
      if (!record) return;

      const sNos = String(record.sNo).split(',').map(s => Number(s.trim())).filter(Boolean);

      const loadToast = toast.loading('Reverting costing card from Google Sheets...');
      try {
        const historyResult = await productionAPI.getSheetData('Costing-History');
        if (historyResult.success && historyResult.records) {
          const matches = historyResult.records
            .filter(r => sNos.includes(Number(r.sNo)))
            .map(r => r.rowIndex);

          matches.sort((a, b) => b - a);
          for (const rowIndex of matches) {
            await productionAPI.deleteRow('Costing-History', rowIndex);
          }
        }

        toast.success('Record reverted to pending successfully!', { id: loadToast });
        await fetchOrders();
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

          <ColumnToggle
            headers={activeTab === 'pending' ? pendingToggleableHeaders : historyToggleableHeaders}
            visibleColumns={visibleColumns}
            onToggleColumn={handleToggleColumn}
          />

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
            visibleColumns={visibleColumns}
          />
        ) : (
          <KittingHistory
            data={filteredHistory}
            onDeleteHistory={handleDeleteHistory}
            visibleColumns={visibleColumns}
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
