import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, CheckCircle, History, Search, RotateCcw } from 'lucide-react';
import ActualProductionPending from './ActualProductionPending';
import ActualProductionHistory from './ActualProductionHistory';
import ActualProductionForm from './ActualProductionForm';
import ColumnToggle from '../../components/ColumnToggle';
import { TabSwitcher } from '../../components/StandardButtons';
import { productionAPI } from '../../services/api';

const parseStringToNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  const clean = val.toString().replace(/[^\d.-]/g, '');
  const num = Number(clean);
  return isNaN(num) ? 0 : num;
};

export default function ActualProduction() {
  const [activeTab, setActiveTab] = useState('pending');

  const pendingToggleableHeaders = useMemo(() => [
    "JOB Card No.", "S NO", "Timestamp", "Product code", "Product Name", "BAse Cat", "Order Quantity", "Raw Names", "Raw Quantities", "FG Available Qty", "Total Raw Required Qty", "Total Raw Cost", "Extra Amount", "Total Production Cost", "Selling Price", "Profit / Loss Amount", "Profit / Loss %", "Status", "Costing Image"
  ], []);

  const historyToggleableHeaders = useMemo(() => [
    "Timestamp", "JC-Job Card", "S NO", "ProductCode", "Product Name", "Order Quantity",
    "Raw Name1", "Raw Qty1", "Raw Name2", "Raw Qty2", "Raw Name3", "Raw Qty3", "Raw Name4", "Raw Qty4", "Raw Name5", "Raw Qty5", "Raw Name6", "Raw Qty6", "Raw Name7", "Raw Qty7", "Raw Name8", "Raw Qty8", "Raw Name9", "Raw Qty9", "Raw Name10", "Raw Qty10"
  ], []);

  const [visibleColumns, setVisibleColumns] = useState([
    "JOB Card No.", "S NO", "Timestamp", "Product code", "Product Name", "BAse Cat", "Order Quantity", "Raw Names", "Raw Quantities", "FG Available Qty", "Total Raw Required Qty", "Total Raw Cost", "Extra Amount", "Total Production Cost", "Selling Price", "Profit / Loss Amount", "Profit / Loss %", "Status", "Costing Image",
    "JC-Job Card", "ProductCode",
    "Raw Name1", "Raw Qty1", "Raw Name2", "Raw Qty2", "Raw Name3", "Raw Qty3", "Raw Name4", "Raw Qty4", "Raw Name5", "Raw Qty5", "Raw Name6", "Raw Qty6", "Raw Name7", "Raw Qty7", "Raw Name8", "Raw Qty8", "Raw Name9", "Raw Qty9", "Raw Name10", "Raw Qty10"
  ]);

  const handleToggleColumn = (columnName) => {
    setVisibleColumns(prev => 
      prev.includes(columnName)
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  const [kittingHistory, setKittingHistory] = useState([]);
  const [productionHistory, setProductionHistory] = useState([]);
  const [bomRecords, setBomRecords] = useState([]);
  const [inventoryRecords, setInventoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobCardResult, prodResult, bomResult, invResult, costingResult] = await Promise.all([
        productionAPI.getSheetData('JOB CARD', { headerRow: 6 }),
        productionAPI.getSheetData('ACTUAL PRODUCTION', { headerRow: 6 }),
        productionAPI.getSheetData('BOM'),
        productionAPI.getSheetData('Live IMS'),
        productionAPI.getSheetData('Costing-History')
      ]);

      if (jobCardResult.success && costingResult.success) {
        const transformedJobCards = jobCardResult.records.map(record => {
          const firstSNo = String(record.sNo).split(',')[0]?.trim();
          const matchedCosting = (costingResult.records || []).find(
            c => String(c.sNo).trim().split(',')[0]?.trim() === firstSNo
          );

          return {
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
            
            // Raw materials from JOB CARD row
            rawName1: record.rawName1 || record.__rowValues?.[9] || '',
            rawName2: record.rawName2 || record.__rowValues?.[10] || '',
            rawName3: record.rawName3 || record.__rowValues?.[11] || '',
            rawName4: record.rawName4 || record.__rowValues?.[12] || '',
            rawName5: record.rawName5 || record.__rowValues?.[13] || '',
            rawName6: record.rawName6 || record.__rowValues?.[14] || '',
            rawName7: record.rawName7 || record.__rowValues?.[15] || '',
            rawName8: record.rawName8 || record.__rowValues?.[16] || '',
            rawName9: record.rawName9 || record.__rowValues?.[17] || '',
            rawName10: record.rawName10 || record.__rowValues?.[18] || '',
            rawQty1: record.rawQty1 || record.__rowValues?.[19] || '',
            rawQty2: record.rawQty2 || record.__rowValues?.[20] || '',
            rawQty3: record.rawQty3 || record.__rowValues?.[21] || '',
            rawQty4: record.rawQty4 || record.__rowValues?.[22] || '',
            rawQty5: record.rawQty5 || record.__rowValues?.[23] || '',
            rawQty6: record.rawQty6 || record.__rowValues?.[24] || '',
            rawQty7: record.rawQty7 || record.__rowValues?.[25] || '',
            rawQty8: record.rawQty8 || record.__rowValues?.[26] || '',
            rawQty9: record.rawQty9 || record.__rowValues?.[27] || '',
            rawQty10: record.rawQty10 || record.__rowValues?.[28] || '',

            // Costing fields from matching costing history record
            rawNames: matchedCosting ? (matchedCosting.requiredRawMaterialName || matchedCosting.rawNames || '') : '',
            rawQuantities: matchedCosting ? (matchedCosting.rawQty || matchedCosting.rawQuantities || '') : '',
            fgAvailableQty: matchedCosting ? parseStringToNumber(matchedCosting.fGAvailableQty || matchedCosting.fgAvailableQty || 0) : 0,
            totalRawRequiredQty: matchedCosting ? parseStringToNumber(matchedCosting.totalRawRequiredQty || 0) : 0,
            totalRawCost: matchedCosting ? parseStringToNumber(matchedCosting.totalRawCost || 0) : 0,
            extraAmount: matchedCosting ? parseStringToNumber(matchedCosting.extraAmount || 0) : 0,
            totalProductionCost: matchedCosting ? parseStringToNumber(matchedCosting.totalProductionCost || 0) : 0,
            sellingPrice: matchedCosting ? parseStringToNumber(matchedCosting.sellingPrice || 0) : 0,
            profitLoss: matchedCosting ? parseStringToNumber(matchedCosting.profitLoss !== undefined ? matchedCosting.profitLoss : (matchedCosting['profit/LossAmount'] || 0)) : 0,
            profitLossPercent: matchedCosting ? parseStringToNumber(matchedCosting.profitLossPercent !== undefined ? matchedCosting.profitLossPercent : (matchedCosting['profit/Loss%'] || 0)) : 0,
            costingImage: matchedCosting ? (matchedCosting.pDFLink || matchedCosting.pdfLink || matchedCosting.costingImage || '') : '',
            
            __rowValues: record.__rowValues
          };
        });
        setKittingHistory(transformedJobCards);
      } else {
        toast.error(`Failed to load kitting approvals: ${jobCardResult.error || costingResult.error}`);
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
          __rowValues: record.__rowValues
        }));
        setProductionHistory(transformedHistory);
      } else {
        toast.error(`Failed to load production logs: ${prodResult.error}`);
      }

      if (bomResult.success) {
        setBomRecords(bomResult.records);
      } else {
        toast.error(`Failed to load BOM: ${bomResult.error}`);
      }

      if (invResult.success) {
        setInventoryRecords(invResult.records);
      } else {
        toast.error(`Failed to load inventory: ${invResult.error}`);
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
  const pendingProduction = useMemo(() => {
    return kittingHistory.filter(row => {
      // Check col-AG (index 32) is not null/empty
      const valAG = row.__rowValues && row.__rowValues[32];
      const hasAG = valAG !== undefined && valAG !== null && valAG.toString().trim() !== '';

      // Check col-AH (index 33) is null/empty
      const valAH = row.__rowValues && row.__rowValues[33];
      const hasAH = valAH !== undefined && valAH !== null && valAH.toString().trim() !== '';

      return hasAG && !hasAH;
    });
  }, [kittingHistory]);

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

  const handleSubmitProduction = async (kittingRecordId, productionRecord) => {
    setLoading(true);
    try {
      const result = await productionAPI.insertRow('ACTUAL PRODUCTION', productionRecord, { headerRow: 6 });
      if (result.success) {
        toast.success('Actual production log successfully submitted!');
        setIsFormOpen(false);
        await fetchData();
      } else {
        toast.error(`Failed to submit production: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting production log');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (historyId) => {
    const record = productionHistory.find(h => h.id === historyId);
    if (!record) {
      toast.error('Record not found');
      return;
    }

    if (window.confirm('Are you sure you want to delete this production log? This will revert the record back to Pending Production.')) {
      setLoading(true);
      try {
        const result = await productionAPI.deleteRow('ACTUAL PRODUCTION', record.rowIndex);
        if (result.success) {
          toast.success('Production record removed and order reverted to pending production.');
          await fetchData();
        } else {
          toast.error(`Failed to delete production: ${result.error}`);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error deleting production log');
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
          <p className="text-gray-600">Loading production pending orders...</p>
        </div>
      </div>
    );
  }

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
          <ActualProductionPending
            data={filteredPending}
            onOpenProductionForm={handleOpenProductionForm}
            visibleColumns={visibleColumns}
          />
        ) : (
          <ActualProductionHistory
            data={filteredHistory}
            onDeleteHistory={handleDeleteHistory}
            visibleColumns={visibleColumns}
          />
        )}
      </div>

      {/* Actual Production Log form modal */}
      <ActualProductionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmitProduction={handleSubmitProduction}
        record={selectedRecord}
        bomRecords={bomRecords}
        inventoryRecords={inventoryRecords}
      />
    </div>
  );
}
