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
    "Timestamp", "JC-Job Card", "S NO", "ProductCode", "ProductName", "Order Quantity", "Date Of Production", "Approval Status", "Approval Remarks",
    "Raw Name1", "Raw Name2", "Raw Name3", "Raw Name4", "Raw Name5", "Raw Name6", "Raw Name7", "Raw Name8", "Raw Name9", "Raw Name10",
    "Raw Qty1", "Raw Qty2", "Raw Qty3", "Raw Qty4", "Raw Qty5", "Raw Qty6", "Raw Qty7", "Raw Qty8", "Raw Qty9", "Raw Qty10"
  ], []);

  const historyToggleableHeaders = useMemo(() => [
    "Timestamp", "JC-Job Card", "S NO", "ProductCode", "ProductName", "Order Quantity", "Date Of Production", "Testing Date", "Testing Status", "Testing Remarks",
    "Raw Name1", "Raw Name2", "Raw Name3", "Raw Name4", "Raw Name5", "Raw Name6", "Raw Name7", "Raw Name8", "Raw Name9", "Raw Name10",
    "Raw Qty1", "Raw Qty2", "Raw Qty3", "Raw Qty4", "Raw Qty5", "Raw Qty6", "Raw Qty7", "Raw Qty8", "Raw Qty9", "Raw Qty10"
  ], []);

  const [visibleColumns, setVisibleColumns] = useState([
    "Timestamp", "JC-Job Card", "S NO", "ProductCode", "ProductName", "Order Quantity", "Date Of Production", "Approval Status", "Approval Remarks", "Testing Date", "Testing Status", "Testing Remarks",
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

  // Load and manage job card logs (fetched from sheet)
  const [jobCardHistory, setJobCardHistory] = useState([]);

  // Load and manage actual production logs (fetched from sheet)
  const [actualProductionHistory, setActualProductionHistory] = useState([]);



  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobCardResult, prodResult] = await Promise.all([
        productionAPI.getSheetData('JOB CARD', { headerRow: 6 }),
        productionAPI.getSheetData('ACTUAL PRODUCTION', { headerRow: 6 })
      ]);

      if (jobCardResult.success) {
        const transformedJobCards = jobCardResult.records.map(record => ({
          id: record.rowIndex?.toString() || `jc-${record.sNo}`,
          rowIndex: record.rowIndex,
          jobCardNo: record.jCJobCard || record['jC-JobCard'] || record.jcJobCard || record.jobCardNo || '',
          sNo: record.sNo,
          timestamp: record.timestamp,
          productCode: record.productCode || '',
          productName: record.productName || '',
          qty: Number(record.qty) || 0,
          dateOfProduction: record.dateOfProduction || '',
          status: record.approvalStatus || 'Approved',
          remarks: record.approvalRemarks || '',
          __rowValues: record.__rowValues
        }));
        setJobCardHistory(transformedJobCards);
      } else {
        toast.error(`Failed to load job cards from JOB CARD: ${jobCardResult.error}`);
      }

      if (prodResult.success) {
        const transformedHistory = prodResult.records.map(record => ({
          id: record.rowIndex?.toString() || `prod-${record.sNo}`,
          rowIndex: record.rowIndex,
          jobCardNo: record.jCJobCard || record['jC-JobCard'] || record.jcJobCard || record.jobCardNo || '',
          sNo: record.sNo,
          timestamp: record.timestamp,
          productCode: record.productCode || '',
          productName: record.productName || '',
          qty: Number(record.qty) || 0,
          dateOfProduction: record.dateOfProduction || '',
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
          approvalStatus: record.approvalStatus || 'Approved',
          approvalRemarks: record.approvalRemarks || '',
          __rowValues: record.__rowValues
        }));
        setActualProductionHistory(transformedHistory);
      } else {
        toast.error(`Failed to load actual production logs: ${prodResult.error}`);
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

  // Filter approved costing cards that are not yet in production history
  const pendingTesting = useMemo(() => {
    const pendingJobCards = jobCardHistory.filter(row => {
      const valAJ = row.__rowValues && row.__rowValues[35];
      const hasAJ = valAJ !== undefined && valAJ !== null && valAJ.toString().trim() !== '';

      const valAK = row.__rowValues && row.__rowValues[36];
      const hasAK = valAK !== undefined && valAK !== null && valAK.toString().trim() !== '';

      return hasAJ && !hasAK;
    });

    return pendingJobCards.map(jc => {
      const firstSNo = String(jc.sNo).split(',')[0]?.trim();
      const matchedProd = actualProductionHistory.find(
        ap => String(ap.sNo).trim().split(',')[0]?.trim() === firstSNo
      );

      if (matchedProd) {
        return {
          ...matchedProd,
        };
      }

      return {
        id: jc.id,
        rowIndex: jc.rowIndex,
        jobCardNo: jc.jobCardNo,
        sNo: jc.sNo,
        timestamp: jc.timestamp,
        productCode: jc.productCode,
        productName: jc.productName,
        qty: jc.qty,
        dateOfProduction: jc.dateOfProduction,
        approvalStatus: jc.status,
        approvalRemarks: jc.remarks,
        rawName1: '', rawQty1: '',
        rawName2: '', rawQty2: '',
        rawName3: '', rawQty3: '',
        rawName4: '', rawQty4: '',
        rawName5: '', rawQty5: '',
        rawName6: '', rawQty6: '',
        rawName7: '', rawQty7: '',
        rawName8: '', rawQty8: '',
        rawName9: '', rawQty9: '',
        rawName10: '', rawQty10: '',
      };
    });
  }, [jobCardHistory, actualProductionHistory]);

  // Filter testing history logs directly from jobCardHistory
  const testingHistory = useMemo(() => {
    const historyJobCards = jobCardHistory.filter(row => {
      const valAJ = row.__rowValues && row.__rowValues[35];
      const hasAJ = valAJ !== undefined && valAJ !== null && valAJ.toString().trim() !== '';

      const valAK = row.__rowValues && row.__rowValues[36];
      const hasAK = valAK !== undefined && valAK !== null && valAK.toString().trim() !== '';

      return hasAJ && hasAK;
    });

    return historyJobCards.map(jc => {
      const firstSNo = String(jc.sNo).split(',')[0]?.trim();
      const matchedProd = actualProductionHistory.find(
        ap => String(ap.sNo).trim().split(',')[0]?.trim() === firstSNo
      );

      const actual2 = jc.__rowValues && jc.__rowValues[36];
      const status2 = jc.__rowValues && jc.__rowValues[38];
      const remarks = jc.__rowValues && jc.__rowValues[39];

      const baseRecord = matchedProd || {
        productCode: jc.productCode,
        productName: jc.productName,
        qty: jc.qty,
        dateOfProduction: jc.dateOfProduction,
        approvalStatus: jc.status,
        approvalRemarks: jc.remarks,
        rawName1: '', rawQty1: '',
        rawName2: '', rawQty2: '',
        rawName3: '', rawQty3: '',
        rawName4: '', rawQty4: '',
        rawName5: '', rawQty5: '',
        rawName6: '', rawQty6: '',
        rawName7: '', rawQty7: '',
        rawName8: '', rawQty8: '',
        rawName9: '', rawQty9: '',
        rawName10: '', rawQty10: '',
      };

      return {
        ...baseRecord,
        id: jc.id,
        rowIndex: jc.rowIndex,
        jobCardNo: jc.jobCardNo,
        sNo: jc.sNo,
        timestamp: jc.timestamp,
        testingDate: actual2 || '',
        testingStatus: status2 || 'Approved',
        testingRemarks: remarks || ''
      };
    });
  }, [jobCardHistory, actualProductionHistory]);

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

  const handleSubmitTesting = async (recordId, testingRecord) => {
    setLoading(true);
    try {
      const jcRecord = jobCardHistory.find(jc => jc.id === recordId);
      if (!jcRecord) {
        toast.error('Job Card record not found');
        return;
      }

      const newRowData = [...(jcRecord.__rowValues || [])];
      while (newRowData.length < 40) {
        newRowData.push('');
      }

      const actual2 = formatDate(new Date());
      const planned2 = newRowData[35] || '';
      
      let delay = '';
      if (planned2) {
        const pDate = new Date(planned2);
        const aDate = new Date(actual2);
        if (!isNaN(pDate.getTime()) && !isNaN(aDate.getTime())) {
          const diffMs = aDate - pDate;
          const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
          delay = `${diffHrs} Hrs`;
        }
      }

      newRowData[36] = actual2;
      newRowData[37] = delay;
      newRowData[38] = testingRecord.testingStatus;
      newRowData[39] = testingRecord.testingRemarks || '';

      const result = await productionAPI.updateRow('JOB CARD', jcRecord.rowIndex, newRowData);
      if (result.success) {
        toast.success(`Quality testing successfully submitted: ${testingRecord.testingStatus}!`);
        setIsFormOpen(false);
        await fetchData();
      } else {
        toast.error(`Failed to submit testing: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting testing decision');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (historyId) => {
    const jcRecord = jobCardHistory.find(jc => jc.id === historyId);
    if (!jcRecord) {
      toast.error('Job Card record not found');
      return;
    }
    if (window.confirm('Are you sure you want to delete this testing record? This will revert the record back to Pending Testing.')) {
      setLoading(true);
      try {
        const newRowData = [...(jcRecord.__rowValues || [])];
        while (newRowData.length < 40) {
          newRowData.push('');
        }

        // Clear AK, AL, AM, AN (indices 36, 37, 38, 39)
        newRowData[36] = '';
        newRowData[37] = '';
        newRowData[38] = '';
        newRowData[39] = '';

        const result = await productionAPI.updateRow('JOB CARD', jcRecord.rowIndex, newRowData);
        if (result.success) {
          toast.success('Testing log cleared and job reverted back to pending testing.');
          await fetchData();
        } else {
          toast.error(`Failed to delete testing record: ${result.error}`);
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
