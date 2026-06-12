import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, CheckCircle, History, Search, RotateCcw } from 'lucide-react';
import ActualProductionPending from './ActualProductionPending';
import ActualProductionHistory from './ActualProductionHistory';
import ActualProductionForm from './ActualProductionForm';
import { TabSwitcher } from '../../components/StandardButtons';
import { productionAPI } from '../../services/api';

export default function ActualProduction() {
  const [activeTab, setActiveTab] = useState('pending');

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
      const [kittingResult, prodResult, bomResult, invResult] = await Promise.all([
        productionAPI.getKittingApprovalHistory(),
        productionAPI.getActualProduction(),
        productionAPI.getBOM(),
        productionAPI.getInventory()
      ]);

      if (kittingResult.success) {
        setKittingHistory(kittingResult.records);
      } else {
        toast.error(`Failed to load approvals: ${kittingResult.error}`);
      }

      if (prodResult.success) {
        setProductionHistory(prodResult.records);
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
    const approvedKittings = kittingHistory.filter(h => h.status && h.status.trim().toLowerCase() === 'approved');
    const producedIds = new Set(productionHistory.map(p => String(p.sNo).trim()));
    return approvedKittings.filter(k => !producedIds.has(String(k.sNo).trim()));
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

  const handleSubmitProduction = async (kittingRecordId, productionRecord) => {
    setLoading(true);
    try {
      const result = await productionAPI.addActualProduction(productionRecord);
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
        const result = await productionAPI.deleteActualProduction(record.sNo);
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
        bomRecords={bomRecords}
        inventoryRecords={inventoryRecords}
      />
    </div>
  );
}
