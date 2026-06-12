import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, RotateCcw, Filter, Trash2, Edit2, Layers, Tag, Box, DollarSign, X } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';
import SearchableDropdown from '../../components/SearchableDropdown';
import { SEEDED_ITEMS } from '../../utils/seeds';
import { productionAPI } from '../../services/api';

export default function BOM() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const masterItems = SEEDED_ITEMS;

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingRowIndex, setEditingRowIndex] = useState(null);

  const fetchBOM = async () => {
    setLoading(true);
    try {
      const result = await productionAPI.getBOM();
      if (result.success) {
        setMaterials(result.records);
      } else {
        toast.error(`Failed to fetch BOM: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load BOM from spreadsheet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOM();
  }, []);

  // Form State
  const [selectedProductName, setSelectedProductName] = useState('');
  const [selectedFGCode, setSelectedFGCode] = useState('');
  const [rawItems, setRawItems] = useState([
    { rawItemName: '', itemCode: '', unit: 'Kg', qty: '', costPerUnit: '', batchQty: '', qtyFromRaw: '' }
  ]);

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: '',
    productName: '',
    unit: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      productName: '',
      unit: ''
    });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleProductSelect = (name) => {
    const matched = masterItems.find(item => item.name === name);
    setSelectedProductName(name);
    setSelectedFGCode(matched ? matched.code : '');
  };

  const handleFGSelect = (code) => {
    const matched = masterItems.find(item => item.code === code);
    setSelectedProductName(matched ? matched.name : '');
    setSelectedFGCode(code);
  };

  const handleAddClick = () => {
    setIsEditMode(false);
    setEditingId(null);
    setEditingRowIndex(null);
    setSelectedProductName('');
    setSelectedFGCode('');
    setRawItems([
      { rawItemName: '', itemCode: '', unit: 'Kg', qty: '', costPerUnit: '', batchQty: '', qtyFromRaw: '' }
    ]);
    setShowFormModal(true);
  };

  const handleEditClick = (item) => {
    setIsEditMode(true);
    setEditingId(item.id);
    setEditingRowIndex(item.rowIndex);
    setSelectedProductName(item.productName);
    setSelectedFGCode(item.fgCode || '');
    setRawItems([
      {
        rawItemName: item.rawItemName,
        itemCode: item.itemCode,
        unit: item.unit,
        qty: item.qty,
        costPerUnit: item.costPerUnit,
        batchQty: item.batchQty,
        qtyFromRaw: item.qtyFromRaw
      }
    ]);
    setShowFormModal(true);
  };

  const handleDelete = async (item) => {
    if (confirm('Are you sure you want to delete this raw material record?')) {
      const loadToast = toast.loading('Deleting BOM record from Google Sheets...');
      try {
        const result = await productionAPI.deleteBOM(item.rowIndex);
        if (result.success) {
          toast.success('Record deleted successfully!', { id: loadToast });
          await fetchBOM();
        } else {
          toast.error(`Failed to delete record: ${result.error}`, { id: loadToast });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete record.', { id: loadToast });
      }
    }
  };

  const handleAddRawRow = () => {
    setRawItems(prev => [
      ...prev,
      { rawItemName: '', itemCode: '', unit: 'Kg', qty: '', costPerUnit: '', batchQty: '', qtyFromRaw: '' }
    ]);
  };

  const handleRemoveRawRow = (idxToRemove) => {
    setRawItems(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleRawItemChange = (index, field, value) => {
    setRawItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!selectedProductName || !selectedFGCode) {
      toast.error('Please select Product Name and FG Code.');
      return;
    }

    // Validate all raw items
    for (let idx = 0; idx < rawItems.length; idx++) {
      const row = rawItems[idx];
      if (!row.rawItemName || !row.itemCode || !row.qty || row.costPerUnit === '') {
        toast.error(`Please fill in all required fields for Raw Material #${idx + 1}.`);
        return;
      }
    }

    const loadToast = toast.loading(isEditMode ? 'Updating BOM record...' : 'Saving BOM records...');
    try {
      if (isEditMode && editingRowIndex) {
        // Edit mode: update single record
        const row = rawItems[0];
        const result = await productionAPI.updateBOM(editingRowIndex, {
          productName: selectedProductName,
          fgCode: selectedFGCode,
          rawItemName: row.rawItemName,
          itemCode: row.itemCode,
          unit: row.unit,
          qty: Number(row.qty),
          costPerUnit: Number(row.costPerUnit),
          batchQty: Number(row.batchQty) || 0,
          qtyFromRaw: Number(row.qtyFromRaw) || 0
        });

        if (result.success) {
          toast.success('BOM record updated successfully!', { id: loadToast });
          setShowFormModal(false);
          await fetchBOM();
        } else {
          toast.error(`Failed to update: ${result.error}`, { id: loadToast });
        }
      } else {
        // Add mode: save multiple records
        const promises = rawItems.map(row =>
          productionAPI.addBOM({
            productName: selectedProductName,
            fgCode: selectedFGCode,
            rawItemName: row.rawItemName,
            itemCode: row.itemCode,
            unit: row.unit,
            qty: Number(row.qty),
            costPerUnit: Number(row.costPerUnit),
            batchQty: Number(row.batchQty) || 0,
            qtyFromRaw: Number(row.qtyFromRaw) || 0
          })
        );

        const results = await Promise.all(promises);
        const failed = results.filter(r => !r.success);

        if (failed.length === 0) {
          toast.success(`${rawItems.length} BOM record(s) added successfully!`, { id: loadToast });
          setShowFormModal(false);
          await fetchBOM();
        } else {
          toast.error(`Failed to add some BOM records: ${failed[0].error}`, { id: loadToast });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save BOM.', { id: loadToast });
    }
  };

  // Compile options lists for filters
  const productsList = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.productName))).filter(Boolean).sort();
  }, [materials]);

  const unitsList = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.unit))).filter(Boolean).sort();
  }, [materials]);

  // Apply filters
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (filters.productName && m.productName !== filters.productName) return false;
      if (filters.unit && m.unit !== filters.unit) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          m.productName.toLowerCase().includes(q) ||
          m.fgCode.toLowerCase().includes(q) ||
          m.rawItemName.toLowerCase().includes(q) ||
          m.itemCode.toLowerCase().includes(q)
        );
      }
      return true;
    }).reverse();
  }, [materials, filters]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Bill of Materials...</p>
        </div>
      </div>
    );
  }

  const tableHeaders = [
    "Action", "Product Name", "FG Code", "Raw Item Name", "Item Code", "Unit", "Quantity (J/I)", "Cost Per Unit", "Total Cost", "Batch Qty", "Qty(From Raw Material)"
  ];

  const renderRow = (item, idx) => {
    return (
      <tr key={item.id || idx} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100 text-xs">
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <div className="flex justify-center gap-1.5">
            <button
              onClick={() => handleEditClick(item)}
              className="p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition active:scale-95"
              title="Edit Details"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDelete(item)}
              className="p-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition active:scale-95"
              title="Delete Record"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
        <td className="px-4 py-3 text-center font-semibold text-gray-900 whitespace-nowrap uppercase">{item.productName}</td>
        <td className="px-4 py-3 text-center text-indigo-600 font-bold whitespace-nowrap">{item.fgCode || '-'}</td>
        <td className="px-4 py-3 text-center text-gray-900 whitespace-nowrap uppercase font-medium">{item.rawItemName}</td>
        <td className="px-4 py-3 text-center text-indigo-600 font-semibold whitespace-nowrap">{item.itemCode}</td>
        <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">{item.unit}</td>
        <td className="px-4 py-3 text-center text-slate-700 font-bold whitespace-nowrap">{item.qty}</td>
        <td className="px-4 py-3 text-center text-slate-600 font-semibold whitespace-nowrap">₹{item.costPerUnit.toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 text-center text-emerald-600 font-bold whitespace-nowrap">₹{item.totalCost.toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 text-center text-slate-600 font-medium whitespace-nowrap">{item.batchQty}</td>
        <td className="px-4 py-3 text-center text-indigo-600 font-bold whitespace-nowrap">{item.qtyFromRaw}</td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    return (
      <div key={item.id || idx} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[150px]">{item.rawItemName} ({item.itemCode})</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleEditClick(item)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit"><Edit2 size={13} /></button>
            <button onClick={() => handleDelete(item)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={13} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Product Name</span>
            <span className="text-gray-700 font-semibold uppercase">{item.productName}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">FG Code</span>
            <span className="text-indigo-600 font-bold">{item.fgCode || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-black">Quantity ({item.unit})</span>
            <span className="text-slate-700 font-black">{item.qty}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Cost Per Unit</span>
            <span className="text-slate-700 font-medium">₹{item.costPerUnit}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Total Cost</span>
            <span className="text-emerald-600 font-bold">₹{item.totalCost}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Batch Qty / Qty From Raw</span>
            <span className="text-indigo-600 font-medium">{item.batchQty} / {item.qtyFromRaw}</span>
          </div>
        </div>
      </div>
    );
  };

  const unitOptions = [
    { value: 'Kg', label: 'Kg' },
    { value: 'Pcs', label: 'Pcs' },
    { value: 'Ltrs', label: 'Ltrs' },
    { value: 'Meters', label: 'Meters' },
    { value: 'Ton', label: 'Ton' }
  ];

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">

      {/* Header Filters & Add Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">

          {/* Search bar */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search raw materials..."
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
            {!showMobileFilters && (
              <button
                onClick={handleAddClick}
                className="lg:hidden flex items-center justify-center bg-indigo-600 text-white rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
                title="Add Record"
              >
                <Plus size={16} />
              </button>
            )}
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

            {/* Products Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[150px]">
              <SearchableDropdown
                options={productsList.map(p => ({ value: p, label: p }))}
                value={filters.productName}
                onChange={(val) => setFilters({ ...filters, productName: val })}
                placeholder="All Products"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            {/* Units Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[150px]">
              <SearchableDropdown
                options={unitsList.map(u => ({ value: u, label: u }))}
                value={filters.unit}
                onChange={(val) => setFilters({ ...filters, unit: val })}
                placeholder="All Units"
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

        {/* Add Record Button */}
        <button
          onClick={handleAddClick}
          className="hidden lg:flex bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg items-center justify-center transition shadow-sm w-[38px] h-[38px] flex-shrink-0"
          title="Add Raw Material"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedMaterials}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1400px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredMaterials.length}
          itemsPerPageOptions={[50, 100, 200, 500, 1000]}
        />
      </div>

      {/* Add/Edit Modal */}
      <ModalForm
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEditMode ? "Edit Raw Material" : "Add Raw Materials"}
        onSubmit={handleSave}
        submitText={isEditMode ? "Save Changes" : "Add Records"}
        cancelText="Cancel"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name Search */}
            <div className="space-y-1">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">Product Name *</label>
              <SearchableDropdown
                options={masterItems.map(item => ({ value: item.name, label: item.name }))}
                value={selectedProductName}
                onChange={handleProductSelect}
                placeholder="Search Product"
                className="w-full"
                height="h-[36px]"
                rounded="rounded"
              />
            </div>

            {/* FG Code Search */}
            <div className="space-y-1">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">FG Code *</label>
              <SearchableDropdown
                options={masterItems.map(item => ({ value: item.code, label: item.code }))}
                value={selectedFGCode}
                onChange={handleFGSelect}
                placeholder="Search FG Code"
                className="w-full"
                height="h-[36px]"
                rounded="rounded"
              />
            </div>
          </div>

          {/* Raw Materials List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-1 border-b border-indigo-50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Raw Material Items</h4>
              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleAddRawRow}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-black text-[10px] uppercase transition active:scale-95 border border-indigo-200"
                >
                  <Plus size={11} />
                  <span>Add Material Row</span>
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
              {rawItems.map((row, index) => (
                <div key={index} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 relative space-y-3">
                  {/* Delete button (only if more than 1 item and in add mode) */}
                  {!isEditMode && rawItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRawRow(index)}
                      className="absolute right-2 top-2 p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                      title="Remove Row"
                    >
                      <X size={14} />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Raw Item Name */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-500 uppercase tracking-tight font-bold">Raw Item Name *</label>
                      <input
                        type="text"
                        value={row.rawItemName}
                        onChange={(e) => handleRawItemChange(index, 'rawItemName', e.target.value)}
                        placeholder="e.g. Cover Milan Jumbo"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                        required
                      />
                    </div>

                    {/* Item Code */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-500 uppercase tracking-tight font-bold">Item Code *</label>
                      <input
                        type="text"
                        value={row.itemCode}
                        onChange={(e) => handleRawItemChange(index, 'itemCode', e.target.value)}
                        placeholder="e.g. CMJ"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Unit */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-500 uppercase tracking-tight font-bold">Unit *</label>
                      <select
                        value={row.unit}
                        onChange={(e) => handleRawItemChange(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px] bg-white"
                        required
                      >
                        {unitOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-500 uppercase tracking-tight font-bold">Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.000000001"
                        value={row.qty}
                        onChange={(e) => handleRawItemChange(index, 'qty', e.target.value)}
                        placeholder="Quantity"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                        required
                      />
                    </div>

                    {/* Cost Per Unit */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-500 uppercase tracking-tight font-bold">Cost / Unit *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.costPerUnit}
                        onChange={(e) => handleRawItemChange(index, 'costPerUnit', e.target.value)}
                        placeholder="Cost"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                        required
                      />
                    </div>

                    {/* Batch Qty */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-400 uppercase tracking-tight">Batch Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={row.batchQty}
                        onChange={(e) => handleRawItemChange(index, 'batchQty', e.target.value)}
                        placeholder="Batch Qty"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                      />
                    </div>

                    {/* Qty From Raw */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-400 uppercase tracking-tight">Qty From Raw</label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={row.qtyFromRaw}
                        onChange={(e) => handleRawItemChange(index, 'qtyFromRaw', e.target.value)}
                        placeholder="From Raw"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </ModalForm>

    </div>
  );
}
