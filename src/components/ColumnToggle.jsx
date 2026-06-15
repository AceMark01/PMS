import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';

export default function ColumnToggle({ headers, visibleColumns, onToggleColumn }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 md:py-2 text-xs md:text-sm hover:bg-gray-50 hover:text-slate-900 transition-all shadow-sm flex-shrink-0 h-[32px] md:h-[38px]"
        title="Toggle Column Visibility"
      >
        <SlidersHorizontal size={14} className="text-gray-500" />
        <span className="font-semibold hidden sm:inline">Columns</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2 max-h-72 overflow-y-auto ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 pb-2 mb-1.5 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Visible Columns</span>
          </div>
          <div className="space-y-0.5 px-1">
            {headers.map((header) => {
              if (header === 'Action') return null;
              
              const isVisible = visibleColumns.includes(header);
              return (
                <button
                  key={header}
                  type="button"
                  onClick={() => onToggleColumn(header)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <span className="truncate">{header}</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isVisible 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {isVisible && <Check size={10} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
