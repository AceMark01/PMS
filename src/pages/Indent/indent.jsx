import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart, ClipboardList, History, Search, RotateCcw, PenTool } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';
import { TabSwitcher } from '../../components/StandardButtons';
import { indentAPI } from '../../services/api';

export default function Indent() {
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGodown, setSelectedGodown] = useState('');

  // Pagination States
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingLimit, setPendingLimit] = useState(50);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(50);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingQtyVal, setPendingQtyVal] = useState('');
  const [remarksVal, setRemarksVal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Column Lists
  const pendingAllHeaders = useMemo(() => [
    'Action', 'Product Code', 'Product Name', 'Base Cat', 'Reorder Level', 'Max Level', 'Closing Stock', 'Reorder Qty', 'Pending Qty', 'Godown'
  ], []);

  const historyAllHeaders = useMemo(() => [
    'S NO', 'Timestamp', 'Product Code', 'Product Name', 'Base Cat', 'Pending Qty', 'Reorder Level', 'Max Level', 'Closing Stock', 'Reorder Qty', 'Product ID', 'Godown', 'Remarks'
  ], []);

  // Fetch data for both sheets
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        indentAPI.getSheetData('Reorder Sheet'),
        indentAPI.getSheetData('Indent Link')
      ]);

      if (pendingRes.success) {
        setPendingData(pendingRes.records || []);
      } else {
        toast.error(`Error loading Pending data: ${pendingRes.error || 'Unknown error'}`);
      }

      if (historyRes.success) {
        setHistoryData(historyRes.records || []);
      } else {
        toast.error(`Error loading History data: ${historyRes.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error fetching indent data:', err);
      toast.error('Failed to load indent data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGodown('');
  };

  // Extract unique godowns from current active tab dataset for filters
  const uniqueGodowns = useMemo(() => {
    const currentDataset = activeTab === 'pending' ? pendingData : historyData;
    const list = currentDataset.map(item => item.godown).filter(Boolean);
    return Array.from(new Set(list));
  }, [activeTab, pendingData, historyData]);

  // Filter datasets
  const filteredPending = useMemo(() => {
    return pendingData.filter(item => {
      const matchesSearch = 
        searchQuery.trim() === '' ||
        (item.productCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.productName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGodown = 
        selectedGodown === '' || 
        (item.godown || '').toLowerCase() === selectedGodown.toLowerCase();
      return matchesSearch && matchesGodown;
    });
  }, [pendingData, searchQuery, selectedGodown]);

  const filteredHistory = useMemo(() => {
    return historyData.filter(item => {
      const matchesSearch = 
        searchQuery.trim() === '' ||
        (item.productCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.productName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGodown = 
        selectedGodown === '' || 
        (item.godown || '').toLowerCase() === selectedGodown.toLowerCase();
      return matchesSearch && matchesGodown;
    });
  }, [historyData, searchQuery, selectedGodown]);

  // Paginated lists
  const paginatedPending = useMemo(() => {
    const start = (pendingPage - 1) * pendingLimit;
    return filteredPending.slice(start, start + pendingLimit);
  }, [filteredPending, pendingPage, pendingLimit]);

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyLimit;
    return filteredHistory.slice(start, start + historyLimit);
  }, [filteredHistory, historyPage, historyLimit]);

  // Open process modal
  const handleOpenProcessModal = (item) => {
    setSelectedItem(item);
    // Prefill with pendingQty / PENDING QUANTITY from the sheet if present
    setPendingQtyVal(item.pendingQty !== undefined ? String(item.pendingQty) : '');
    setRemarksVal('');
    setIsModalOpen(true);
  };

  // Handle Submit Indent
  const handleSubmitIndent = async (e) => {
    e.preventDefault();

    if (!selectedItem) return;
    if (pendingQtyVal.trim() === '') {
      toast.error('Pending Quantity is required');
      return;
    }

    setIsSubmitting(true);
    const saveToast = toast.loading('Submitting Indent to Google Sheets...');

    try {
      // 1. Fetch latest history to determine correct next S NO (thread-safe/latest)
      let nextSNo = 1;
      const historyRes = await indentAPI.getSheetData('Indent Link');
      if (historyRes.success && historyRes.records && historyRes.records.length > 0) {
        const sNos = historyRes.records
          .map(r => parseInt(r.sNo) || 0)
          .filter(n => n > 0);
        if (sNos.length > 0) {
          nextSNo = Math.max(...sNos) + 1;
        }
      }

      // 2. Generate current timestamp: dd/MM/yyyy HH:mm:ss
      const padZero = (n) => String(n).padStart(2, '0');
      const now = new Date();
      const timestamp = `${padZero(now.getDate())}/${padZero(now.getMonth() + 1)}/${now.getFullYear()} ${padZero(now.getHours())}:${padZero(now.getMinutes())}:${padZero(now.getSeconds())}`;

      // 3. Create the 23-column rowData array matching Indent Link sheet structure
      // Col A to L (0 to 11) populated. Empty strings for 12 to 21. Remarks in Col W (index 22).
      const rowData = new Array(23).fill('');
      rowData[0] = timestamp;
      rowData[1] = nextSNo;
      rowData[2] = selectedItem.productCode || '';
      rowData[3] = selectedItem.productName || '';
      rowData[4] = selectedItem.baseCat || '';
      rowData[5] = pendingQtyVal;
      rowData[6] = selectedItem.reorderLevel || '';
      rowData[7] = selectedItem.maxLevel || '';
      rowData[8] = selectedItem.closingStock || '';
      rowData[9] = selectedItem.reorderQty || '';
      rowData[10] = selectedItem.productID || '';
      rowData[11] = selectedItem.godown || '';
      rowData[22] = remarksVal || '';

      // 4. Save via Indent API
      const result = await indentAPI.insertRow('Indent Link', rowData);

      if (result.success) {
        toast.success(`Indent (S NO #${nextSNo}) submitted successfully!`, { id: saveToast });
        setIsModalOpen(false);
        setSelectedItem(null);
        // Refresh and switch to history
        await fetchData();
        setActiveTab('history');
      } else {
        throw new Error(result.error || 'Failed to submit indent');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Submission failed: ${err.message}`, { id: saveToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendering Desktop Rows - Pending Tab
  const renderPendingRow = (item, idx) => {
    return (
      <tr key={item.id || idx} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100 text-center">
        <td className="px-4 py-2">
          <button
            onClick={() => handleOpenProcessModal(item)}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] md:text-xs font-bold uppercase tracking-wider transition active:scale-95 shadow-sm flex items-center justify-center gap-1 mx-auto"
          >
            <PenTool size={11} />
            <span>Process</span>
          </button>
        </td>
        <td className="px-4 py-2.5 text-xs text-indigo-600 font-bold whitespace-nowrap">{item.productCode}</td>
        <td className="px-4 py-2.5 text-xs font-semibold text-gray-900 text-left truncate max-w-xs uppercase">{item.productName}</td>
        <td className="px-4 py-2.5 text-[11px] text-gray-600 uppercase">{item.baseCat}</td>
        <td className="px-4 py-2.5 text-xs text-slate-700 font-medium">{Number(item.reorderLevel || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-2.5 text-xs text-slate-700 font-medium">{Number(item.maxLevel || 0).toLocaleString('en-IN')}</td>
        <td className={`px-4 py-2.5 text-xs font-bold ${Number(item.closingStock || 0) < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
          {Number(item.closingStock || 0).toLocaleString('en-IN')}
        </td>
        <td className="px-4 py-2.5 text-xs text-indigo-600 font-black">{Number(item.reorderQty || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-2.5 text-xs text-amber-600 font-black">{Number(item.pendingQty || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-2.5 text-xs text-slate-600 font-semibold uppercase whitespace-nowrap">{item.godown}</td>
      </tr>
    );
  };

  // Rendering Mobile Card - Pending Tab
  const renderPendingCard = (item, idx) => {
    return (
      <div key={item.id || idx} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100 text-left">
        <div className="flex justify-between items-start border-b border-slate-50 pb-2">
          <div>
            <span className="text-xs font-bold text-gray-900 uppercase block">{item.productName}</span>
            <span className="text-[10px] text-indigo-600 font-bold uppercase">{item.productCode} ({item.baseCat})</span>
          </div>
          <button
            onClick={() => handleOpenProcessModal(item)}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-black uppercase tracking-wider transition active:scale-95 flex items-center gap-1 shadow-xs"
          >
            <PenTool size={10} />
            <span>Process</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/50 rounded-lg p-2.5 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Reorder Level</span>
            <span className="text-gray-700 font-medium">{Number(item.reorderLevel || 0).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Max Level</span>
            <span className="text-gray-700 font-medium">{Number(item.maxLevel || 0).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Closing Stock</span>
            <span className={`font-bold ${Number(item.closingStock || 0) < 0 ? 'text-rose-600' : 'text-gray-700'}`}>
              {Number(item.closingStock || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Reorder Qty</span>
            <span className="text-indigo-600 font-bold">{Number(item.reorderQty || 0).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Pending Qty</span>
            <span className="text-amber-600 font-black">{Number(item.pendingQty || 0).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Godown</span>
            <span className="text-gray-600 font-bold uppercase">{item.godown}</span>
          </div>
        </div>
      </div>
    );
  };

  // Rendering Desktop Rows - History Tab
  const renderHistoryRow = (item, idx) => {
    return (
      <tr key={item.id || idx} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100 text-center">
        <td className="px-4 py-2.5 text-xs text-gray-700 font-bold whitespace-nowrap">{item.sNo}</td>
        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{item.timestamp}</td>
        <td className="px-4 py-2.5 text-xs text-indigo-600 font-bold whitespace-nowrap">{item.productCode}</td>
        <td className="px-4 py-2.5 text-xs font-semibold text-gray-900 text-left truncate max-w-xs uppercase">{item.productName}</td>
        <td className="px-4 py-2.5 text-[11px] text-gray-600 uppercase">{item.baseCat}</td>
        <td className="px-4 py-2.5 text-xs text-amber-600 font-black">{Number(item.pendingQty || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-2.5 text-xs text-slate-700 font-medium">{Number(item.reorderLevel || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-2.5 text-xs text-slate-700 font-medium">{Number(item.maxLevel || 0).toLocaleString('en-IN')}</td>
        <td className={`px-4 py-2.5 text-xs font-bold ${Number(item.closingStock || 0) < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
          {Number(item.closingStock || 0).toLocaleString('en-IN')}
        </td>
        <td className="px-4 py-2.5 text-xs text-indigo-600 font-black">{Number(item.reorderQty || 0).toLocaleString('en-IN')}</td>
        <td className="px-4 py-2.5 text-xs text-slate-500 font-mono whitespace-nowrap">{item.productID}</td>
        <td className="px-4 py-2.5 text-xs text-slate-600 font-semibold uppercase whitespace-nowrap">{item.godown}</td>
        <td className="px-4 py-2.5 text-xs text-left text-slate-600 truncate max-w-xs font-medium" title={item.remarks}>{item.remarks || '-'}</td>
      </tr>
    );
  };

  // Rendering Mobile Card - History Tab
  const renderHistoryCard = (item, idx) => {
    return (
      <div key={item.id || idx} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100 text-left">
        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
          <div>
            <span className="text-xs font-bold text-gray-900 uppercase block">{item.productName}</span>
            <span className="text-[10px] text-indigo-600 font-bold uppercase">{item.productCode} ({item.baseCat})</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase">
            S NO #{item.sNo}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/50 rounded-lg p-2.5 border border-slate-100/50">
          <div className="col-span-2">
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Timestamp</span>
            <span className="text-gray-700 font-medium">{item.timestamp}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Pending Qty</span>
            <span className="text-amber-600 font-black">{Number(item.pendingQty || 0).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Reorder Qty</span>
            <span className="text-indigo-600 font-bold">{Number(item.reorderQty || 0).toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Godown</span>
            <span className="text-gray-600 font-bold uppercase">{item.godown}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Product ID</span>
            <span className="text-gray-500 font-mono">{item.productID}</span>
          </div>
          <div className="col-span-2 border-t border-slate-100 pt-1.5 mt-1">
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Remarks</span>
            <span className="text-gray-700 font-medium">{item.remarks || '-'}</span>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'pending', label: 'Pending Reorders', count: filteredPending.length, icon: ClipboardList },
    { id: 'history', label: 'Indent History', count: filteredHistory.length, icon: History }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-xl border border-indigo-50 shadow-xs">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">Fetching Indent sheets from server...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white p-2 md:p-4 rounded-xl border border-indigo-50/50 shadow-sm relative overflow-hidden">
      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 pb-3 border-b border-indigo-50 flex-shrink-0">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <ShoppingCart size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-tight">Indent Management</h1>
            <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">Manage product indents & reorders</p>
          </div>
        </div>

        <TabSwitcher
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSearchQuery('');
            setSelectedGodown('');
          }}
          tabs={tabs}
        />
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 py-3 flex-shrink-0 bg-slate-50/50 px-3 rounded-lg mt-3 border border-slate-100/50">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto flex-1 max-w-xl">
          {/* Search Box */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by product name or code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPendingPage(1);
                setHistoryPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-xs h-[36px] bg-white font-medium"
            />
          </div>

          {/* Godown Filter */}
          <select
            value={selectedGodown}
            onChange={(e) => {
              setSelectedGodown(e.target.value);
              setPendingPage(1);
              setHistoryPage(1);
            }}
            className="w-full sm:w-[180px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 text-xs h-[36px] bg-white font-bold text-gray-700"
          >
            <option value="">All Godowns</option>
            {uniqueGodowns.map(g => (
              <option key={g} value={g}>{g.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleResetFilters}
            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 bg-white rounded-lg transition-all flex items-center justify-center h-[36px] w-[36px] active:scale-95"
            title="Reset Filters"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 min-h-0 mt-3 flex flex-col relative">
        {activeTab === 'pending' ? (
          <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
            <DataTable
              headers={pendingAllHeaders}
              allHeaders={pendingAllHeaders}
              visibleColumns={pendingAllHeaders}
              data={paginatedPending}
              renderRow={renderPendingRow}
              renderCard={renderPendingCard}
              minWidth="1200px"
              currentPage={pendingPage}
              totalPages={Math.ceil(filteredPending.length / pendingLimit)}
              itemsPerPage={pendingLimit}
              onPageChange={setPendingPage}
              onItemsPerPageChange={(val) => { setPendingLimit(val); setPendingPage(1); }}
              totalResults={filteredPending.length}
              itemsPerPageOptions={[50, 100, 200, 500]}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex flex-col">
            <DataTable
              headers={historyAllHeaders}
              allHeaders={historyAllHeaders}
              visibleColumns={historyAllHeaders}
              data={paginatedHistory}
              renderRow={renderHistoryRow}
              renderCard={renderHistoryCard}
              minWidth="1400px"
              currentPage={historyPage}
              totalPages={Math.ceil(filteredHistory.length / historyLimit)}
              itemsPerPage={historyLimit}
              onPageChange={setHistoryPage}
              onItemsPerPageChange={(val) => { setHistoryLimit(val); setHistoryPage(1); }}
              totalResults={filteredHistory.length}
              itemsPerPageOptions={[50, 100, 200, 500]}
            />
          </div>
        )}
      </div>

      {/* Process Modal */}
      {isModalOpen && selectedItem && (
        <ModalForm
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          title="Process Reorder Indent"
          onSubmit={handleSubmitIndent}
          submitText={isSubmitting ? 'Submitting...' : 'Submit Indent'}
          cancelText="Cancel"
          loading={isSubmitting}
          maxWidth="max-w-xl"
        >
          {/* Read-Only Prefilled Product Info */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 mb-4 text-xs">
            <h3 className="font-black text-gray-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Product Specifications</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black uppercase">
                {selectedItem.productCode}
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <span className="text-gray-400 block uppercase text-[9px] tracking-tight">Product Name</span>
                <span className="text-gray-800 font-bold uppercase">{selectedItem.productName}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase text-[9px] tracking-tight">Base Category</span>
                <span className="text-gray-800 font-semibold uppercase">{selectedItem.baseCat}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase text-[9px] tracking-tight">Godown Location</span>
                <span className="text-gray-800 font-bold uppercase">{selectedItem.godown}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase text-[9px] tracking-tight">Reorder Level</span>
                <span className="text-gray-700 font-medium">{Number(selectedItem.reorderLevel || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase text-[9px] tracking-tight">Max Level</span>
                <span className="text-gray-700 font-medium">{Number(selectedItem.maxLevel || 0).toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase text-[9px] tracking-tight">Closing Stock</span>
                <span className={`font-bold ${Number(selectedItem.closingStock || 0) < 0 ? 'text-rose-600' : 'text-gray-700'}`}>
                  {Number(selectedItem.closingStock || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase text-[9px] tracking-tight">Reorder Quantity</span>
                <span className="text-indigo-600 font-bold">{Number(selectedItem.reorderQty || 0).toLocaleString('en-IN')}</span>
              </div>
              {selectedItem.productID && (
                <div className="col-span-2 border-t border-slate-200/60 pt-1.5">
                  <span className="text-gray-400 block uppercase text-[9px] tracking-tight">Product ID (Database Key)</span>
                  <span className="text-gray-600 font-mono font-medium">{selectedItem.productID}</span>
                </div>
              )}
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-black">
                Pending Quantity *
              </label>
              <input
                type="number"
                value={pendingQtyVal}
                onChange={(e) => setPendingQtyVal(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px] font-bold"
                required
                min="0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-black">
                Remarks / Notes
              </label>
              <textarea
                value={remarksVal}
                onChange={(e) => setRemarksVal(e.target.value)}
                placeholder="Enter indent remarks or specific instructions..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-gray-700"
              />
            </div>
          </div>
        </ModalForm>
      )}
    </div>
  );
}
