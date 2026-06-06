import React, { useState, useEffect, useMemo } from 'react';
import { Layers, X, Plus, Calendar, Tag, Box, DollarSign, Calculator } from 'lucide-react';
import SearchableDropdown from '../../components/SearchableDropdown';
import ModalForm from '../../components/ModalForm';

export default function FullKittingForm({ isOpen, onClose, onSave, pendingOrders, initialOrderId }) {
  const [selectedProductName, setSelectedProductName] = useState('');
  const [extraAmount, setExtraAmount] = useState('0');
  const [isExtraManuallyEdited, setIsExtraManuallyEdited] = useState(false);
  const [fgAvailableQty, setFgAvailableQty] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');

  // Load raw materials and master items from local storage to calculate BOM
  const rawMaterials = useMemo(() => {
    const saved = localStorage.getItem('raw_materials');
    return saved ? JSON.parse(saved) : [];
  }, [isOpen]);

  // Load unique list of raw materials for dropdown options
  const uniqueRawMaterials = useMemo(() => {
    const unique = [];
    const seen = new Set();
    for (const rm of rawMaterials) {
      if (rm.rawItemName && !seen.has(rm.rawItemName)) {
        seen.add(rm.rawItemName);
        unique.push(rm);
      }
    }
    return unique.sort((a, b) => a.rawItemName.localeCompare(b.rawItemName));
  }, [rawMaterials]);

  const masterItems = useMemo(() => {
    const saved = localStorage.getItem('master_items');
    return saved ? JSON.parse(saved) : [];
  }, [isOpen]);

  // Unique list of product names from pendingOrders
  const productNamesOptions = useMemo(() => {
    const names = Array.from(new Set(pendingOrders.map(o => o.productName))).sort();
    return names.map(n => ({ value: n, label: n }));
  }, [pendingOrders]);

  // Orders matching selectedProductName
  const matchingOrders = useMemo(() => {
    if (!selectedProductName) return [];
    return pendingOrders.filter(o => o.productName === selectedProductName);
  }, [selectedProductName, pendingOrders]);

  // Extract S Nos as a comma-separated text string
  const sNoText = useMemo(() => {
    return matchingOrders.map(o => o.sNo).join(', ');
  }, [matchingOrders]);

  // Extract Plan Qtys as a comma-separated text string
  const planQtyText = useMemo(() => {
    return matchingOrders.map(o => o.qty).join(', ');
  }, [matchingOrders]);

  // Calculate sum of quantities for matching orders
  const totalQty = useMemo(() => {
    return matchingOrders.reduce((sum, o) => sum + (Number(o.qty) || 0), 0);
  }, [matchingOrders]);

  // Use the first matching order as a template for other order details
  const selectedOrder = useMemo(() => {
    return matchingOrders[0] || null;
  }, [matchingOrders]);

  // Find BOM components for the selected product
  const bomComponents = useMemo(() => {
    if (!selectedOrder) return [];
    return rawMaterials.filter(
      rm => rm.productName.toLowerCase() === selectedOrder.productName.toLowerCase()
    );
  }, [selectedOrder, rawMaterials]);

  // Find selling price of the selected finished good
  const finishedGoodPrice = useMemo(() => {
    if (!selectedOrder) return 0;
    const item = masterItems.find(i => i.code === selectedOrder.productCode);
    return item ? Number(item.price) || 0 : 0;
  }, [selectedOrder, masterItems]);

  // Reset form when opened/closed
  useEffect(() => {
    if (isOpen) {
      if (initialOrderId) {
        const order = pendingOrders.find(o => o.id === initialOrderId);
        if (order) {
          setSelectedProductName(order.productName);
          return;
        }
      }
      setSelectedProductName('');
      setExtraAmount('0');
      setIsExtraManuallyEdited(false);
      setFgAvailableQty('0');
      setSellingPrice('0');
    }
  }, [isOpen, initialOrderId, pendingOrders]);

  // Pre-populate selling price and FG Available Qty when selected product or matching orders change
  useEffect(() => {
    setIsExtraManuallyEdited(false);
    if (selectedOrder) {
      setSellingPrice((finishedGoodPrice * totalQty).toFixed(2));
      
      const savedInventory = localStorage.getItem('inventory_status');
      let inventoryList = [];
      if (savedInventory) {
        inventoryList = JSON.parse(savedInventory);
      } else {
        const masterSaved = localStorage.getItem('master_items');
        const masterItems = masterSaved ? JSON.parse(masterSaved) : [];
        inventoryList = masterItems.map((item, idx) => ({
          productCode: item.code,
          productName: item.name,
          maxLevel: 500 + (idx % 5) * 100,
          prodGroup: item.category,
          closingStock: 100 + (idx % 7) * 45
        }));
        localStorage.setItem('inventory_status', JSON.stringify(inventoryList));
      }
      
      const invItem = inventoryList.find(item => item.productCode === selectedOrder.productCode);
      const autofillQty = invItem ? String(invItem.maxLevel || 0) : '0';
      setFgAvailableQty(autofillQty);
    } else {
      setSellingPrice('0');
      setFgAvailableQty('0');
    }
  }, [selectedOrder, finishedGoodPrice, totalQty]);

  const [editedTableData, setEditedTableData] = useState([]);

  // Populate editedTableData when selectedOrder or bomComponents change
  useEffect(() => {
    if (!selectedOrder || bomComponents.length === 0) {
      setEditedTableData([]);
      return;
    }

    const initial = bomComponents.map(comp => {
      const rawQty = (Number(comp.qty) || 0) * totalQty;
      const rawCost = rawQty * (Number(comp.costPerUnit) || 0);
      const availableRawQty = Number(comp.qtyFromRaw) || 0;
      const indentQty = Math.max(0, rawQty - availableRawQty);

      return {
        rawName: comp.rawItemName,
        itemCode: comp.itemCode,
        rawQty: Number(rawQty.toFixed(4)),
        costPerUnit: Number(comp.costPerUnit) || 0,
        rawCost: Number(rawCost.toFixed(2)),
        availableQty: availableRawQty,
        indentQty: Number(indentQty.toFixed(4)),
        unit: comp.unit || 'pcs',
        checked: false
      };
    });
    setEditedTableData(initial);
  }, [selectedOrder, bomComponents, totalQty]);

  // Auto-calculate Extra Amount as 10% of Total Raw Material Cost (unless manually edited)
  const totalRawCostVal = useMemo(() => {
    return editedTableData.reduce((sum, item) => sum + item.rawCost, 0);
  }, [editedTableData]);

  useEffect(() => {
    if (!isExtraManuallyEdited && selectedOrder) {
      setExtraAmount((totalRawCostVal * 0.10).toFixed(2));
    }
  }, [totalRawCostVal, isExtraManuallyEdited, selectedOrder]);

  const handleCellChange = (index, field, value) => {
    const updated = editedTableData.map((row, idx) => {
      if (idx === index) {
        const newRow = { ...row, [field]: field === 'checked' ? value : (Number(value) || 0) };
        
        // Recalculate related fields
        if (field === 'rawQty' || field === 'availableQty') {
          newRow.indentQty = Number(Math.max(0, newRow.rawQty - newRow.availableQty).toFixed(4));
        }
        if (field === 'rawQty') {
          newRow.rawCost = Number((newRow.rawQty * newRow.costPerUnit).toFixed(2));
        }
        if (field === 'rawCost') {
          // If they edit rawCost directly, update the costPerUnit as well
          newRow.costPerUnit = newRow.rawQty > 0 ? Number((newRow.rawCost / newRow.rawQty).toFixed(4)) : 0;
        }
        
        return newRow;
      }
      return row;
    });
    setEditedTableData(updated);
  };

  const handleSelectRawMaterial = (index, name) => {
    const material = rawMaterials.find(rm => rm.rawItemName === name);
    const updated = editedTableData.map((row, idx) => {
      if (idx === index) {
        const costVal = material ? Number(material.costPerUnit) || 0 : 0;
        const codeVal = material ? material.itemCode : 'CUSTOM';
        const unitVal = material ? material.unit || 'pcs' : 'pcs';
        return {
          ...row,
          rawName: name,
          itemCode: codeVal,
          costPerUnit: costVal,
          unit: unitVal,
          rawCost: Number((row.rawQty * costVal).toFixed(2)),
          indentQty: Number(Math.max(0, row.rawQty - row.availableQty).toFixed(4)),
          checked: false
        };
      }
      return row;
    });
    setEditedTableData(updated);
  };

  const handleDeleteRow = (index) => {
    const updated = editedTableData.filter((_, idx) => idx !== index);
    setEditedTableData(updated);
  };

  const handleAddRow = () => {
    setEditedTableData(prev => [
      ...prev,
      {
        rawName: '',
        itemCode: 'CUSTOM',
        rawQty: 0,
        costPerUnit: 0,
        rawCost: 0,
        availableQty: 0,
        indentQty: 0,
        unit: 'pcs',
        checked: false,
        isCustom: true
      }
    ]);
  };

  // Total summary calculations
  const totals = useMemo(() => {
    const totalRawCost = editedTableData.reduce((sum, item) => sum + item.rawCost, 0);
    const extra = Number(extraAmount) || 0;
    const totalProductionCost = totalRawCost + extra;
    const totalSellingPrice = Number(sellingPrice) || 0;
    const profitLoss = totalSellingPrice - totalProductionCost;
    const profitLossPercent = totalProductionCost > 0 ? (profitLoss / totalProductionCost) * 100 : 0;
    const totalRawRequiredQty = editedTableData.reduce((sum, item) => sum + item.rawQty, 0);

    return {
      totalRawRequiredQty,
      totalRawCost: Number(totalRawCost.toFixed(2)),
      totalProductionCost: Number(totalProductionCost.toFixed(2)),
      totalSellingPrice: Number(totalSellingPrice.toFixed(2)),
      profitLoss: Number(profitLoss.toFixed(2)),
      profitLossPercent: Number(profitLossPercent.toFixed(2))
    };
  }, [editedTableData, extraAmount, sellingPrice]);

  // Dynamically generate an SVG costing chart representation
  const generateCostingImage = (totalsVal) => {
    const rawCost = totalsVal.totalRawCost;
    const extra = Number(extraAmount) || 0;
    const profit = totalsVal.profitLoss;
    const total = Math.max(1, rawCost + extra + Math.max(0, profit));

    const rawPct = ((rawCost / total) * 100).toFixed(0);
    const extraPct = ((extra / total) * 100).toFixed(0);
    const profitPct = profit > 0 ? ((profit / total) * 100).toFixed(0) : 0;

    // Return a neat SVG data url representing cost breakdown
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="100%" height="100%">
        <rect width="240" height="60" rx="6" fill="#f8fafc"/>
        <text x="10" y="18" font-family="sans-serif" font-size="9" font-weight="bold" fill="#475569">COST BREAKDOWN</text>
        
        <!-- Raw Cost Bar -->
        <rect x="10" y="26" width="${(rawPct * 2.2).toFixed(0)}" height="12" fill="#6366f1" rx="2"/>
        <!-- Extra Cost Bar -->
        <rect x="${(10 + rawPct * 2.2).toFixed(0)}" y="26" width="${(extraPct * 2.2).toFixed(0)}" height="12" fill="#f59e0b" rx="2"/>
        <!-- Profit Bar -->
        ${profit > 0 ? `<rect x="${(10 + (Number(rawPct) + Number(extraPct)) * 2.2).toFixed(0)}" y="26" width="${(profitPct * 2.2).toFixed(0)}" height="12" fill="#10b981" rx="2"/>` : ''}
        
        <!-- Legend labels -->
        <circle cx="15" cy="48" r="3" fill="#6366f1"/>
        <text x="22" y="51" font-family="sans-serif" font-size="7" fill="#64748b">Raw: ${rawPct}%</text>
        
        <circle cx="90" cy="48" r="3" fill="#f59e0b"/>
        <text x="97" y="51" font-family="sans-serif" font-size="7" fill="#64748b">Overhead: ${extraPct}%</text>
        
        ${profit > 0 ? `
          <circle cx="170" cy="48" r="3" fill="#10b981"/>
          <text x="177" y="51" font-family="sans-serif" font-size="7" fill="#64748b">Profit: ${profitPct}%</text>
        ` : `
          <circle cx="170" cy="48" r="3" fill="#ef4444"/>
          <text x="177" y="51" font-family="sans-serif" font-size="7" fill="#ef4444">Loss</text>
        `}
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedProductName) {
      toast.error('Please select Product name first.');
      return;
    }

    if (bomComponents.length === 0) {
      toast.error('This product has no configured BOM components. Please configure it in the BOM section first.');
      return;
    }

    const rawNames = editedTableData.map(item => item.rawName).join(', ');
    const rawQtys = editedTableData.map(item => `${item.rawQty} ${item.unit}`).join(', ');

    const costingImage = generateCostingImage(totals);

    const historyRecord = {
      id: `kh-${Date.now()}`,
      sNo: sNoText,
      timestamp: selectedOrder.timestamp,
      productCode: selectedOrder.productCode,
      productName: selectedOrder.productName,
      baseCat: selectedOrder.baseCat,
      qty: totalQty,
      rawNames,
      rawQuantities: rawQtys,
      fgAvailableQty: Number(fgAvailableQty) || 0,
      totalRawRequiredQty: totals.totalRawRequiredQty,
      totalRawCost: totals.totalRawCost,
      extraAmount: Number(extraAmount) || 0,
      totalProductionCost: totals.totalProductionCost,
      sellingPrice: totals.totalSellingPrice,
      profitLoss: totals.profitLoss,
      profitLossPercent: totals.profitLossPercent,
      costingImage,
      status: 'Pending',
      jobCardNo: ''
    };

    onSave(matchingOrders.map(o => o.id), historyRecord);
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Full Kitting Check & Costing"
      onSubmit={handleSave}
      submitText="Save to Kitting History"
      cancelText="Cancel"
      maxWidth="max-w-6xl"
    >
      <div className="space-y-5 min-h-[380px]">
        
        {/* Dropdown & Text selectors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Product name *</label>
            <SearchableDropdown
              options={productNamesOptions}
              value={selectedProductName}
              onChange={setSelectedProductName}
              placeholder="Search Product Name"
              className="w-full"
              height="h-[36px]"
              rounded="rounded"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">S No</label>
            <input
              type="text"
              value={sNoText}
              className="w-full px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-500 font-semibold rounded cursor-not-allowed text-xs h-[36px] outline-none text-center"
              readOnly
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Plan Qty</label>
            <input
              type="text"
              value={planQtyText}
              className="w-full px-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-500 font-semibold rounded cursor-not-allowed text-xs h-[36px] outline-none text-center"
              readOnly
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Total Plan Qty</label>
            <input
              type="text"
              value={totalQty ? totalQty.toLocaleString('en-IN') : '0'}
              className="w-full px-3 py-1.5 border border-indigo-200 bg-indigo-50 text-indigo-700 font-black rounded cursor-not-allowed text-xs h-[36px] outline-none text-center"
              readOnly
            />
          </div>
        </div>

        {selectedOrder && (
          <>
            {/* BOM Table */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">BOM Components Required</h4>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-black text-[10px] uppercase transition active:scale-95 border border-indigo-200"
                >
                  <Plus size={11} />
                  <span>Add Extra Material</span>
                </button>
              </div>
              <div className="border border-indigo-50 rounded-lg overflow-hidden shadow-sm bg-white overflow-x-auto">
                <table className="w-full min-w-[700px] text-xs">
                  <thead className="bg-slate-50 border-b border-indigo-50">
                    <tr className="text-slate-600 font-semibold uppercase">
                      <th className="px-4 py-2.5 text-center w-12">Select</th>
                      <th className="px-4 py-2.5 text-center">Required BOM(Raw Material Name)</th>
                      <th className="px-4 py-2.5 text-center">Raw Qty</th>
                      <th className="px-4 py-2.5 text-center">Raw Cost</th>
                      <th className="px-4 py-2.5 text-center">Available Raw Qty</th>
                      <th className="px-4 py-2.5 text-center">Indent Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50">
                    {editedTableData.length > 0 ? (
                      editedTableData.map((row, index) => {
                        const isShortage = row.indentQty > 0;
                        return (
                          <tr key={index} className={`transition-all duration-200 ${row.checked ? 'bg-emerald-50/20 text-slate-400 opacity-60' : 'hover:bg-slate-50/50'}`}>
                            {/* Checkbox selector column in start */}
                            <td className="px-4 py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={row.checked || false}
                                onChange={(e) => handleCellChange(index, 'checked', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer transition-transform active:scale-95"
                                title="Mark as Checked"
                              />
                            </td>
                            {/* Required BOM(Raw Material Name) */}
                            <td className="px-4 py-2.5 text-center font-medium text-slate-900">
                              {row.isCustom ? (
                                <select
                                  value={row.rawName}
                                  onChange={(e) => handleSelectRawMaterial(index, e.target.value)}
                                  className="w-full max-w-[200px] px-2 py-1 border border-gray-200 rounded text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs font-semibold text-slate-800 bg-white inline-block"
                                  required
                                >
                                  <option value="">-- Select Material --</option>
                                  {uniqueRawMaterials.map((m, mIdx) => (
                                    <option key={mIdx} value={m.rawItemName}>{m.rawItemName}</option>
                                  ))}
                                </select>
                              ) : (
                                `${row.rawName} (${row.itemCode})`
                              )}
                            </td>
                            {/* Raw Qty */}
                            <td className="px-4 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.0001"
                                  value={row.rawQty}
                                  onChange={(e) => handleCellChange(index, 'rawQty', e.target.value)}
                                  className="w-24 px-2 py-1 border border-gray-200 rounded text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs font-bold text-indigo-600 bg-white"
                                  required
                                />
                                <span className="text-gray-400 font-semibold">{row.unit}</span>
                              </div>
                            </td>
                            {/* Raw Cost */}
                            <td className="px-4 py-2.5 text-center">
                              <div className="relative inline-block w-28">
                                <span className="absolute left-2 top-1 text-gray-400 font-semibold">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={row.rawCost}
                                  onChange={(e) => handleCellChange(index, 'rawCost', e.target.value)}
                                  className="w-full pl-6 pr-2 py-1 border border-gray-200 rounded text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs font-bold text-slate-700 bg-white"
                                  required
                                />
                              </div>
                            </td>
                            {/* Available Raw Qty */}
                            <td className="px-4 py-2.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.0001"
                                  value={row.availableQty}
                                  onChange={(e) => handleCellChange(index, 'availableQty', e.target.value)}
                                  className="w-24 px-2 py-1 border border-gray-200 rounded text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-slate-600 font-semibold bg-white"
                                  required
                                />
                                <span className="text-gray-400 font-semibold">{row.unit}</span>
                              </div>
                            </td>
                            {/* Indent Qty */}
                            <td className="px-4 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                                isShortage ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {row.indentQty > 0 ? `${row.indentQty} ${row.unit}` : 'Nil'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-6 text-center text-slate-400 font-medium bg-slate-50/30">
                          No BOM components configured. Click "Add Extra Material" to add custom rows.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Costing Inputs & Calculations */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Costing & Financials</h4>
              
              {/* Inputs row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* FG Available Qty Input */}
                <div className="space-y-1">
                  <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">FG Available Qty *</label>
                  <input
                    type="number"
                    min="0"
                    value={fgAvailableQty}
                    onChange={(e) => setFgAvailableQty(e.target.value)}
                    placeholder="Enter finished goods available qty"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
                    required
                  />
                  <span className="text-[10px] text-gray-400 block font-medium">Available finished stock quantity in godown.</span>
                </div>

                {/* Extra Amount Input */}
                <div className="space-y-1">
                  <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Extra Amount *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-[9px] text-gray-400 font-semibold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={extraAmount}
                      onChange={(e) => {
                        setExtraAmount(e.target.value);
                        setIsExtraManuallyEdited(true);
                      }}
                      placeholder="Enter extra production cost"
                      className="w-full pl-6 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 block font-medium">Adds labor, processing, and handling overhead.</span>
                </div>

                {/* Selling Price Input */}
                <div className="space-y-1">
                  <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Selling Price *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-[9px] text-gray-400 font-semibold text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      placeholder="Enter total selling price"
                      className="w-full pl-6 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 block font-medium">Total selling price for the planned quantity.</span>
                </div>

              </div>

              {/* Calculations and SVG Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/50">
                
                {/* Financial calculations */}
                <div className="space-y-2 text-xs text-slate-700 font-semibold bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span>Total Raw Required Qty:</span>
                    <span className="text-indigo-600 font-bold">{Number(totals.totalRawRequiredQty).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span>Total Raw Cost:</span>
                    <span className="text-slate-900 font-bold">₹{totals.totalRawCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span>Total Production Cost:</span>
                    <span className="text-indigo-600 font-bold">₹{totals.totalProductionCost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span>Profit / Loss Amount:</span>
                    <span className={`font-black ${totals.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{totals.profitLoss.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5">
                    <span>Profit / Loss %:</span>
                    <span className={`font-black ${totals.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {totals.profitLossPercent}%
                    </span>
                  </div>
                </div>

                {/* Dynamic Cost breakdown SVG preview */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center p-4">
                  <img 
                    src={generateCostingImage(totals)} 
                    alt="Cost breakdown SVG preview" 
                    className="w-full max-h-[80px]"
                  />
                </div>

              </div>
            </div>
          </>
        )}

      </div>
    </ModalForm>
  );
}
