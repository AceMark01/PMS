import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, CheckCircle, History, Search, RotateCcw } from 'lucide-react';
import TestingPending from './TestingPending';
import TestingApproval from './TestingApproval';
import TestingForm from './TestingForm';
import ColumnToggle from '../../components/ColumnToggle';
import { TabSwitcher } from '../../components/StandardButtons';
import { productionAPI } from '../../services/api';

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function Testing() {
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);

  const pendingToggleableHeaders = useMemo(() => [
    "Timestamp", "JC-Job Card", "S NO", "ProductCode", "ProductName", "Order Quantity", "Date Of Production", "Planned 3",
    "Raw Name1", "Raw Name2", "Raw Name3", "Raw Name4", "Raw Name5", "Raw Name6", "Raw Name7", "Raw Name8", "Raw Name9", "Raw Name10",
    "Raw Qty1", "Raw Qty2", "Raw Qty3", "Raw Qty4", "Raw Qty5", "Raw Qty6", "Raw Qty7", "Raw Qty8", "Raw Qty9", "Raw Qty10"
  ], []);

  const historyToggleableHeaders = useMemo(() => [
    "Timestamp", "JC-Job Card", "S NO", "ProductCode", "ProductName", "Order Quantity", "Date Of Production", "Testing Date", "Testing Status", "Testing Remarks",
    "Raw Name1", "Raw Name2", "Raw Name3", "Raw Name4", "Raw Name5", "Raw Name6", "Raw Name7", "Raw Name8", "Raw Name9", "Raw Name10",
    "Raw Qty1", "Raw Qty2", "Raw Qty3", "Raw Qty4", "Raw Qty5", "Raw Qty6", "Raw Qty7", "Raw Qty8", "Raw Qty9", "Raw Qty10"
  ], []);

  const [visibleColumns, setVisibleColumns] = useState([
    "Timestamp", "JC-Job Card", "S NO", "ProductCode", "ProductName", "Order Quantity", "Date Of Production", "Planned 3", "Testing Date", "Testing Status", "Testing Remarks",
    "Raw Name1", "Raw Name2", "Raw Name3", "Raw Name4", "Raw Name5", "Raw Name6", "Raw Name7", "Raw Name8", "Raw Name9", "Raw Name10",
    "Raw Qty1", "Raw Qty2", "Raw Qty3", "Raw Qty4", "Raw Qty5", "Raw Qty6", "Raw Qty7", "Raw Qty8", "Raw Qty9", "Raw Qty10"
  ]);

  const handleToggleColumn = (columnName) => {
    setVisibleColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  // Load and manage actual production logs (fetched from sheet)
  const [jobCardHistory, setJobCardHistory] = useState([]);
  const [actualProductionHistory, setActualProductionHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await productionAPI.getSheetData('ACTUAL PRODUCTION', { headerRow: 6 });

      if (result.success) {
        const transformedOrders = result.records.map(record => ({
          id: record.rowIndex?.toString() || `ap-${record.sNo}`,
          rowIndex: record.rowIndex,
          jobCardNo: record.jCJobCard || record['jC-JobCard'] || record.jcJobCard || record.jobCardNo || '',
          sNo: record.sNo,
          timestamp: record.timestamp,
          productCode: record.productCode || '',
          productName: record.productName || '',
          qty: Number(record.productionQuantity !== undefined ? record.productionQuantity : (record.qty || 0)),
          dateOfProduction: record.dateOfProduction || '',
          planned3: record.planned3 || '',
          actual3: record.actual3 || '',
          status3: record.status3 || '',
          remarks: record.remarks || '',
          rawName1: record.rawName1 || '',
          rawQty1: record.rawQty1 || '',
          rawName2: record.rawName2 || '',
          rawQty2: record.rawQty2 || '',
          rawName3: record.rawName3 || '',
          rawQty3: record.rawQty3 || '',
          rawName4: record.rawName4 || '',
          rawQty4: record.rawQty4 || '',
          rawName5: record.rawName5 || '',
          rawQty5: record.rawQty5 || '',
          rawName6: record.rawName6 || '',
          rawQty6: record.rawQty6 || '',
          rawName7: record.rawName7 || '',
          rawQty7: record.rawQty7 || '',
          rawName8: record.rawName8 || '',
          rawQty8: record.rawQty8 || '',
          rawName9: record.rawName9 || '',
          rawQty9: record.rawQty9 || '',
          rawName10: record.rawName10 || '',
          rawQty10: record.rawQty10 || '',
          __rowValues: record.__rowValues
        }));
        setJobCardHistory(transformedOrders);
      } else {
        toast.error(`Failed to load actual production logs: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data from spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter pending testing records based on planned3 and actual3 in ACTUAL PRODUCTION
  const pendingTesting = useMemo(() => {
    return jobCardHistory.filter(row => {
      const hasPlanned3 = row.planned3 !== undefined && row.planned3 !== null && row.planned3.toString().trim() !== '';
      const hasActual3 = row.actual3 !== undefined && row.actual3 !== null && row.actual3.toString().trim() !== '';
      return hasPlanned3 && !hasActual3;
    });
  }, [jobCardHistory]);

  // Filter testing history logs directly from jobCardHistory based on planned3 and actual3 in ACTUAL PRODUCTION
  const testingHistory = useMemo(() => {
    return jobCardHistory
      .filter(row => {
        const hasPlanned3 = row.planned3 !== undefined && row.planned3 !== null && row.planned3.toString().trim() !== '';
        const hasActual3 = row.actual3 !== undefined && row.actual3 !== null && row.actual3.toString().trim() !== '';
        return hasPlanned3 && hasActual3;
      })
      .map(row => ({
        ...row,
        testingDate: row.actual3 || '',
        testingStatus: row.status3 || 'Approved',
        testingRemarks: row.remarks || ''
      }));
  }, [jobCardHistory]);

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
    const record = pendingTesting.find(p => 
      String(p.id) === String(recordId) || 
      String(p.rowIndex) === String(recordId)
    );
    if (record) {
      setSelectedRecord(record);
      setIsFormOpen(true);
    }
  };

  const handleSubmitTesting = async (recordId, testingRecord) => {
    setLoading(true);
    try {
      const jcRecord = jobCardHistory.find(jc => 
        String(jc.id) === String(recordId) || 
        String(jc.rowIndex) === String(recordId)
      );
      if (!jcRecord) {
        toast.error('Production record not found');
        return;
      }

      const actual3 = formatDate(new Date());

      // Update columns AB (28), AD (30), and AE (31) of ACTUAL PRODUCTION
      const result = await Promise.all([
        productionAPI.updateCell('ACTUAL PRODUCTION', jcRecord.rowIndex, 28, actual3),
        productionAPI.updateCell('ACTUAL PRODUCTION', jcRecord.rowIndex, 30, testingRecord.testingStatus),
        productionAPI.updateCell('ACTUAL PRODUCTION', jcRecord.rowIndex, 31, testingRecord.testingRemarks || '')
      ]);

      const allSuccess = result.every(res => res.success);
      if (allSuccess) {
        toast.success(`Quality testing successfully submitted: ${testingRecord.testingStatus}!`);
        setIsFormOpen(false);
        await fetchData();
      } else {
        const errors = result.map(res => res.error).filter(Boolean).join(', ');
        toast.error(`Failed to submit testing: ${errors}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting testing decision');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (historyId) => {
    const record = testingHistory.find(h => h.id === historyId);
    if (!record) {
      toast.error('Testing record not found');
      return;
    }
    if (window.confirm('Are you sure you want to delete this testing record? This will revert the record back to Pending Testing.')) {
      setLoading(true);
      try {
        // Clear columns AB (28), AD (30), and AE (31) of ACTUAL PRODUCTION
        const result = await Promise.all([
          productionAPI.updateCell('ACTUAL PRODUCTION', record.rowIndex, 28, ''),
          productionAPI.updateCell('ACTUAL PRODUCTION', record.rowIndex, 30, ''),
          productionAPI.updateCell('ACTUAL PRODUCTION', record.rowIndex, 31, '')
        ]);

        const allSuccess = result.every(res => res.success);
        if (allSuccess) {
          toast.success('Testing log cleared and job reverted back to pending testing.');
          await fetchData();
        } else {
          const errors = result.map(res => res.error).filter(Boolean).join(', ');
          toast.error(`Failed to delete testing record: ${errors}`);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error deleting testing record');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading actual production history...</p>
        </div>
      </div>
    );
  }

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
          <TestingPending
            data={filteredPending}
            onOpenTestingForm={handleOpenTestingForm}
            visibleColumns={visibleColumns}
          />
        ) : (
          <TestingApproval
            data={filteredHistory}
            onDeleteHistory={handleDeleteHistory}
            visibleColumns={visibleColumns}
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
