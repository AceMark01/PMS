import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import { Trash2, FileText } from 'lucide-react';

export default function ApprovalHistory({ data, onDeleteHistory, visibleColumns = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const nonHeaders = data.filter(item => item && item.sNo && item.sNo.toString().trim() !== '');

  const totalPages = Math.ceil(nonHeaders.length / itemsPerPage);
  const paginatedHistory = nonHeaders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const allHeaders = [
    "Action",
    "JOB Card No.",
    "S NO",
    "Timestamp",
    "Product code",
    "Product Name",
    "BAse Cat",
    "Order Quantity",
    "Raw Names",
    "Raw Quantities",
    "FG Available Qty",
    "Total Raw Required Qty",
    "Total Raw Cost",
    "Extra Amount",
    "Total Production Cost",
    "Selling Price",
    "Profit / Loss Amount",
    "Profit / Loss %",
    "Status",
    "Costing PDF"
  ];

  const tableHeaders = allHeaders.filter(h => h === 'Action' || visibleColumns.includes(h));

  const renderRow = (item, idx) => {
    const isProfit = item.profitLoss >= 0;
    const isApproved = item.status === 'Approved';
    return (
      <tr key={item.id || idx} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
        {/* Action: Delete record */}
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <button
            onClick={() => onDeleteHistory(item.id)}
            className="p-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition-all active:scale-95 inline-flex items-center justify-center"
            title="Delete History Record"
          >
            <Trash2 size={15} />
          </button>
        </td>
        {/* JOB Card No. */}
        <td className="px-4 py-3 text-center text-xs font-extrabold text-slate-800 whitespace-nowrap">
          {item.jobCardNo ? (
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded font-black text-[11px]">
              {item.jobCardNo}
            </span>
          ) : (
            <span className="text-gray-400 font-semibold">-</span>
          )}
        </td>
        {/* S NO */}
        <td className="px-4 py-3 text-center text-xs text-gray-600 font-semibold">{item.sNo}</td>
        {/* Timestamp */}
        <td className="px-4 py-3 text-center text-xs text-gray-505 text-gray-500 whitespace-nowrap">{item.timestamp}</td>
        {/* Product code */}
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold">{item.productCode}</td>
        {/* Product Name */}
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase min-w-[200px] break-words whitespace-normal">{item.productName}</td>
        {/* BAse Cat */}
        <td className="px-4 py-3 text-center text-[11px] text-gray-600">{item.baseCat}</td>
        {/* Order Quantity */}
        <td className="px-4 py-3 text-center text-xs text-slate-800 font-medium">{item.qty}</td>
        {/* Raw Names */}
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 min-w-[220px] whitespace-normal break-words">{item.rawNames}</td>
        {/* Raw Quantities */}
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 min-w-[150px] whitespace-normal break-words">{item.rawQuantities}</td>
        {/* FG Available Qty */}
        <td className="px-4 py-3 text-center text-xs text-slate-600">{item.fgAvailableQty || 0}</td>
        {/* Total Raw Required Qty */}
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold">{Number(item.totalRawRequiredQty).toFixed(3)}</td>
        {/* Total Raw Cost */}
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-bold">₹{Number(item.totalRawCost).toLocaleString('en-IN')}</td>
        {/* Extra Amount */}
        <td className="px-4 py-3 text-center text-xs text-amber-600 font-semibold">₹{Number(item.extraAmount).toLocaleString('en-IN')}</td>
        {/* Total Production Cost */}
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-extrabold">₹{Number(item.totalProductionCost).toLocaleString('en-IN')}</td>
        {/* Selling Price */}
        <td className="px-4 py-3 text-center text-xs text-slate-800 font-bold">₹{Number(item.sellingPrice).toLocaleString('en-IN')}</td>
        {/* Profit / Loss Amount */}
        <td className={`px-4 py-3 text-center text-xs font-black ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
          ₹{Number(item.profitLoss).toLocaleString('en-IN')}
        </td>
        {/* Profit / Loss % */}
        <td className={`px-4 py-3 text-center text-xs font-black ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
          {Number(item.profitLossPercent).toFixed(2)}%
        </td>
        {/* Status */}
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${isApproved
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
            {item.status}
          </span>
        </td>
        {/* Costing PDF */}
        <td className="px-4 py-3 text-center min-w-[150px]">
          {item.pdfLink ? (
            <a
              href={item.pdfLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-all font-bold text-[10px] inline-flex items-center gap-1 border border-indigo-200"
            >
              <FileText size={12} />
              <span>View PDF</span>
            </a>
          ) : (
            <span className="text-[10px] text-gray-400">N/A</span>
          )}
        </td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    const isApproved = item.status === 'Approved';
    return (
      <div key={item.id || idx} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
              #{item.sNo}
            </span>
            <span className="text-xs font-bold text-gray-900 uppercase">{item.productName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
              {item.status}
            </span>
            <button
              onClick={() => onDeleteHistory(item.id)}
              className="p-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition"
              title="Delete History Record"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] bg-slate-50 rounded-lg p-2.5 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-black">JOB Card No.</span>
            <span className="text-slate-800 font-extrabold">{item.jobCardNo || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Total Cost</span>
            <span className="text-slate-900 font-bold">₹{item.totalProductionCost.toLocaleString('en-IN')}</span>
          </div>
          {item.pdfLink && (
            <div className="col-span-2 border-t border-slate-100 pt-2 flex justify-center">
              <a
                href={item.pdfLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition text-[10px] font-bold flex items-center justify-center gap-1 border border-indigo-150"
              >
                <FileText size={12} />
                <span>View PDF Report</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          allHeaders={allHeaders}
          visibleColumns={visibleColumns}
          data={paginatedHistory}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1750px" // More columns requires wider table width
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={nonHeaders.length}
          itemsPerPageOptions={[50, 100, 200, 500]}
        />
      </div>
    </div>
  );
}
