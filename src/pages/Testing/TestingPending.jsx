import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import { Play } from 'lucide-react';

export default function TestingPending({ data, onOpenTestingForm }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedPending = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "Action",
    "Timestamp",
    "JC-Job Card",
    "S NO",
    "ProductCode",
    "ProductName",
    "Order Quantity",
    "Date Of Production",
    "Approval Status",
    "Approval Remarks",
    "Raw Name1",
    "Raw Name2",
    "Raw Name3",
    "Raw Name4",
    "Raw Name5",
    "Raw Name6",
    "Raw Name7",
    "Raw Name8",
    "Raw Name9",
    "Raw Name10",
    "Raw Qty1",
    "Raw Qty2",
    "Raw Qty3",
    "Raw Qty4",
    "Raw Qty5",
    "Raw Qty6",
    "Raw Qty7",
    "Raw Qty8",
    "Raw Qty9",
    "Raw Qty10"
  ];

  const renderRow = (item, idx) => {
    return (
      <tr key={item.id || idx} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
        {/* Action: Open Testing form */}
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <button
            onClick={() => onOpenTestingForm(item.id)}
            className="px-2.5 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all active:scale-95 inline-flex items-center gap-1 font-bold text-[10px] shadow-xs"
            title="Perform Testing Review"
          >
            <Play size={10} className="fill-current" />
            <span>Review</span>
          </button>
        </td>
        {/* Timestamp */}
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{item.timestamp}</td>
        {/* JC-Job Card */}
        <td className="px-4 py-3 text-center text-xs font-extrabold text-slate-800 whitespace-nowrap">
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[11px] font-black">
            {item.jobCardNo}
          </span>
        </td>
        {/* S NO */}
        <td className="px-4 py-3 text-center text-xs text-gray-600 font-semibold">{item.sNo}</td>
        {/* ProductCode */}
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold">{item.productCode}</td>
        {/* ProductName */}
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase min-w-[200px] break-words whitespace-normal">{item.productName}</td>
        {/* Order Quantity */}
        <td className="px-4 py-3 text-center text-xs text-slate-800 font-semibold">{item.qty} pcs</td>
        {/* Date Of Production */}
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-bold whitespace-nowrap">{item.dateOfProduction}</td>
        {/* Approval Status */}
        <td className="px-4 py-3 text-center text-xs whitespace-nowrap">
          <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
            {item.approvalStatus}
          </span>
        </td>
        {/* Approval Remarks */}
        <td className="px-4 py-3 text-center text-xs text-gray-500 min-w-[150px] whitespace-normal break-words">{item.approvalRemarks || '-'}</td>
        
        {/* Raw Names 1-10 */}
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.rawName1 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.rawName2 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.rawName3 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.rawName4 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.rawName5 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.rawName6 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.rawName7 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.rawName8 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.rawName9 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-slate-600 whitespace-nowrap">{item.rawName10 || '-'}</td>
        
        {/* Raw Qtys 1-10 */}
        <td className="px-4 py-3 text-center text-[11px] text-indigo-600 font-bold whitespace-nowrap">{item.rawQty1 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-indigo-600 font-bold whitespace-nowrap">{item.rawQty2 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-indigo-600 font-bold whitespace-nowrap">{item.rawQty3 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-indigo-600 font-bold whitespace-nowrap">{item.rawQty4 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-indigo-600 font-bold whitespace-nowrap">{item.rawQty5 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-indigo-600 font-bold whitespace-nowrap">{item.rawQty6 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-indigo-600 font-bold whitespace-nowrap">{item.rawQty7 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-indigo-600 font-bold whitespace-nowrap">{item.rawQty8 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-indigo-600 font-bold whitespace-nowrap">{item.rawQty9 || '-'}</td>
        <td className="px-4 py-3 text-center text-[11px] text-indigo-600 font-bold whitespace-nowrap">{item.rawQty10 || '-'}</td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    return (
      <div key={item.id || idx} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
              #{item.sNo}
            </span>
            <span className="text-xs font-bold text-gray-900 uppercase">{item.productName}</span>
          </div>
          <button
            onClick={() => onOpenTestingForm(item.id)}
            className="px-2 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-[9px] font-black"
          >
            Review
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] bg-slate-50 rounded-lg p-2.5 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-black">JC-Job Card</span>
            <span className="text-slate-800 font-extrabold">{item.jobCardNo}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-black">Date of Prod.</span>
            <span className="text-slate-900 font-bold">{item.dateOfProduction}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedPending}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="2800px" // Same as production history width
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={data.length}
          itemsPerPageOptions={[50, 100, 200, 500]}
        />
      </div>
    </div>
  );
}
