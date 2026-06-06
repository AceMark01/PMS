import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Search, RotateCcw, Filter, Edit2, Package, Box, ShieldAlert } from 'lucide-react';
import DataTable from '../../components/DataTable';
import SearchableDropdown from '../../components/SearchableDropdown';
import ModalForm from '../../components/ModalForm';

import { SEEDED_ITEMS } from '../../utils/seeds';

export default function Inventory() {
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('inventory_status');
    if (saved) return JSON.parse(saved);

    // Seed from master items if empty
    const masterSaved = localStorage.getItem('master_items');
    const masterItems = masterSaved ? JSON.parse(masterSaved) : SEEDED_ITEMS;

    const initialInventory = masterItems.map((item, idx) => ({
      productCode: item.code,
      productName: item.name,
      maxLevel: 500 + (idx % 5) * 100, // Seed values
      prodGroup: item.category,
      closingStock: 100 + (idx % 7) * 45
    }));

    localStorage.setItem('inventory_status', JSON.stringify(initialInventory));
    return initialInventory;
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    productCode: '',
    productName: '',
    maxLevel: '',
    closingStock: ''
  });

  // Keep inventory in sync with master items if items are added
  useEffect(() => {
    const masterSaved = localStorage.getItem('master_items');
    const masterItems = masterSaved ? JSON.parse(masterSaved) : SEEDED_ITEMS;
    
    let updated = [...inventory];
    let changed = false;

    masterItems.forEach(item => {
      const exists = updated.some(inv => inv.productCode === item.code);
      if (!exists) {
        updated.push({
          productCode: item.code,
          productName: item.name,
          maxLevel: 500,
          prodGroup: item.category,
          closingStock: 0
        });
        changed = true;
      }
    });

    if (changed) {
      setInventory(updated);
      localStorage.setItem('inventory_status', JSON.stringify(updated));
    }
  }, []);

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: '',
    prodGroup: '',
    stockStatus: '' // 'Low' | 'Normal' | ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      prodGroup: '',
      stockStatus: ''
    });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditForm({
      productCode: item.productCode,
      productName: item.productName,
      maxLevel: item.maxLevel,
      closingStock: item.closingStock
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();

    const updated = inventory.map(item => {
      if (item.productCode === editForm.productCode) {
        return {
          ...item,
          maxLevel: Number(editForm.maxLevel),
          closingStock: Number(editForm.closingStock)
        };
      }
      return item;
    });

    setInventory(updated);
    localStorage.setItem('inventory_status', JSON.stringify(updated));
    setShowEditModal(false);
    toast.success('Inventory record updated successfully!');
  };

  // Compile groups list for filters
  const groupsList = useMemo(() => {
    return Array.from(new Set(inventory.map(i => i.prodGroup))).filter(Boolean).sort();
  }, [inventory]);

  // Apply filters
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      if (filters.prodGroup && item.prodGroup !== filters.prodGroup) return false;

      // Low stock defined as less than 20% of maxLevel
      if (filters.stockStatus === 'Low' && item.closingStock >= item.maxLevel * 0.2) return false;
      if (filters.stockStatus === 'Normal' && item.closingStock < item.maxLevel * 0.2) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          item.productCode.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          item.prodGroup.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventory, filters]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "Action", "Product Code", "Product Name", "Max Level", "Prod Group", "Closing Stock"
  ];

  const renderRow = (item, idx) => {
    const isLowStock = item.closingStock < item.maxLevel * 0.2;
    return (
      <tr key={item.productCode} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <button
            onClick={() => handleEditClick(item)}
            className="p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition-all active:scale-95 inline-flex items-center justify-center"
            title="Edit Stock Details"
          >
            <Edit2 size={15} />
          </button>
        </td>
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold whitespace-nowrap">{item.productCode}</td>
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 whitespace-nowrap uppercase">{item.productName}</td>
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-bold whitespace-nowrap">{item.maxLevel}</td>
        <td className="px-4 py-3 text-center text-[11px] text-gray-600 whitespace-nowrap">{item.prodGroup}</td>
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <span className={`px-2.5 py-0.5 rounded text-[11px] font-black ${
            isLowStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {item.closingStock}
          </span>
        </td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    const isLowStock = item.closingStock < item.maxLevel * 0.2;
    return (
      <div key={item.productCode} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[150px]">{item.productName}</span>
          </div>
          <button
            onClick={() => handleEditClick(item)}
            className="p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition"
            title="Edit Stock Details"
          >
            <Edit2 size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Product Code</span>
            <span className="text-indigo-600 font-bold">{item.productCode}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Prod Group</span>
            <span className="text-gray-700 font-medium">{item.prodGroup}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Max Level</span>
            <span className="text-gray-700 font-bold">{item.maxLevel}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Closing Stock</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black inline-block ${
              isLowStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {item.closingStock}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Header Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
          
          {/* Search bar */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search inventory..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-indigo-500 text-xs md:text-sm h-[32px] md:h-[38px]"
              />
            </div>
            <button
               onClick={() => setShowMobileFilters(!showMobileFilters)}
               className={`lg:hidden flex items-center justify-center rounded-lg shadow-sm h-[32px] w-[32px] flex-shrink-0 transition ${showMobileFilters ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
               title="Toggle Filters"
             >
               <Filter size={14} />
             </button>
             <button
               onClick={handleClearFilters}
               className="lg:hidden flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
               title="Clear Filters"
             >
               <RotateCcw size={14} />
             </button>
          </div>

          {/* Filters Dropdown Group */}
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>
            
            {/* Prod Group Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[150px]">
              <SearchableDropdown
                options={groupsList.map(g => ({ value: g, label: g }))}
                value={filters.prodGroup}
                onChange={(val) => setFilters({ ...filters, prodGroup: val })}
                placeholder="All Product Groups"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            {/* Stock Level Warning Filter */}
            <div className="flex-1 min-w-0 lg:min-w-[150px]">
              <SearchableDropdown
                options={[
                  { value: 'Low', label: 'Low Stock Alert' },
                  { value: 'Normal', label: 'Normal Stock' }
                ]}
                value={filters.stockStatus}
                onChange={(val) => setFilters({ ...filters, stockStatus: val })}
                placeholder="All Stock Levels"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            <button
              onClick={handleClearFilters}
              className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] hover:bg-gray-100 transition-colors shadow-sm"
              title="Clear Filters"
            >
              <RotateCcw size={16} />
            </button>

          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedInventory}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1000px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredInventory.length}
          itemsPerPageOptions={[50, 100, 200, 500, 1000]}
        />
      </div>

      {/* Edit Inventory Modal Form */}
      <ModalForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Update Stock Levels"
        onSubmit={handleSaveEdit}
        submitText="Save Changes"
        cancelText="Cancel"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-400 uppercase tracking-tight">Product Code</label>
            <input
              type="text"
              value={editForm.productCode}
              className="w-full px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-500 font-semibold rounded cursor-not-allowed text-xs h-[36px] outline-none"
              readOnly
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-400 uppercase tracking-tight">Product Name</label>
            <input
              type="text"
              value={editForm.productName}
              className="w-full px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-500 font-semibold rounded cursor-not-allowed text-xs h-[36px] outline-none"
              readOnly
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">Max Level *</label>
            <div className="relative">
              <Box className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="number"
                min="0"
                value={editForm.maxLevel}
                onChange={(e) => setEditForm({ ...editForm, maxLevel: e.target.value })}
                placeholder="Enter Max Stock Level"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">Closing Stock *</label>
            <div className="relative">
              <Package className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="number"
                min="0"
                value={editForm.closingStock}
                onChange={(e) => setEditForm({ ...editForm, closingStock: e.target.value })}
                placeholder="Enter Closing Stock"
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
                required
              />
            </div>
          </div>
        </div>
      </ModalForm>

    </div>
  );
}
