import React, { useState, useEffect } from 'react';
import ModalForm from '../../components/ModalForm';
import SearchableDropdown from '../../components/SearchableDropdown';
import { Box, Layers, Database, Calculator } from 'lucide-react';

export default function AddOrder({ isOpen, onClose, onSave, masterItems }) {
  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    baseCat: '',
    qty: '',
    godown: 'Main Godown'
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        productCode: '',
        productName: '',
        baseCat: '',
        qty: '',
        godown: 'Main Godown'
      });
    }
  }, [isOpen]);

  const handleProductCodeSelect = (code) => {
    const item = masterItems.find(i => i.code === code);
    if (item) {
      setFormData(prev => ({
        ...prev,
        productCode: code,
        productName: item.name,
        baseCat: item.category
      }));
    }
  };

  const handleProductNameSelect = (name) => {
    const item = masterItems.find(i => i.name === name);
    if (item) {
      setFormData(prev => ({
        ...prev,
        productCode: item.code,
        productName: name,
        baseCat: item.category
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.productCode || !formData.qty || !formData.godown) {
      return; // Handled by standard HTML5 validation
    }

    onSave({
      productCode: formData.productCode,
      productName: formData.productName,
      baseCat: formData.baseCat,
      qty: Number(formData.qty),
      godown: formData.godown
    });
  };

  const godownOptions = [
    { value: 'Main Godown', label: 'Main Godown' },
    { value: 'Secondary Godown', label: 'Secondary Godown' },
    { value: 'Factory Warehouse', label: 'Factory Warehouse' },
    { value: 'Transit Godown', label: 'Transit Godown' }
  ];

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Create Production Order"
      onSubmit={handleSubmit}
      submitText="Save"
      cancelText="Cancel"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Product Code Search Dropdown */}
        <div className="space-y-1">
          <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">
            Product Code *
          </label>
          <SearchableDropdown
            options={masterItems.map(item => ({ value: item.code, label: item.code }))}
            value={formData.productCode}
            onChange={handleProductCodeSelect}
            placeholder="Select Product Code"
            className="w-full"
            height="h-[36px]"
            rounded="rounded"
          />
        </div>

        {/* Product Name Search Dropdown */}
        <div className="space-y-1">
          <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">
            Product Name *
          </label>
          <SearchableDropdown
            options={masterItems.map(item => ({ value: item.name, label: item.name }))}
            value={formData.productName}
            onChange={handleProductNameSelect}
            placeholder="Select Product Name"
            className="w-full"
            height="h-[36px]"
            rounded="rounded"
          />
        </div>

        {/* Base Cat (Category) Readonly */}
        <div className="space-y-1">
          <label className="block text-[11px] md:text-[13px] text-gray-400 uppercase tracking-tight font-semibold">
            Base Cat (Pre-fill)
          </label>
          <div className="relative">
            <Layers className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
            <input
              type="text"
              value={formData.baseCat}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded cursor-not-allowed text-xs h-[36px] outline-none"
              readOnly
              placeholder="-"
            />
          </div>
        </div>

        {/* Order Quantity */}
        <div className="space-y-1">
          <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">
            Order Quantity *
          </label>
          <div className="relative">
            <Calculator className="absolute left-2.5 top-[9px] text-gray-400" size={14} />
            <input
              type="number"
              min="1"
              value={formData.qty}
              onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
              placeholder="Enter Quantity"
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
              required
            />
          </div>
        </div>

        {/* Godown SearchableDropdown */}
        <div className="space-y-1">
          <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">
            Godown *
          </label>
          <SearchableDropdown
            options={godownOptions}
            value={formData.godown}
            onChange={(val) => setFormData({ ...formData, godown: val })}
            placeholder="Select Godown"
            className="w-full"
            height="h-[36px]"
            rounded="rounded"
          />
        </div>
      </div>
    </ModalForm>
  );
}
