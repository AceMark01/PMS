import React, { useState, useEffect } from 'react';
import ModalForm from '../../components/ModalForm';
import { DollarSign, ShieldCheck, Ban } from 'lucide-react';

export default function ApprovalForm({ isOpen, onClose, onApprove, record }) {
  const [status, setStatus] = useState('Approved');
  const [remarks, setRemarks] = useState('');

  // Reset form inputs when record changes or when opened
  useEffect(() => {
    if (isOpen) {
      setStatus('Approved');
      setRemarks('');
    }
  }, [isOpen, record]);

  if (!record) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onApprove(record.id, status, remarks.trim());
  };

  const isProfit = record.profitLoss >= 0;

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Kitting & Costing Approval Review"
      onSubmit={handleSubmit}
      submitText="Submit Approval Decision"
      cancelText="Cancel Review"
      maxWidth="max-w-4xl"
      maxHeight="90vh"
    >
      <div className="space-y-4">
        {/* Costing card summary info */}
        <div className="bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/50 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Costing Card Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Product Name</span>
              <span className="text-gray-900 font-extrabold uppercase">{record.productName}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Product Code</span>
              <span className="text-indigo-600 font-extrabold">{record.productCode}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">S No</span>
              <span className="text-gray-700 font-semibold">{record.sNo}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Order Qty</span>
              <span className="text-gray-900 font-extrabold">{record.qty} pcs</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Production Cost</span>
              <span className="text-slate-900 font-extrabold">₹{Number(record.totalProductionCost).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Selling Price</span>
              <span className="text-slate-900 font-extrabold">₹{Number(record.sellingPrice).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Profit / Loss</span>
              <span className={`font-black ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                ₹{Number(record.profitLoss).toLocaleString('en-IN')} ({Number(record.profitLossPercent).toFixed(1)}%)
              </span>
            </div>
            <div>
              <span className="text-gray-400 block uppercase text-[9px] font-bold">Timestamp</span>
              <span className="text-gray-500 font-medium">{record.timestamp}</span>
            </div>
          </div>

          {/* Raw Materials summary list */}
          <div className="border-t border-indigo-100/50 pt-2 text-xs">
            <span className="text-gray-400 block uppercase text-[9px] font-bold mb-1">Raw Materials Needed</span>
            <div className="text-slate-700 max-h-24 overflow-y-auto bg-white p-2 rounded border border-indigo-50 font-medium">
              <span className="font-semibold text-indigo-600">Items: </span>{record.rawNames}
              <br />
              <span className="font-semibold text-indigo-600">Quantities: </span>{record.rawQuantities}
            </div>
          </div>

          {/* SVG Cost breakdown image */}
          {record.costingImage && (
            <div className="flex justify-center bg-white rounded-lg p-2 border border-slate-100 shadow-sm max-h-[60px] overflow-hidden">
              <img src={record.costingImage} alt="Cost Breakdown Chart" className="max-h-[48px] w-auto" />
            </div>
          )}
        </div>

        {/* Approval controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-slate-100 shadow-xs">
          
          {/* Status Decision */}
          <div className="space-y-1.5">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Approval Decision *</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('Approved')}
                className={`flex-1 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 border text-xs font-black transition active:scale-95 ${
                  status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck size={14} />
                <span>Approve</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('Rejected')}
                className={`flex-1 py-1.5 px-3 rounded flex items-center justify-center gap-1.5 border text-xs font-black transition active:scale-95 ${
                  status === 'Rejected'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-slate-50'
                }`}
              >
                <Ban size={14} />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Remarks/Notes */}
          <div className="space-y-1.5">
            <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Remarks/Notes</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Internal notes/rejection reason"
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
            />
          </div>

        </div>
      </div>
    </ModalForm>
  );
}
