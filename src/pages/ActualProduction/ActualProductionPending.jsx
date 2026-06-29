import React, { useState } from 'react';
import DataTable from '../../components/DataTable';
import { Play } from 'lucide-react';

export default function ActualProductionPending({ data, onOpenProductionForm, visibleColumns = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedPending = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const allHeaders = [
    "Action",
    "S NO",
    "Timestamp",
    "Product code",
    "Product Name",
    "BAse Cat",
    "Order Quantity",
    "Godown",
    "Planned 2"
  ];

  const tableHeaders = allHeaders.filter(h => h === 'Action' || visibleColumns.includes(h));

  const renderRow = (item, idx) => {
    return (
      <tr key={item.id || idx} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100">
        {/* Action: Open Production log form */}
        <td className="px-4 py-3 text-center whitespace-nowrap text-xs">
          <button
            onClick={() => onOpenProductionForm(item.id)}
            className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all active:scale-95 inline-flex items-center gap-1 font-bold text-[10px] shadow-xs mx-auto"
            title="Log Actual Production"
          >
            <Play size={10} className="fill-current" />
            <span>Produce</span>
          </button>
        </td>
        {/* S NO */}
        <td className="px-4 py-3 text-center text-xs text-gray-600 font-semibold">{item.sNo}</td>
        {/* Timestamp */}
        <td className="px-4 py-3 text-center text-xs text-gray-500 whitespace-nowrap">{item.timestamp}</td>
        {/* Product code */}
        <td className="px-4 py-3 text-center text-xs text-indigo-600 font-bold whitespace-nowrap">{item.productCode}</td>
        {/* Product Name */}
        <td className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase min-w-[200px] break-words whitespace-normal">{item.productName}</td>
        {/* BAse Cat */}
        <td className="px-4 py-3 text-center text-[11px] text-gray-600">{item.baseCat}</td>
        {/* Order Quantity */}
        <td className="px-4 py-3 text-center text-xs text-slate-800 font-semibold">{item.qty} pcs</td>
        {/* Godown */}
        <td className="px-4 py-3 text-center text-xs text-slate-700 font-semibold uppercase">{item.godown}</td>
        {/* Planned 2 */}
        <td className="px-4 py-3 text-center text-xs text-slate-700 whitespace-nowrap">{item.planned2 || '-'}</td>
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
            onClick={() => onOpenProductionForm(item.id)}
            className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-black uppercase tracking-wider transition active:scale-95 flex items-center gap-1 shadow-xs"
          >
            <Play size={10} className="fill-current" />
            <span>Produce</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Timestamp</span>
            <span className="text-gray-700 font-medium">{item.timestamp}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Product Code</span>
            <span className="text-indigo-600 font-bold">{item.productCode}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Base Cat</span>
            <span className="text-gray-700 font-medium">{item.baseCat}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-black">Order Quantity</span>
            <span className="text-indigo-600 font-black">{item.qty} pcs</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Godown</span>
            <span className="text-gray-700 font-semibold uppercase">{item.godown}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Planned 2</span>
            <span className="text-gray-700 font-medium">{item.planned2 || '-'}</span>
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
          allHeaders={allHeaders}
          visibleColumns={visibleColumns}
          data={paginatedPending}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1000px"
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
