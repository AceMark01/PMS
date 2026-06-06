import React, { useState, useEffect } from 'react';
import ModalForm from '../../components/ModalForm';
import { Calendar, ShieldCheck, Ban, FileText } from 'lucide-react';

export default function TestingForm({ isOpen, onClose, onSubmitTesting, record }) {
  const [testingStatus, setTestingStatus] = useState('Approved');
  const [testingRemarks, setTestingRemarks] = useState('');
  const [testingDate, setTestingDate] = useState('');

  // Reset/Initialize values when modal opens or record changes
  useEffect(() => {
    if (isOpen) {
      setTestingStatus('Approved');
      setTestingRemarks('');
      const today = new Date().toISOString().split('T')[0];
      setTestingDate(today);
    }
  }, [isOpen, record]);

  if (!record) return null;

  // Extract raw materials 1-10 from record
  const raws = [];
  for (let i = 1; i <= 10; i++) {
    const name = record[`rawName${i}`];
    const qty = record[`rawQty${i}`];
    if (name || qty) {
      raws.push({ name: name || '-', qty: qty || '-' });
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    const testingRecord = {
      id: `tst-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }),
      // Reference to actual production ID
      productionRecordId: record.id,
      // Carry over all columns from actual production history
      jobCardNo: record.jobCardNo,
      sNo: record.sNo,
      productCode: record.productCode,
      productName: record.productName,
      qty: record.qty,
      dateOfProduction: record.dateOfProduction,
      approvalStatus: record.approvalStatus,
      approvalRemarks: record.approvalRemarks,
      // Raw Materials 1-10
      rawName1: record.rawName1 || '',
      rawName2: record.rawName2 || '',
      rawName3: record.rawName3 || '',
      rawName4: record.rawName4 || '',
      rawName5: record.rawName5 || '',
      rawName6: record.rawName6 || '',
      rawName7: record.rawName7 || '',
      rawName8: record.rawName8 || '',
      rawName9: record.rawName9 || '',
      rawName10: record.rawName10 || '',
      rawQty1: record.rawQty1 || '',
      rawQty2: record.rawQty2 || '',
      rawQty3: record.rawQty3 || '',
      rawQty4: record.rawQty4 || '',
      rawQty5: record.rawQty5 || '',
      rawQty6: record.rawQty6 || '',
      rawQty7: record.rawQty7 || '',
      rawQty8: record.rawQty8 || '',
      rawQty9: record.rawQty9 || '',
      rawQty10: record.rawQty10 || '',
      // Testing fields
      testingDate,
      testingStatus,
      testingRemarks: testingRemarks.trim()
    };

    onSubmitTesting(record.id, testingRecord);
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Quality Assurance & Testing Review"
      onSubmit={handleSubmit}
      submitText="Submit Testing Decision"
      cancelText="Cancel Review"
      maxWidth="max-w-4xl"
      maxHeight="90vh"
    >
      <div className="space-y-4">
        {/* Production Details Summary card */}
        <div className="bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/50 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Production Log Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">JC-Job Card</span>
              <span className="text-indigo-600 font-extrabold uppercase bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100 inline-block">
                {record.jobCardNo}
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
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Quantity Produced</span>
              <span className="text-gray-900 font-extrabold">{record.qty} pcs</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Date of Production</span>
              <span className="text-slate-900 font-bold">{record.dateOfProduction}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Kitting Status</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] uppercase inline-block">
                {record.approvalStatus || 'Approved'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Production Log Time</span>
              <span className="text-gray-500 font-medium">{record.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Read-only raw materials breakdown table */}
        <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-xs space-y-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={14} className="text-indigo-600" />
            <span>Raw Materials Component Breakdown</span>
          </h4>
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-gray-500 uppercase text-[9px] font-black">
                  <th className="px-3 py-2 text-center w-12 border-r border-slate-150">Index</th>
                  <th className="px-3 py-2">Raw Material Name</th>
                  <th className="px-3 py-2 text-center w-48">Raw Qty used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {raws.length > 0 ? (
                  raws.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 text-center text-gray-400 font-bold border-r border-slate-100">#{idx + 1}</td>
                      <td className="px-3 py-2 text-slate-800 font-semibold">{item.name}</td>
                      <td className="px-3 py-2 text-center text-indigo-600 font-bold">{item.qty}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-center text-gray-400 font-semibold bg-slate-50/30">
                      No raw materials components recorded for this production log.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Testing Review Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-slate-100 shadow-xs">
          
          {/* Testing Decision */}
          <div className="space-y-1.5">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Testing Decision *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTestingStatus('Approved')}
                className={`flex-1 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 border text-xs font-black transition active:scale-95 ${
                  testingStatus === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck size={14} />
                <span>Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setTestingStatus('Rejected')}
                className={`flex-1 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 border text-xs font-black transition active:scale-95 ${
                  testingStatus === 'Rejected'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-slate-50'
                }`}
              >
                <Ban size={14} />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Testing Date */}
          <div className="space-y-1.5">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Date Of Testing *</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
              <input
                type="date"
                value={testingDate}
                onChange={(e) => setTestingDate(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
                required
              />
            </div>
          </div>

          {/* Testing Remarks */}
          <div className="space-y-1.5">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Remarks/Notes</label>
            <input
              type="text"
              value={testingRemarks}
              onChange={(e) => setTestingRemarks(e.target.value)}
              placeholder="e.g. Passed electrical QA testing"
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
            />
          </div>

        </div>
      </div>
    </ModalForm>
  );
}
