import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layers, X, Plus, Calendar, Tag, Box, DollarSign, Calculator, Trash2 } from 'lucide-react';
import SearchableDropdown from '../../components/SearchableDropdown';
import ModalForm from '../../components/ModalForm';
import { SEEDED_ITEMS } from '../../utils/seeds';
import { productionAPI } from '../../services/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function FullKittingForm({ isOpen, onClose, onSave, pendingOrders, initialOrderId }) {
  const [selectedProductName, setSelectedProductName] = useState('');
  const [sNoInput, setSNoInput] = useState('');
  const [extraAmount, setExtraAmount] = useState('0');
  const [isExtraManuallyEdited, setIsExtraManuallyEdited] = useState(false);
  const [fgAvailableQty, setFgAvailableQty] = useState('0');
  const [sellingPrice, setSellingPrice] = useState('0');

  const [rawMaterials, setRawMaterials] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [substituteBOMs, setSubstituteBOMs] = useState([]);
  const [loadingBOM, setLoadingBOM] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formContentRef = useRef(null);
  const printTemplateRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setLoadingBOM(true);
        try {
          const [bomResult, invResult, subResult] = await Promise.all([
            productionAPI.getSheetData('BOM'),
            productionAPI.getSheetData('Live IMS'),
            productionAPI.getSheetData('Substitute-BOM')
          ]);
          if (bomResult.success) {
            setRawMaterials(bomResult.records || []);
          } else {
            console.error('Failed to fetch BOM:', bomResult.error);
            toast.error('Failed to fetch BOM data');
          }
          if (invResult.success) {
            setInventoryList(invResult.records || []);
          } else {
            console.error('Failed to fetch Live IMS:', invResult.error);
            toast.error('Failed to fetch Live IMS data');
          }
          if (subResult.success) {
            setSubstituteBOMs(subResult.records || []);
          } else {
            console.error('Failed to fetch Substitute-BOM:', subResult.error);
            toast.error('Failed to fetch Substitute-BOM data');
          }
        } catch (err) {
          console.error('Error loading data:', err);
          toast.error('Failed to load data from server');
        } finally {
          setLoadingBOM(false);
        }
      };
      loadData();
    }
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

  const masterItems = SEEDED_ITEMS;

  // Unique list of product names from pendingOrders
  const productNamesOptions = useMemo(() => {
    const names = Array.from(new Set(pendingOrders.map(o => o.productName))).sort();
    return names.map(n => ({ value: n, label: n }));
  }, [pendingOrders]);

  // Change handler when Product name is selected
  const handleProductChange = (prodName) => {
    setSelectedProductName(prodName);
    if (prodName) {
      const filtered = pendingOrders.filter(o => o.productName === prodName);
      setSNoInput(filtered.map(o => o.sNo).join(', '));
    } else {
      setSNoInput('');
    }
  };

  // Change handler when S No input is edited
  const handleSNoChange = (value) => {
    setSNoInput(value);

    // Parse individual S Nos
    const parts = value.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      const matched = pendingOrders.filter(o =>
        parts.includes(o.sNo?.toString() || '')
      );
      if (matched.length > 0) {
        setSelectedProductName(matched[0].productName);
      } else {
        setSelectedProductName('');
      }
    } else {
      setSelectedProductName('');
    }
  };

  // Orders matching entered S Nos or selectedProductName
  const matchingOrders = useMemo(() => {
    const parts = sNoInput.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      return pendingOrders.filter(o => parts.includes(o.sNo?.toString() || ''));
    }
    if (selectedProductName) {
      return pendingOrders.filter(o => o.productName === selectedProductName);
    }
    return [];
  }, [sNoInput, selectedProductName, pendingOrders]);

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

    // Match by productName from BOM records
    const matchedByName = rawMaterials.filter(
      rm => rm.productName && selectedOrder.productName &&
        rm.productName.toString().trim().toLowerCase() === selectedOrder.productName.toString().trim().toLowerCase()
    );

    if (matchedByName.length > 0) return matchedByName;

    // Also try matching by fgCode if available
    const matchedByCode = rawMaterials.filter(
      rm => rm.fgCode && selectedOrder.productCode &&
        rm.fgCode.toString().trim().toLowerCase() === selectedOrder.productCode.toString().trim().toLowerCase()
    );

    return matchedByCode;
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
          setSNoInput(order.sNo?.toString() || '');
          return;
        }
      }
      setSelectedProductName('');
      setSNoInput('');
      setExtraAmount('0');
      setIsExtraManuallyEdited(false);
      setFgAvailableQty('0');
      setSellingPrice('0');
    }
  }, [isOpen, initialOrderId, pendingOrders]);

  useEffect(() => {
    setIsExtraManuallyEdited(false);
    if (selectedOrder) {
      setSellingPrice((finishedGoodPrice * totalQty).toFixed(2));

      const invItem = inventoryList.find(item => item.productCode === selectedOrder.productCode);
      const autofillQty = invItem ? String(invItem.maxLevel || 0) : '0';
      setFgAvailableQty(autofillQty);
    } else {
      setSellingPrice('0');
      setFgAvailableQty('0');
    }
  }, [selectedOrder, finishedGoodPrice, totalQty, inventoryList]);

  const [editedTableData, setEditedTableData] = useState([]);

  // Populate editedTableData when selectedOrder or bomComponents change
  useEffect(() => {
    if (!selectedOrder || bomComponents.length === 0) {
      setEditedTableData([]);
      return;
    }

    setEditedTableData(prev => {
      // Find if we already have a substitute row in prev
      const prevSub = prev.find(r => r.isSubstitute);
      let selectedSub = substituteBOMs[0];
      let isSubChecked = true;
      let userAvailableQty = null;

      if (prevSub && substituteBOMs.length > 0) {
        const found = substituteBOMs.find(s => s.rawItemName === prevSub.rawName);
        if (found) {
          selectedSub = found;
          isSubChecked = prevSub.checked;
          userAvailableQty = prevSub.availableQty;
        }
      }

      const initial = bomComponents.map(comp => {
        // Look up if we had modified this row's availableQty in prev
        const prevRow = prev.find(r => r.itemCode === comp.itemCode && !r.isSubstitute && !r.isCustom);
        const availableRawQty = prevRow ? prevRow.availableQty : (Number(comp.qtyFromRaw) || 0);
        const isChecked = prevRow ? prevRow.checked : true;

        const rawQty = (Number(comp.qty) || 0) * totalQty;
        const rawCost = rawQty * (Number(comp.costPerUnit) || 0);
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
          checked: isChecked
        };
      });

      // Carry forward custom rows from prev
      prev.filter(r => r.isCustom).forEach(customRow => {
        initial.push(customRow);
      });

      if (selectedSub) {
        // Look up availableRawQty from rawMaterials (matching by itemCode or rawItemName)
        const matchedMaterial = rawMaterials.find(
          rm => (rm.itemCode && rm.itemCode === selectedSub.itemCode) || 
                (rm.rawItemName && rm.rawItemName === selectedSub.rawItemName)
        );
        const availableRawQty = userAvailableQty !== null ? userAvailableQty : (matchedMaterial ? (Number(matchedMaterial.qtyFromRaw) || 0) : 0);
        
        const rawQty = (Number(selectedSub.qty) || 0) * totalQty;
        const rawCost = rawQty * (Number(selectedSub.costPerUnit) || 0);
        const indentQty = Math.max(0, rawQty - availableRawQty);

        initial.push({
          rawName: selectedSub.rawItemName,
          itemCode: selectedSub.itemCode,
          rawQty: Number(rawQty.toFixed(4)),
          costPerUnit: Number(selectedSub.costPerUnit) || 0,
          rawCost: Number(rawCost.toFixed(2)),
          availableQty: availableRawQty,
          indentQty: Number(indentQty.toFixed(4)),
          unit: selectedSub.unit || 'pcs',
          checked: isSubChecked,
          isSubstitute: true
        });
      }

      return initial;
    });
  }, [selectedOrder, bomComponents, totalQty, substituteBOMs, rawMaterials]);

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

  const handleSelectSubstituteMaterial = (index, name) => {
    const material = substituteBOMs.find(rm => rm.rawItemName === name);
    if (!material) return;

    // Look up available quantity from rawMaterials (matching by itemCode or rawItemName)
    const matchedMaterial = rawMaterials.find(
      rm => (rm.itemCode && rm.itemCode === material.itemCode) || 
            (rm.rawItemName && rm.rawItemName === material.rawItemName)
    );
    const availableQtyVal = matchedMaterial ? (Number(matchedMaterial.qtyFromRaw) || 0) : 0;

    const updated = editedTableData.map((row, idx) => {
      if (idx === index) {
        const costVal = Number(material.costPerUnit) || 0;
        const codeVal = material.itemCode || 'CUSTOM';
        const unitVal = material.unit || 'pcs';
        const rawQtyVal = (Number(material.qty) || 0) * totalQty;
        const rawCostVal = rawQtyVal * costVal;
        
        return {
          ...row,
          rawName: name,
          itemCode: codeVal,
          costPerUnit: costVal,
          unit: unitVal,
          rawQty: Number(rawQtyVal.toFixed(4)),
          rawCost: Number(rawCostVal.toFixed(2)),
          availableQty: availableQtyVal,
          indentQty: Number(Math.max(0, rawQtyVal - availableQtyVal).toFixed(4)),
          checked: true
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
        checked: true,
        isCustom: true
      }
    ]);
  };

  // Total summary calculations
  const totals = useMemo(() => {
    const activeItems = editedTableData.filter(item => item.checked);
    const totalRawCost = activeItems.reduce((sum, item) => sum + item.rawCost, 0);
    const extra = Number(extraAmount) || 0;
    const totalProductionCost = totalRawCost + extra;
    const totalSellingPrice = Number(sellingPrice) || 0;
    const profitLoss = totalSellingPrice - totalProductionCost;
    const profitLossPercent = totalProductionCost > 0 ? (profitLoss / totalProductionCost) * 100 : 0;
    const totalRawRequiredQty = activeItems.reduce((sum, item) => sum + item.rawQty, 0);

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

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60" width="100%" height="100%">
        <rect width="240" height="60" rx="6" fill="#f8fafc"/>
        <text x="10" y="18" font-family="sans-serif" font-size="9" font-weight="bold" fill="#475569">COST BREAKDOWN</text>
        
        <rect x="10" y="26" width="${(rawPct * 2.2).toFixed(0)}" height="12" fill="#6366f1" rx="2"/>
        <rect x="${(10 + rawPct * 2.2).toFixed(0)}" y="26" width="${(extraPct * 2.2).toFixed(0)}" height="12" fill="#f59e0b" rx="2"/>
        ${profit > 0 ? `<rect x="${(10 + (Number(rawPct) + Number(extraPct)) * 2.2).toFixed(0)}" y="26" width="${(profitPct * 2.2).toFixed(0)}" height="12" fill="#10b981" rx="2"/>` : ''}
        
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

  const generateKittingTicket = async () => {
    try {
      const result = await productionAPI.getSheetData('Costing-History');
      let nextNum = 1;
      if (result.success && result.records && result.records.length > 0) {
        const nums = result.records
          .map(r => {
            const ticket = r.kittingTicket || '';
            const match = ticket.match(/KT-(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter(n => n > 0);

        if (nums.length > 0) {
          nextNum = Math.max(...nums) + 1;
        }
      }
      return `KT-${String(nextNum).padStart(3, '0')}`;
    } catch (err) {
      console.error('Error generating kitting ticket:', err);
      return `KT-${String(Math.floor(Math.random() * 900) + 100)}`;
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!selectedProductName) {
      toast.error('Please select Product name first.');
      return;
    }

    const sNoParts = sNoInput.split(',').map(s => s.trim()).filter(Boolean);
    if (sNoParts.length === 0) {
      toast.error('Please enter or select at least one S No.');
      return;
    }

    // Validate that all S Nos exist in pendingOrders and share the same product name
    const matchedOrders = pendingOrders.filter(o =>
      sNoParts.includes(o.sNo?.toString() || '')
    );

    if (matchedOrders.length !== sNoParts.length) {
      const foundSNos = matchedOrders.map(o => o.sNo?.toString());
      const missing = sNoParts.filter(p => !foundSNos.includes(p));
      toast.error(`S No(s) not found in pending list: ${missing.join(', ')}`);
      return;
    }

    const productNames = Array.from(new Set(matchedOrders.map(o => o.productName)));
    if (productNames.length > 1) {
      toast.error(`The entered S Nos belong to different products: ${productNames.join(', ')}. Please group by same product.`);
      return;
    }

    if (bomComponents.length === 0 && editedTableData.filter(row => row.rawName).length === 0) {
      toast.error('This product has no configured BOM components. Please configure it in the BOM section first.');
      return;
    }

    const hasEmptyCheckedRow = editedTableData.some(row => row.checked && !row.rawName);
    if (hasEmptyCheckedRow) {
      toast.error('Please select a material for all checked extra material rows.');
      return;
    }

    setIsSubmitting(true);

    // Generate unique batch ticket ID
    const ticketId = await generateKittingTicket();
    console.log('FullKittingForm: Generated unique kitting ticket:', ticketId);

    // Synchronously set the ticket ID in the off-screen print template DOM
    const ticketEl = document.getElementById('print-ticket-id');
    if (ticketEl) {
      ticketEl.innerText = `Ticket ID: ${ticketId}`;
    }

    // Generate PDF & upload
    let fileUrl = '';
    try {
      const element = printTemplateRef.current;
      if (element) {
        // Render element to canvas
        const canvas = await html2canvas(element, {
          scale: 2, // High resolution
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          height: element.scrollHeight,
          windowHeight: element.scrollHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        // A4 sheet width and height
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const pdfBase64 = pdf.output('datauristring');

        // Upload to Google Drive using folder ID from env
        const folderId = import.meta.env.VITE_FOLDER_ID;
        const fileName = `Costing_Report_SNo_${sNoParts.join('_')}_${Date.now()}.pdf`;

        const uploadToast = toast.loading('Uploading PDF report to Google Drive...');
        console.log('FullKittingForm: Calling uploadFile with folderId:', folderId, 'fileName:', fileName);
        const uploadResult = await productionAPI.uploadFile(pdfBase64, fileName, 'application/pdf', folderId);
        console.log('FullKittingForm: uploadResult:', uploadResult);

        if (uploadResult.success) {
          fileUrl = uploadResult.fileUrl;
          toast.success('PDF uploaded successfully!', { id: uploadToast });
        } else {
          console.error('FullKittingForm: PDF upload failed:', uploadResult.error || 'Unknown error');
          toast.error(`PDF upload failed: ${uploadResult.error || 'Unknown error'}`, { id: uploadToast });
          setIsSubmitting(false);
          return;
        }
      }
    } catch (pdfErr) {
      console.error('Failed to generate or upload PDF:', pdfErr);
      toast.error('Failed to generate PDF costing report.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare materials list
      const activeTableData = editedTableData.filter(item => item.checked && item.rawName);
      const requiredRawMaterialNameList = activeTableData.map(item => item.rawName);

      if (onSave) {
        // Construct unique, scaled costing data for each matched order individually
        const records = matchedOrders.map(o => {
          const ratio = totalQty > 0 ? (Number(o.qty) || 0) / totalQty : 0;

          const rawQtyList = activeTableData.map(item => (item.rawQty * ratio).toFixed(3));
          const rawCostList = activeTableData.map(item => (item.rawCost * ratio).toFixed(2));
          const availableRawQtyList = activeTableData.map(item => (item.availableQty * ratio).toFixed(3));
          const indentQtyList = activeTableData.map(item => (item.indentQty * ratio).toFixed(3));

          return {
            sNo: o.sNo,
            costingData: {
              kittingTicket: ticketId,
              fgName: o.productName || '',
              planQty: (Number(o.qty) || 0).toFixed(3),
              requiredRawMaterialName: requiredRawMaterialNameList.join(', '),
              rawQty: rawQtyList.join(', '),
              rawCost: rawCostList.join(', '),
              availableRawQty: availableRawQtyList.join(', '),
              indentQty: indentQtyList.join(', '),
              fgAvailableQty: (Number(fgAvailableQty) * ratio).toFixed(3),
              totalRawRequiredQty: (totals.totalRawRequiredQty * ratio).toFixed(3),
              totalRawCost: (totals.totalRawCost * ratio).toFixed(2),
              extraAmount: (Number(extraAmount) * ratio).toFixed(2),
              totalProductionCost: (totals.totalProductionCost * ratio).toFixed(2),
              sellingPrice: (totals.totalSellingPrice * ratio).toFixed(2),
              profitLoss: (totals.profitLoss * ratio).toFixed(2),
              profitLossPercent: totals.profitLossPercent.toFixed(2),
              costingImage: generateCostingImage(totals),
              rawNames: requiredRawMaterialNameList.join(', '),
              rawQuantities: rawQtyList.join(', '),
              pdfLink: fileUrl
            }
          };
        });

        await onSave(records);
      }
    } catch (error) {
      console.error('Error saving costing history:', error);
      toast.error('An error occurred while saving to Costing History');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalForm
      isOpen={isOpen}
      onClose={onClose}
      title="Full Kitting Check & Costing"
      onSubmit={handleSave}
      submitText={isSubmitting ? "Saving..." : "Save to Costing History"}
      cancelText="Cancel"
      maxWidth="max-w-6xl"
      loading={isSubmitting}
    >
      <div ref={formContentRef} className="relative space-y-5 min-h-[380px] p-4 bg-white text-slate-800">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] flex flex-col items-center justify-center z-[50]" data-html2canvas-ignore="true">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-2"></div>
            <p className="text-indigo-700 text-xs font-bold uppercase tracking-wider">Generating PDF & Uploading Costing Card...</p>
          </div>
        )}
        {loadingBOM ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-3"></div>
            <p className="text-gray-500 text-sm">Fetching BOM configuration from server...</p>
          </div>
        ) : (
          <>
            {/* Dropdown & Text selectors */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">Product name *</label>
                <SearchableDropdown
                  options={productNamesOptions}
                  value={selectedProductName}
                  onChange={handleProductChange}
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
                  value={sNoInput}
                  onChange={(e) => handleSNoChange(e.target.value)}
                  placeholder="e.g. 501, 502"
                  className="w-full px-3 py-1.5 border border-gray-300 bg-white text-slate-800 font-semibold rounded text-xs h-[36px] outline-none text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
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
                  value={totalQty ? totalQty.toFixed(3) : '0'}
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
                      data-html2canvas-ignore="true"
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
                          <th className="px-4 py-2.5 text-center w-12">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-50">
                        {editedTableData.length > 0 ? (
                          editedTableData.map((row, index) => {
                            const isShortage = row.indentQty > 0;
                            return (
                              <tr key={index} className={`transition-all duration-200 ${!row.checked ? 'bg-slate-50/50 text-slate-400 opacity-60' : 'hover:bg-slate-50/50'}`}>
                                <td className="px-4 py-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={row.checked}
                                    onChange={(e) => handleCellChange(index, 'checked', e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer transition-transform active:scale-95"
                                    title="Mark as Checked"
                                  />
                                </td>
                                <td className="px-4 py-2.5 text-center font-medium text-slate-900">
                                  {row.isSubstitute ? (
                                    <select
                                      value={row.rawName}
                                      onChange={(e) => handleSelectSubstituteMaterial(index, e.target.value)}
                                      className="w-full max-w-[200px] px-2 py-1 border border-indigo-200 rounded text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs font-bold text-indigo-700 bg-indigo-50/30 inline-block cursor-pointer"
                                      required
                                    >
                                      {substituteBOMs.map((m, mIdx) => (
                                        <option key={mIdx} value={m.rawItemName}>{m.rawItemName}</option>
                                      ))}
                                    </select>
                                  ) : row.isCustom ? (
                                    <select
                                      value={row.rawName}
                                      onChange={(e) => handleSelectRawMaterial(index, e.target.value)}
                                      className="w-full max-w-[200px] px-2 py-1 border border-gray-200 rounded text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs font-semibold text-slate-800 bg-white inline-block cursor-pointer"
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
                                <td className="px-4 py-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.001"
                                      value={row.rawQty.toFixed(3)}
                                      onChange={(e) => handleCellChange(index, 'rawQty', e.target.value)}
                                      className="w-24 px-2 py-1 border border-gray-200 rounded text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs font-bold text-indigo-600 bg-white"
                                      required
                                    />
                                    <span className="text-gray-400 font-semibold">{row.unit}</span>
                                  </div>
                                </td>
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
                                <td className="px-4 py-2.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.001"
                                      value={row.availableQty.toFixed(3)}
                                      onChange={(e) => handleCellChange(index, 'availableQty', e.target.value)}
                                      className="w-24 px-2 py-1 border border-gray-200 rounded text-center focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-xs text-slate-600 font-semibold bg-white"
                                      required
                                    />
                                    <span className="text-gray-400 font-semibold">{row.unit}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isShortage ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {row.indentQty > 0 ? `${row.indentQty.toFixed(3)} ${row.unit}` : 'Nil'}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-center">
                                  {row.isCustom && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRow(index)}
                                      className="text-rose-500 hover:text-rose-700 transition-colors duration-150 p-1 rounded hover:bg-rose-50 inline-flex items-center justify-center"
                                      title="Delete Row"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="px-4 py-6 text-center text-slate-400 font-medium bg-slate-50/30">
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-bold">FG Available Qty *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={fgAvailableQty}
                        onChange={(e) => setFgAvailableQty(e.target.value)}
                        placeholder="Enter finished goods available qty"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[36px]"
                        required
                      />
                      <span className="text-[10px] text-gray-400 block font-medium">Available finished stock quantity in godown.</span>
                    </div>

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/30 rounded-xl p-4 border border-indigo-100/50">
                    <div className="space-y-2 text-xs text-slate-700 font-semibold bg-white p-4 rounded-lg border border-slate-100 shadow-sm flex flex-col justify-center">
                      <div className="flex justify-between border-b border-slate-50 pb-1.5">
                        <span>Total Raw Required Qty:</span>
                        <span className="text-indigo-600 font-bold">{totals.totalRawRequiredQty.toFixed(3)}</span>
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
          </>
        )}

        {/* Print Template for PDF Generation (Off-Screen) */}
        <div
          ref={printTemplateRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '794px',
            padding: '40px',
            background: '#ffffff',
            color: '#1e293b',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box'
          }}
        >
          {/* Header */}
          <div style={{ borderBottom: '3px solid #6366f1', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Kitting & Costing Report
              </h1>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0', fontWeight: '500' }}>
                PMS Inventory Management System
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
              <div id="print-ticket-id" style={{ fontWeight: '700', color: '#6366f1', fontSize: '12px' }}>Ticket ID: PENDING</div>
              <div style={{ marginTop: '4px' }}>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px', fontSize: '12px' }}>
            <div>
              <div style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '9px', fontWeight: '700', marginBottom: '2px' }}>Product Name</div>
              <div style={{ fontWeight: '700', color: '#0f172a' }}>{selectedOrder?.productName || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '9px', fontWeight: '700', marginBottom: '2px' }}>S No(s)</div>
              <div style={{ fontWeight: '700', color: '#0f172a' }}>{sNoInput || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '9px', fontWeight: '700', marginBottom: '2px' }}>Plan Quantity (Each)</div>
              <div style={{ fontWeight: '600', color: '#334155' }}>{planQtyText || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', textTransform: 'uppercase', fontSize: '9px', fontWeight: '700', marginBottom: '2px' }}>Total Plan Quantity</div>
              <div style={{ fontWeight: '800', color: '#6366f1' }}>{totalQty ? totalQty.toFixed(3) : '0'}</div>
            </div>
          </div>

          {/* Table */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px 0' }}>
              BOM Component Breakdown
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>BOM Component Name</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Raw Qty</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right' }}>Raw Cost</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Available Stock</th>
                  <th style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>Indent Qty</th>
                </tr>
              </thead>
              <tbody>
                {editedTableData.filter(row => row.checked).length > 0 ? (
                  editedTableData.filter(row => row.checked).map((row, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', background: index % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: '500' }}>{row.rawName}</td>
                      <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: '700', color: '#6366f1' }}>
                        {row.rawQty.toFixed(3)} <span style={{ color: '#94a3b8', fontWeight: '500' }}>{row.unit}</span>
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '700', color: '#334155' }}>
                        ₹{row.rawCost.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#475569' }}>
                        {row.availableQty.toFixed(3)} <span style={{ color: '#94a3b8' }}>{row.unit}</span>
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {row.indentQty > 0 ? (
                          <span style={{ color: '#ef4444', fontWeight: '700', background: '#fef2f2', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                            {row.indentQty.toFixed(3)} {row.unit}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Nil</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                      No components configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financials & SVG */}
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Financial Summary */}
            <div style={{ flex: '1', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', fontSize: '11px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                Financial Summary
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Total Raw Cost:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{totals.totalRawCost.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Overhead (Extra Amount):</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{Number(extraAmount).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #cbd5e1', fontWeight: '700', color: '#6366f1', fontSize: '12px' }}>
                <span>Total Production Cost:</span>
                <span>₹{totals.totalProductionCost.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #cbd5e1', fontWeight: '700', color: '#0f172a', fontSize: '12px' }}>
                <span>Selling Price:</span>
                <span>₹{totals.totalSellingPrice.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0 0', fontWeight: '900', fontSize: '13px', color: totals.profitLoss >= 0 ? '#10b981' : '#ef4444' }}>
                <span>Profit / Loss Amount:</span>
                <span>₹{totals.profitLoss.toLocaleString('en-IN')} ({totals.profitLossPercent}%)</span>
              </div>
            </div>

            {/* SVG Chart Preview */}
            <div style={{ flex: '1', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <img
                src={generateCostingImage(totals)}
                alt="Cost Breakdown Chart"
                style={{ width: '100%', maxHeight: '90px', objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>
      </div>
    </ModalForm>
  );
}