import React, { useState, useEffect, useMemo } from 'react';
import ModalForm from '../../components/ModalForm';
import { Calendar, Tag, ShieldCheck, FileText, Plus, X } from 'lucide-react';

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function ActualProductionForm({ isOpen, onClose, onSubmitProduction, record, bomRecords, inventoryRecords }) {
  const [dateOfProduction, setDateOfProduction] = useState('');
  const [editedRaws, setEditedRaws] = useState([]);

  // Load unique raw materials list for dropdown options from pre-fetched bom and inventory records
  const uniqueRawMaterials = useMemo(() => {
    const unique = new Set();
    
    // Add raw item names from BOM sheet
    if (bomRecords && Array.isArray(bomRecords)) {
      bomRecords.forEach(rm => {
        if (rm.rawItemName && rm.rawItemName.trim()) {
          unique.add(rm.rawItemName.trim());
        }
      });
    }
    
    // Add product names from Live IMS sheet
    if (inventoryRecords && Array.isArray(inventoryRecords)) {
      inventoryRecords.forEach(item => {
        if (item.productName && item.productName.trim()) {
          unique.add(item.productName.trim());
        }
      });
    }
    
    return Array.from(unique).sort();
  }, [bomRecords, inventoryRecords]);

  // Set default date to today in YYYY-MM-DD
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setDateOfProduction(today);
    }
  }, [isOpen]);

  // Load and parse initial raw materials from kitting record (JOB CARD columns J-AC)
  useEffect(() => {
    if (isOpen && record) {
      console.log("ActualProductionForm: record loaded:", record);
      console.log("ActualProductionForm: uniqueRawMaterials in dropdown:", uniqueRawMaterials);
      
      const initial = [];
      for (let i = 1; i <= 10; i++) {
        const nameVal = record[`rawName${i}`] || (record.__rowValues && record.__rowValues[8 + i]) || '';
        const qtyVal = record[`rawQty${i}`] || (record.__rowValues && record.__rowValues[18 + i]) || '';
        
        console.log(`Index ${i}: nameVal = "${nameVal}", qtyVal = "${qtyVal}"`);
        
        if (nameVal || qtyVal) {
          initial.push({
            name: nameVal.toString().trim(),
            qty: qtyVal.toString().trim()
          });
        }
      }

      console.log("ActualProductionForm: initial parsed from columns:", initial);

      // Fallback to costing history raw names/quantities if JOB CARD has no raw materials
      if (initial.length === 0) {
        console.log("ActualProductionForm: JOB CARD raw columns empty, falling back to costing history fields");
        const rawNamesArr = record.rawNames ? record.rawNames.split(',').map(n => n.trim()) : [];
        const rawQtysArr = record.rawQuantities ? record.rawQuantities.split(',').map(q => q.trim()) : [];
        const maxLength = Math.max(rawNamesArr.length, rawQtysArr.length);
        for (let i = 0; i < maxLength; i++) {
          if (rawNamesArr[i] || rawQtysArr[i]) {
            initial.push({
              name: rawNamesArr[i] || '',
              qty: rawQtysArr[i] || ''
            });
          }
        }
        console.log("ActualProductionForm: initial parsed from fallback:", initial);
      }

      setEditedRaws(initial);
    }
  }, [isOpen, record, uniqueRawMaterials]);

  if (!record) return null;

  const handleCellChange = (index, field, value) => {
    const updated = editedRaws.map((row, idx) => {
      if (idx === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setEditedRaws(updated);
  };

  const handleAddRow = () => {
    if (editedRaws.length >= 10) {
      alert('You can add a maximum of 10 raw materials.');
      return;
    }
    setEditedRaws(prev => [
      ...prev,
      { name: '', qty: '' }
    ]);
  };

  const handleDeleteRow = (index) => {
    const updated = editedRaws.filter((_, idx) => idx !== index);
    setEditedRaws(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Construct the production record mapping exactly to the 10 raw names and quantities schema
    const productionRecord = {
      id: `ap-${Date.now()}`,
      timestamp: formatDate(new Date()),
      jobCardNo: '',
      jCJobCard: '',
      'jC-JobCard': '',
      jcJobCard: '',
      sNo: record.sNo,
      productCode: record.productCode,
      productName: record.productName,
      qty: Number(record.qty) || 0,
      productionQuantity: Number(record.qty) || 0,
      dateOfProduction,
      approvalStatus: record.status || 'Approved',
      approvalRemarks: record.remarks || '',
      // Map up to 10 raw material names
      rawName1: editedRaws[0]?.name || '',
      rawName2: editedRaws[1]?.name || '',
      rawName3: editedRaws[2]?.name || '',
      rawName4: editedRaws[3]?.name || '',
      rawName5: editedRaws[4]?.name || '',
      rawName6: editedRaws[5]?.name || '',
      rawName7: editedRaws[6]?.name || '',
      rawName8: editedRaws[7]?.name || '',
      rawName9: editedRaws[8]?.name || '',
      rawName10: editedRaws[9]?.name || '',
      // Map up to 10 raw material quantities
      rawQty1: editedRaws[0]?.qty || '',
      rawQty2: editedRaws[1]?.qty || '',
      rawQty3: editedRaws[2]?.qty || '',
      rawQty4: editedRaws[3]?.qty || '',
      rawQty5: editedRaws[4]?.qty || '',
      rawQty6: editedRaws[5]?.qty || '',
      rawQty7: editedRaws[6]?.qty || '',
      rawQty8: editedRaws[7]?.qty || '',
      rawQty9: editedRaws[8]?.qty || '',
      rawQty10: editedRaws[9]?.qty || ''
    };

    onSubmitProduction(record.id, productionRecord);
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Record Actual Production Log"
      onSubmit={handleSubmit}
      submitText="Submit Production Log"
      cancelText="Cancel"
      maxWidth="max-w-4xl"
      maxHeight="90vh"
    >
      <div className="space-y-4">
        {/* Core Order & Approval details */}
        <div className="bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/50 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Kitting Approval Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">JC-Job Card</span>
              <span className="text-indigo-600 font-extrabold uppercase bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100 inline-block">
                (Auto Generated)
              </span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">S No</span>
              <span className="text-gray-700 font-semibold">{record.sNo}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Product Code</span>
              <span className="text-slate-800 font-extrabold">{record.productCode}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Product Name</span>
              <span className="text-gray-900 font-extrabold uppercase">{record.productName}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Order Quantity</span>
              <span className="text-gray-900 font-extrabold">{record.qty} pcs</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Approval Status</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] uppercase">
                {record.status || 'Approved'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Approval Remarks</span>
              <span className="text-gray-600 font-medium">{record.remarks || '-'}</span>
            </div>
          </div>
        </div>

        {/* Date of Production Input */}
        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-xs">
          <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold mb-1.5">Date Of Production *</label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
            <input
              type="date"
              value={dateOfProduction}
              onChange={(e) => setDateOfProduction(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
              required
            />
          </div>
        </div>

        {/* BOM Component Breakdown */}
        <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-indigo-600" />
              <span>BOM Component Breakdown</span>
            </h4>
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-black text-[10px] uppercase transition active:scale-95 border border-indigo-200"
            >
              <Plus size={11} className="text-indigo-700" />
              <span>Add Extra Material</span>
            </button>
          </div>
          
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-gray-500 uppercase text-[9px] font-black">
                  <th className="px-3 py-2 text-center w-12 border-r border-slate-150">Index</th>
                  <th className="px-3 py-2">Raw Name</th>
                  <th className="px-3 py-2 text-center w-48">Raw Qty</th>
                  <th className="px-3 py-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {editedRaws.length > 0 ? (
                  editedRaws.map((item, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 text-center text-gray-400 font-bold border-r border-slate-100">#{idx + 1}</td>
                        <td className="px-3 py-2">
                          <select
                            value={item.name}
                            onChange={(e) => handleCellChange(idx, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-left focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs font-semibold text-slate-800 bg-white"
                            required
                          >
                            <option value="">-- Select Material --</option>
                            {item.name && !uniqueRawMaterials.includes(item.name) && (
                              <option value={item.name}>{item.name}</option>
                            )}
                            {uniqueRawMaterials.map((mName, mIdx) => (
                              <option key={mIdx} value={mName}>{mName}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.qty}
                            placeholder="e.g. 250 pcs"
                            onChange={(e) => handleCellChange(idx, 'qty', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs font-bold text-indigo-600 bg-white"
                            required
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1 text-red-600 hover:text-red-750 hover:bg-red-50 rounded transition"
                            title="Remove Material"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-gray-400 font-medium bg-slate-50/30">
                      No raw materials recorded. Click "Add Extra Material" to add.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ModalForm>
  );
}
