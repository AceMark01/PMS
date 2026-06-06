import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Search, RotateCcw, Filter, Trash2, Edit2, Layers, Tag, Box, DollarSign, X } from 'lucide-react';
import DataTable from '../../components/DataTable';
import ModalForm from '../../components/ModalForm';
import SearchableDropdown from '../../components/SearchableDropdown';

import { SEEDED_ITEMS } from '../../utils/seeds';

export const SEEDED_RAWMATERIALS = [
  { id: 'rm-001', productName: 'Dfc Register 372P Ace', fgCode: 'Dfc372', rawItemName: 'Cover DFC Register 50*76', itemCode: 'CDFC', unit: 'pcs', qty: 1, costPerUnit: 223, totalCost: 223, batchQty: 30, qtyFromRaw: 30 },
  { id: 'rm-002', productName: 'Dfc Register 372P Ace', fgCode: 'Dfc372', rawItemName: 'MILL BOARD 65CM X 80CM 28 OUNCE', itemCode: '286580MB', unit: 'pcs', qty: 0.395, costPerUnit: 223, totalCost: 88.085, batchQty: 30, qtyFromRaw: 11.85 },
  { id: 'rm-003', productName: 'Dfc Register 372P Ace', fgCode: 'Dfc372', rawItemName: 'Radiant Platinum 63Cm X 78Cm, 57Gsm 1 Line', itemCode: '637857RP1', unit: 'pcs', qty: 1.288, costPerUnit: 223, totalCost: 287.224, batchQty: 30, qtyFromRaw: 38.64 },
  { id: 'rm-004', productName: 'Dfc Register 480P Ace', fgCode: 'Dfc480', rawItemName: 'Cover DFC Register 50*76', itemCode: 'CDFC', unit: 'pcs', qty: 1, costPerUnit: 223, totalCost: 223, batchQty: 30, qtyFromRaw: 30 },
  { id: 'rm-005', productName: 'Dfc Register 480P Ace', fgCode: 'Dfc480', rawItemName: 'MILL BOARD 65CM X 80CM 28 OUNCE', itemCode: '286580MB', unit: 'pcs', qty: 0.395, costPerUnit: 223, totalCost: 88.085, batchQty: 30, qtyFromRaw: 11.85 },
  { id: 'rm-006', productName: 'Dfc Register 480P Ace', fgCode: 'Dfc480', rawItemName: 'Radiant Platinum 63Cm X 78Cm, 57Gsm 1 Line', itemCode: '637857RP1', unit: 'pcs', qty: 1.288, costPerUnit: 223, totalCost: 287.224, batchQty: 30, qtyFromRaw: 38.64 },
  { id: 'rm-007', productName: 'Dfc Register 576P Ace', fgCode: 'Dfc576', rawItemName: 'Cover DFC Register 50*76', itemCode: 'CDFC', unit: 'pcs', qty: 1, costPerUnit: 223, totalCost: 223, batchQty: 30, qtyFromRaw: 30 },
  { id: 'rm-008', productName: 'Dfc Register 576P Ace', fgCode: 'Dfc576', rawItemName: 'MILL BOARD 65CM X 80CM 28 OUNCE', itemCode: '286580MB', unit: 'pcs', qty: 0.395, costPerUnit: 223, totalCost: 88.085, batchQty: 30, qtyFromRaw: 11.85 },
  { id: 'rm-009', productName: 'Dfc Register 576P Ace', fgCode: 'Dfc576', rawItemName: 'Radiant Platinum 63Cm X 78Cm, 57Gsm 1 Line', itemCode: '637857RP1', unit: 'pcs', qty: 1.288, costPerUnit: 223, totalCost: 287.224, batchQty: 30, qtyFromRaw: 38.64 },
  { id: 'rm-010', productName: '4 Flap File Special Cloth', fgCode: '4FSC', rawItemName: 'MILL BOARD 74CM X 86CM 24 OUNCE', itemCode: '247486MB', unit: 'pcs', qty: 0.118, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 22.656 },
  { id: 'rm-011', productName: '4 Flap File Special Cloth', fgCode: '4FSC', rawItemName: 'MULTY LACE', itemCode: 'ML', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 192 },
  { id: 'rm-012', productName: '4 Flap File Special Cloth N-63', fgCode: '4FSC63', rawItemName: 'MILL BOARD 74CM X 86CM 24 OUNCE', itemCode: '247486MB', unit: 'pcs', qty: 0.118, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 22.656 },
  { id: 'rm-013', productName: '4 Flap File Special Cloth N-63', fgCode: '4FSC63', rawItemName: 'MULTY LACE', itemCode: 'ML', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 192 },
  { id: 'rm-014', productName: 'Four Fold File 5 cm box', fgCode: '4FF5', rawItemName: 'MILL BOARD 74CM X 86CM 24 OUNCE', itemCode: '247486MB', unit: 'pcs', qty: 0.118, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 22.656 },
  { id: 'rm-015', productName: 'Four Fold File 5 cm box', fgCode: '4FF5', rawItemName: 'MULTY LACE', itemCode: 'ML', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 192 },
  { id: 'rm-016', productName: 'Four Fold File 5 cm box', fgCode: '4FF5', rawItemName: 'x1510 Polyolefin Shring Film', itemCode: 'xPOF1510', unit: 'pcs', qty: 0.005208333333, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 1 },
  { id: 'rm-017', productName: 'Four Fold File 7 cm box', fgCode: '4FF7', rawItemName: 'MILL BOARD 74CM X 86CM 24 OUNCE', itemCode: '247486MB', unit: 'pcs', qty: 0.118, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 22.656 },
  { id: 'rm-018', productName: 'Four Fold File 7 cm box', fgCode: '4FF7', rawItemName: 'MULTY LACE', itemCode: 'ML', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 192 },
  { id: 'rm-019', productName: 'Four Fold File 7 cm box', fgCode: '4FF7', rawItemName: 'x1510 Polyolefin Shring Film', itemCode: 'xPOF1510', unit: 'pcs', qty: 0.005208333333, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 1 },
  { id: 'rm-020', productName: '4 Flap File N-36', fgCode: '4f36', rawItemName: 'MILL BOARD 74CM X 86CM 24 OUNCE', itemCode: '247486MB', unit: 'pcs', qty: 0.118, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 22.656 },
  { id: 'rm-021', productName: '4 Flap File N-36', fgCode: '4f36', rawItemName: 'MULTY LACE', itemCode: 'ML', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 192, qtyFromRaw: 192 },
  { id: 'rm-022', productName: 'A/4 Graph Copy 032P Ace', fgCode: 'A4g32', rawItemName: 'COVER A/4 GRAPH COPY', itemCode: 'CA4G0', unit: 'pcs', qty: 1, costPerUnit: 7168, totalCost: 7168, batchQty: 350, qtyFromRaw: 350 },
  { id: 'rm-023', productName: 'A/4 Graph Copy 032P Ace', fgCode: 'A4g32', rawItemName: 'Radiant Platinum 55Cm X 90Cm, 54Gsm One Side', itemCode: '559054RPS', unit: 'pcs', qty: 0.0469, costPerUnit: 7168, totalCost: 336.1792, batchQty: 350, qtyFromRaw: 16.415 },
  { id: 'rm-024', productName: 'A/4 Spiral Note Book 144P Mark', fgCode: 'A4MS144', rawItemName: 'COVER A/4 SPIRAL NOTE BOOK ACE 18', itemCode: 'CA4SA18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 100, qtyFromRaw: 100 },
  { id: 'rm-025', productName: 'A/4 Spiral Note Book 144P Mark', fgCode: 'A4MS144', rawItemName: 'COVER A/4 SPIRAL NOTE BOOK BACK SIDE ACE 18', itemCode: 'CA4SBA18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 100, qtyFromRaw: 100 },
  { id: 'rm-026', productName: 'A/4 Spiral Note Book 144P Mark', fgCode: 'A4MS144', rawItemName: 'Radiant Stationery 58Cm X 84Cm, 54Gsm 1 Line', itemCode: '588454RS1', unit: 'pcs', qty: 0.231, costPerUnit: 0, totalCost: 0, batchQty: 100, qtyFromRaw: 23.1 },
  { id: 'rm-027', productName: 'A/4 Spiral Note Book 144P Mark', fgCode: 'A4MS144', rawItemName: 'WIRE 12 MM', itemCode: 'W 12', unit: 'pcs', qty: 0.0068, costPerUnit: 0, totalCost: 0, batchQty: 100, qtyFromRaw: 0.68 },
  { id: 'rm-028', productName: '160P Plain Mark', fgCode: 'A5M160K', rawItemName: 'Radiant Stationery 91Cm X 68Cm 54Gsm 1 Line', itemCode: '916854RS1', unit: 'pcs', qty: 0.037575, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 18.036 },
  { id: 'rm-029', productName: 'A5 Note Book 164P 1 Line Mark', fgCode: 'A5M1641', rawItemName: 'COVER A5 MARK 18', itemCode: 'A5MC18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 480 },
  { id: 'rm-030', productName: 'A5 Note Book 164P 1 Line Mark', fgCode: 'A5M1641', rawItemName: 'Radiant Stationery 91Cm X 68Cm 54Gsm 1 Line', itemCode: '916854RS1', unit: 'pcs', qty: 0.037575, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 18.036 },
  { id: 'rm-031', productName: 'A5 Note Book 172P 1 Line Natural Shed Mark', fgCode: 'A5M1721N', rawItemName: 'COVER A5 MARK 18', itemCode: 'A5MC18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 480 },
  { id: 'rm-032', productName: 'A5 Note Book 172P 1 Line Natural Shed Mark', fgCode: 'A5M1721N', rawItemName: 'Radiant Stationery 91Cm X 68Cm 54Gsm 1 Line', itemCode: '916854RS1', unit: 'pcs', qty: 0.037575, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 18.036 },
  { id: 'rm-033', productName: 'A5 Note Book 172P 4 Line Mark', fgCode: 'A5M1724', rawItemName: 'COVER A5 MARK 18', itemCode: 'A5MC18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 480 },
  { id: 'rm-034', productName: 'A5 Note Book 172P 4 Line Mark', fgCode: 'A5M1724', rawItemName: 'Radiant Stationery 91Cm X 68Cm 54Gsm 1 Line', itemCode: '916854RS1', unit: 'pcs', qty: 0.037575, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 18.036 },
  { id: 'rm-035', productName: 'A5 Note Book 172P Combind Mark', fgCode: 'A5M172C', rawItemName: 'COVER A5 MARK 18', itemCode: 'A5MC18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 480 },
  { id: 'rm-036', productName: 'A5 Note Book 172P Combind Mark', fgCode: 'A5M172C', rawItemName: 'Radiant Stationery 91Cm X 68Cm 54Gsm 1 Line', itemCode: '916854RS1', unit: 'pcs', qty: 0.037575, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 18.036 },
  { id: 'rm-037', productName: 'A5 Note Book 172P Dabba Mark', fgCode: 'A5M172D', rawItemName: 'COVER A5 MARK 18', itemCode: 'A5MC18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 480 },
  { id: 'rm-038', productName: 'A5 Note Book 172P Dabba Mark', fgCode: 'A5M172D', rawItemName: 'Radiant Stationery 91Cm X 68Cm 54Gsm 1 Line', itemCode: '916854RS1', unit: 'pcs', qty: 0.037575, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 18.036 },
  { id: 'rm-039', productName: 'A5 Note Book 172P Plain Mark', fgCode: 'A5M172K', rawItemName: 'COVER A5 MARK 18', itemCode: 'A5MC18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 480 },
  { id: 'rm-040', productName: 'A5 Note Book 172P Plain Mark', fgCode: 'A5M172K', rawItemName: 'Radiant Stationery 91Cm X 68Cm 54Gsm 1 Line', itemCode: '916854RS1', unit: 'pcs', qty: 0.037575, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 18.036 },
  { id: 'rm-041', productName: 'A5 Note Book 176P 1 Line Mark', fgCode: 'A5M1761', rawItemName: 'COVER A5 MARK 18', itemCode: 'A5MC18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 480 },
  { id: 'rm-042', productName: 'A5 Note Book 176P 1 Line Mark', fgCode: 'A5M1761', rawItemName: 'Radiant Stationery 91Cm X 68Cm 54Gsm 1 Line', itemCode: '916854RS1', unit: 'pcs', qty: 0.037575, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 18.036 },
  { id: 'rm-043', productName: 'A5 Note Book 176P 2 Line Mark', fgCode: 'A5M1762', rawItemName: 'COVER A5 MARK 18', itemCode: 'A5MC18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 480 },
  { id: 'rm-044', productName: 'A5 Note Book 176P 2 Line Mark', fgCode: 'A5M1762', rawItemName: 'Radiant Stationery 91Cm X 68Cm 54Gsm 1 Line', itemCode: '916854RS1', unit: 'pcs', qty: 0.037575, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 18.036 },
  { id: 'rm-045', productName: 'A5 Note Book 176P 3 Line Mark', fgCode: 'A5M1763', rawItemName: 'COVER A5 MARK 18', itemCode: 'A5MC18', unit: 'pcs', qty: 1, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 480 },
  { id: 'rm-046', productName: 'A5 Note Book 176P 3 Line Mark', fgCode: 'A5M1763', rawItemName: 'Radiant Stationery 91Cm X 68Cm 54Gsm 1 Line', itemCode: '916854RS1', unit: 'pcs', qty: 0.037575, costPerUnit: 0, totalCost: 0, batchQty: 480, qtyFromRaw: 18.036 },
  
  // Customize Order Dummy Data for Kitting Flow
  { id: 'rm-047', productName: 'Cobra File N-63 (999 National)', fgCode: 'C63N', rawItemName: 'Cobra Board N-63', itemCode: 'CBRD', unit: 'pcs', qty: 1.0, costPerUnit: 12.50, totalCost: 12.50, batchQty: 100, qtyFromRaw: 500 },
  { id: 'rm-048', productName: 'Cobra File N-63 (999 National)', fgCode: 'C63N', rawItemName: 'Steel Clip Assembly', itemCode: 'SCLIP', unit: 'pcs', qty: 1.0, costPerUnit: 5.20, totalCost: 5.20, batchQty: 100, qtyFromRaw: 1000 },
  { id: 'rm-049', productName: 'Cobra File N-63 (999 National)', fgCode: 'C63N', rawItemName: 'Paper Lining Sheet', itemCode: 'PLINE', unit: 'pcs', qty: 2.0, costPerUnit: 1.10, totalCost: 2.20, batchQty: 100, qtyFromRaw: 800 },
  { id: 'rm-050', productName: 'Milan Jumbo Register 92page', fgCode: 'MBR92', rawItemName: 'Cover Milan Jumbo', itemCode: 'CMJ', unit: 'pcs', qty: 1.0, costPerUnit: 15.00, totalCost: 15.00, batchQty: 50, qtyFromRaw: 300 },
  { id: 'rm-051', productName: 'Milan Jumbo Register 92page', fgCode: 'MBR92', rawItemName: 'Radiant Paper 54Gsm', itemCode: 'RP54', unit: 'pcs', qty: 0.35, costPerUnit: 120.00, totalCost: 42.00, batchQty: 50, qtyFromRaw: 100 },
  { id: 'rm-052', productName: 'Milan Jumbo Register 92page', fgCode: 'MBR92', rawItemName: 'Binding Cloth', itemCode: 'BCLN', unit: 'pcs', qty: 0.05, costPerUnit: 45.00, totalCost: 2.25, batchQty: 50, qtyFromRaw: 50 },
  { id: 'rm-053', productName: 'Jumbo Register N-2 112P Fineprint', fgCode: 'BR112', rawItemName: 'Fineprint Cover', itemCode: 'FPCV', unit: 'pcs', qty: 1.0, costPerUnit: 18.00, totalCost: 18.00, batchQty: 60, qtyFromRaw: 400 },
  { id: 'rm-054', productName: 'Jumbo Register N-2 112P Fineprint', fgCode: 'BR112', rawItemName: 'Radiant Stationery Paper', itemCode: 'RSP', unit: 'pcs', qty: 0.45, costPerUnit: 130.00, totalCost: 58.50, batchQty: 60, qtyFromRaw: 150 },
  { id: 'rm-055', productName: 'Milan Jumbo Register 180page', fgCode: 'MBR180', rawItemName: 'Cover Milan Jumbo Extra', itemCode: 'CMJE', unit: 'pcs', qty: 1.0, costPerUnit: 18.00, totalCost: 18.00, batchQty: 50, qtyFromRaw: 200 },
  { id: 'rm-056', productName: 'Milan Jumbo Register 180page', fgCode: 'MBR180', rawItemName: 'Radiant Paper 54Gsm Extra', itemCode: 'RP54E', unit: 'pcs', qty: 0.70, costPerUnit: 120.00, totalCost: 84.00, batchQty: 50, qtyFromRaw: 150 },
  { id: 'rm-057', productName: 'Milan Jumbo Register 276page', fgCode: 'MBR276', rawItemName: 'Cover Milan Jumbo Super', itemCode: 'CMJS', unit: 'pcs', qty: 1.0, costPerUnit: 22.00, totalCost: 22.00, batchQty: 50, qtyFromRaw: 150 },
  { id: 'rm-058', productName: 'Milan Jumbo Register 276page', fgCode: 'MBR276', rawItemName: 'Radiant Paper 54Gsm Super', itemCode: 'RP54S', unit: 'pcs', qty: 1.10, costPerUnit: 120.00, totalCost: 132.00, batchQty: 50, qtyFromRaw: 200 },
  
  // Additional Customize Order Items for Pending List
  { id: 'rm-059', productName: 'Milan Jumbo Register 372page', fgCode: 'MBR372', rawItemName: 'Cover Milan Jumbo Premium', itemCode: 'CMJP', unit: 'pcs', qty: 1.0, costPerUnit: 26.00, totalCost: 26.00, batchQty: 50, qtyFromRaw: 120 },
  { id: 'rm-060', productName: 'Milan Jumbo Register 372page', fgCode: 'MBR372', rawItemName: 'Radiant Paper 54Gsm Premium', itemCode: 'RP54P', unit: 'pcs', qty: 1.50, costPerUnit: 120.00, totalCost: 180.00, batchQty: 50, qtyFromRaw: 80 },
  { id: 'rm-061', productName: 'Milan Jumbo Register 476page', fgCode: 'MBR476', rawItemName: 'Cover Milan Jumbo Ultra', itemCode: 'CMJU', unit: 'pcs', qty: 1.0, costPerUnit: 32.00, totalCost: 32.00, batchQty: 40, qtyFromRaw: 100 },
  { id: 'rm-062', productName: 'Milan Jumbo Register 476page', fgCode: 'MBR476', rawItemName: 'Radiant Paper 54Gsm Ultra', itemCode: 'RP54U', unit: 'pcs', qty: 1.90, costPerUnit: 120.00, totalCost: 228.00, batchQty: 40, qtyFromRaw: 90 },
  { id: 'rm-063', productName: 'Jumbo Register N-3 168p Fineprint', fgCode: 'BR168', rawItemName: 'Fineprint Cover Medium', itemCode: 'FPCVM', unit: 'pcs', qty: 1.0, costPerUnit: 20.00, totalCost: 20.00, batchQty: 60, qtyFromRaw: 250 },
  { id: 'rm-064', productName: 'Jumbo Register N-3 168p Fineprint', fgCode: 'BR168', rawItemName: 'Radiant Stationery Paper Medium', itemCode: 'RSPM', unit: 'pcs', qty: 0.68, costPerUnit: 130.00, totalCost: 88.40, batchQty: 60, qtyFromRaw: 180 },
  { id: 'rm-065', productName: 'Jumbo Register N-4 224P Fineprint', fgCode: 'BR224', rawItemName: 'Fineprint Cover Large', itemCode: 'FPCVL', unit: 'pcs', qty: 1.0, costPerUnit: 23.00, totalCost: 23.00, batchQty: 60, qtyFromRaw: 200 },
  { id: 'rm-066', productName: 'Jumbo Register N-4 224P Fineprint', fgCode: 'BR224', rawItemName: 'Radiant Stationery Paper Large', itemCode: 'RSPL', unit: 'pcs', qty: 0.90, costPerUnit: 130.00, totalCost: 117.00, batchQty: 60, qtyFromRaw: 140 },
  { id: 'rm-067', productName: 'Jumbo Register N-5 280p Fineprint', fgCode: 'BR280', rawItemName: 'Fineprint Cover XL', itemCode: 'FPCVXL', unit: 'pcs', qty: 1.0, costPerUnit: 26.00, totalCost: 26.00, batchQty: 50, qtyFromRaw: 150 },
  { id: 'rm-068', productName: 'Jumbo Register N-5 280p Fineprint', fgCode: 'BR280', rawItemName: 'Radiant Stationery Paper XL', itemCode: 'RSPXL', unit: 'pcs', qty: 1.12, costPerUnit: 130.00, totalCost: 145.60, batchQty: 50, qtyFromRaw: 120 },
  { id: 'rm-069', productName: 'Jumbo Register N 6 336p Fineprint', fgCode: 'BR336', rawItemName: 'Fineprint Cover XXL', itemCode: 'FPCVXXL', unit: 'pcs', qty: 1.0, costPerUnit: 29.00, totalCost: 29.00, batchQty: 50, qtyFromRaw: 130 },
  { id: 'rm-070', productName: 'Jumbo Register N 6 336p Fineprint', fgCode: 'BR336', rawItemName: 'Radiant Stationery Paper XXL', itemCode: 'RSPXXL', unit: 'pcs', qty: 1.35, costPerUnit: 130.00, totalCost: 175.50, batchQty: 50, qtyFromRaw: 100 },
  { id: 'rm-071', productName: 'Jumbo Register N 8 448P Fineprint', fgCode: 'BR448', rawItemName: 'Fineprint Cover Super', itemCode: 'FPCVS', unit: 'pcs', qty: 1.0, costPerUnit: 35.00, totalCost: 35.00, batchQty: 40, qtyFromRaw: 110 },
  { id: 'rm-072', productName: 'Jumbo Register N 8 448P Fineprint', fgCode: 'BR448', rawItemName: 'Radiant Stationery Paper Super', itemCode: 'RSPS', unit: 'pcs', qty: 1.80, costPerUnit: 130.00, totalCost: 234.00, batchQty: 40, qtyFromRaw: 90 }
];

export default function BOM() {
  const [materials, setMaterials] = useState(() => {
    const saved = localStorage.getItem('raw_materials');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('raw_materials', JSON.stringify(SEEDED_RAWMATERIALS));
    return SEEDED_RAWMATERIALS;
  });

  const masterItems = useMemo(() => {
    const saved = localStorage.getItem('master_items');
    return saved ? JSON.parse(saved) : SEEDED_ITEMS;
  }, []);

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const seedVersion = 'v5';
    const currentVersion = localStorage.getItem('raw_materials_version');
    if (currentVersion !== seedVersion) {
      localStorage.setItem('raw_materials', JSON.stringify(SEEDED_RAWMATERIALS));
      localStorage.setItem('raw_materials_version', seedVersion);
      setMaterials(SEEDED_RAWMATERIALS);
    }
  }, []);

  // Form State
  const [selectedProductName, setSelectedProductName] = useState('');
  const [selectedFGCode, setSelectedFGCode] = useState('');
  const [rawItems, setRawItems] = useState([
    { rawItemName: '', itemCode: '', unit: 'Kg', qty: '', costPerUnit: '', batchQty: '', qtyFromRaw: '' }
  ]);

  // Filters State
  const [filters, setFilters] = useState({
    searchQuery: '',
    productName: '',
    unit: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      productName: '',
      unit: ''
    });
    setCurrentPage(1);
    toast.success('Filters cleared');
  };

  const handleProductSelect = (name) => {
    const matched = masterItems.find(item => item.name === name);
    setSelectedProductName(name);
    setSelectedFGCode(matched ? matched.code : '');
  };

  const handleFGSelect = (code) => {
    const matched = masterItems.find(item => item.code === code);
    setSelectedProductName(matched ? matched.name : '');
    setSelectedFGCode(code);
  };

  const handleAddClick = () => {
    setIsEditMode(false);
    setEditingId(null);
    setSelectedProductName('');
    setSelectedFGCode('');
    setRawItems([
      { rawItemName: '', itemCode: '', unit: 'Kg', qty: '', costPerUnit: '', batchQty: '', qtyFromRaw: '' }
    ]);
    setShowFormModal(true);
  };

  const handleEditClick = (item) => {
    setIsEditMode(true);
    setEditingId(item.id);
    setSelectedProductName(item.productName);
    setSelectedFGCode(item.fgCode || '');
    setRawItems([
      {
        rawItemName: item.rawItemName,
        itemCode: item.itemCode,
        unit: item.unit,
        qty: item.qty,
        costPerUnit: item.costPerUnit,
        batchQty: item.batchQty,
        qtyFromRaw: item.qtyFromRaw
      }
    ]);
    setShowFormModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this raw material record?')) {
      const updated = materials.filter(m => m.id !== id);
      setMaterials(updated);
      localStorage.setItem('raw_materials', JSON.stringify(updated));
      toast.success('Record deleted successfully!');
    }
  };

  const handleAddRawRow = () => {
    setRawItems(prev => [
      ...prev,
      { rawItemName: '', itemCode: '', unit: 'Kg', qty: '', costPerUnit: '', batchQty: '', qtyFromRaw: '' }
    ]);
  };

  const handleRemoveRawRow = (idxToRemove) => {
    setRawItems(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleRawItemChange = (index, field, value) => {
    setRawItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (!selectedProductName || !selectedFGCode) {
      toast.error('Please select Product Name and FG Code.');
      return;
    }

    // Validate all raw items
    for (let idx = 0; idx < rawItems.length; idx++) {
      const row = rawItems[idx];
      if (!row.rawItemName || !row.itemCode || !row.qty || row.costPerUnit === '') {
        toast.error(`Please fill in all required fields for Raw Material #${idx + 1}.`);
        return;
      }
    }

    if (isEditMode && editingId) {
      // Edit mode: update single record
      const row = rawItems[0];
      const qtyVal = Number(row.qty);
      const costVal = Number(row.costPerUnit);
      const totalCostVal = qtyVal * costVal;

      const updated = materials.map(m => {
        if (m.id === editingId) {
          return {
            ...m,
            productName: selectedProductName,
            fgCode: selectedFGCode,
            rawItemName: row.rawItemName,
            itemCode: row.itemCode,
            unit: row.unit,
            qty: qtyVal,
            costPerUnit: costVal,
            totalCost: totalCostVal,
            batchQty: Number(row.batchQty) || 0,
            qtyFromRaw: Number(row.qtyFromRaw) || 0
          };
        }
        return m;
      });
      setMaterials(updated);
      localStorage.setItem('raw_materials', JSON.stringify(updated));
      toast.success('Raw Material record updated!');
    } else {
      // Add mode: save multiple records
      const newRecords = rawItems.map((row, idx) => {
        const qtyVal = Number(row.qty);
        const costVal = Number(row.costPerUnit);
        const totalCostVal = qtyVal * costVal;
        return {
          id: `rm-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          productName: selectedProductName,
          fgCode: selectedFGCode,
          rawItemName: row.rawItemName,
          itemCode: row.itemCode,
          unit: row.unit,
          qty: qtyVal,
          costPerUnit: costVal,
          totalCost: totalCostVal,
          batchQty: Number(row.batchQty) || 0,
          qtyFromRaw: Number(row.qtyFromRaw) || 0
        };
      });

      const updated = [...materials, ...newRecords];
      setMaterials(updated);
      localStorage.setItem('raw_materials', JSON.stringify(updated));
      toast.success(`${newRecords.length} Raw Material record(s) added!`);
    }

    setShowFormModal(false);
  };

  // Compile options lists for filters
  const productsList = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.productName))).filter(Boolean).sort();
  }, [materials]);

  const unitsList = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.unit))).filter(Boolean).sort();
  }, [materials]);

  // Apply filters
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (filters.productName && m.productName !== filters.productName) return false;
      if (filters.unit && m.unit !== filters.unit) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          m.productName.toLowerCase().includes(q) ||
          m.fgCode.toLowerCase().includes(q) ||
          m.rawItemName.toLowerCase().includes(q) ||
          m.itemCode.toLowerCase().includes(q)
        );
      }
      return true;
    }).reverse();
  }, [materials, filters]);

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const tableHeaders = [
    "Action", "Product Name", "FG Code", "Raw Item Name", "Item Code", "Unit", "Quantity (J/I)", "Cost Per Unit", "Total Cost", "Batch Qty", "Qty(From Raw Material)"
  ];

  const renderRow = (item, idx) => {
    return (
      <tr key={item.id || idx} className="hover:bg-indigo-50/30 transition-colors border-b border-gray-100 text-xs">
        <td className="px-4 py-3 text-center whitespace-nowrap">
          <div className="flex justify-center gap-1.5">
            <button
              onClick={() => handleEditClick(item)}
              className="p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded transition active:scale-95"
              title="Edit Details"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition active:scale-95"
              title="Delete Record"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
        <td className="px-4 py-3 text-center font-semibold text-gray-900 whitespace-nowrap uppercase">{item.productName}</td>
        <td className="px-4 py-3 text-center text-indigo-600 font-bold whitespace-nowrap">{item.fgCode || '-'}</td>
        <td className="px-4 py-3 text-center text-gray-900 whitespace-nowrap uppercase font-medium">{item.rawItemName}</td>
        <td className="px-4 py-3 text-center text-indigo-600 font-semibold whitespace-nowrap">{item.itemCode}</td>
        <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">{item.unit}</td>
        <td className="px-4 py-3 text-center text-slate-700 font-bold whitespace-nowrap">{item.qty}</td>
        <td className="px-4 py-3 text-center text-slate-600 font-semibold whitespace-nowrap">₹{item.costPerUnit.toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 text-center text-emerald-600 font-bold whitespace-nowrap">₹{item.totalCost.toLocaleString('en-IN')}</td>
        <td className="px-4 py-3 text-center text-slate-600 font-medium whitespace-nowrap">{item.batchQty}</td>
        <td className="px-4 py-3 text-center text-indigo-600 font-bold whitespace-nowrap">{item.qtyFromRaw}</td>
      </tr>
    );
  };

  const renderCard = (item, idx) => {
    return (
      <div key={item.id || idx} className="bg-white rounded-xl border border-indigo-50 shadow-sm p-4 space-y-3 transition-all hover:shadow-md hover:border-indigo-100">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 uppercase truncate max-w-[150px]">{item.rawItemName} ({item.itemCode})</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleEditClick(item)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="Edit"><Edit2 size={13} /></button>
            <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={13} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-lg p-2 border border-slate-100/50">
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Product Name</span>
            <span className="text-gray-700 font-semibold uppercase">{item.productName}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">FG Code</span>
            <span className="text-indigo-600 font-bold">{item.fgCode || '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight font-black">Quantity ({item.unit})</span>
            <span className="text-slate-700 font-black">{item.qty}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Cost Per Unit</span>
            <span className="text-slate-700 font-medium">₹{item.costPerUnit}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Total Cost</span>
            <span className="text-emerald-600 font-bold">₹{item.totalCost}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase text-[8px] tracking-tight">Batch Qty / Qty From Raw</span>
            <span className="text-indigo-600 font-medium">{item.batchQty} / {item.qtyFromRaw}</span>
          </div>
        </div>
      </div>
    );
  };

  const unitOptions = [
    { value: 'Kg', label: 'Kg' },
    { value: 'Pcs', label: 'Pcs' },
    { value: 'Ltrs', label: 'Ltrs' },
    { value: 'Meters', label: 'Meters' },
    { value: 'Ton', label: 'Ton' }
  ];

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-6 flex flex-col h-full min-h-0">
      
      {/* Header Filters & Add Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">
          
          {/* Search bar */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search raw materials..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-indigo-500 text-xs md:text-sm h-[32px] md:h-[38px]"
              />
            </div>
            <button
               onClick={() => setShowMobileFilters(!showMobileFilters)}
               className={`lg:hidden flex items-center justify-center rounded-lg shadow-sm h-[32px] w-[32px] flex-shrink-0 transition ${showMobileFilters ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
               title="Toggle Filters"
             >
               <Filter size={14} />
             </button>
             {!showMobileFilters && (
               <button
                 onClick={handleAddClick}
                 className="lg:hidden flex items-center justify-center bg-indigo-600 text-white rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
                 title="Add Record"
               >
                 <Plus size={16} />
               </button>
             )}
             <button
               onClick={handleClearFilters}
               className="lg:hidden flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95"
               title="Clear Filters"
             >
               <RotateCcw size={14} />
             </button>
          </div>

          {/* Filters Dropdown Group */}
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row lg:flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>
            
            {/* Products Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[150px]">
              <SearchableDropdown
                options={productsList.map(p => ({ value: p, label: p }))}
                value={filters.productName}
                onChange={(val) => setFilters({ ...filters, productName: val })}
                placeholder="All Products"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            {/* Units Dropdown */}
            <div className="flex-1 min-w-0 lg:min-w-[150px]">
              <SearchableDropdown
                options={unitsList.map(u => ({ value: u, label: u }))}
                value={filters.unit}
                onChange={(val) => setFilters({ ...filters, unit: val })}
                placeholder="All Units"
                className="h-[32px] md:h-[38px]"
                height="h-[32px] md:h-[38px]"
                rounded="rounded-lg"
              />
            </div>

            <button
              onClick={handleClearFilters}
              className="hidden lg:flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg w-[38px] h-[38px] hover:bg-gray-100 transition-colors shadow-sm"
              title="Clear Filters"
            >
              <RotateCcw size={16} />
            </button>

          </div>
        </div>

        {/* Add Record Button */}
        <button
          onClick={handleAddClick}
          className="hidden lg:flex bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg items-center justify-center transition shadow-sm w-[38px] h-[38px] flex-shrink-0"
          title="Add Raw Material"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <DataTable
          headers={tableHeaders}
          data={paginatedMaterials}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1400px"
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          totalResults={filteredMaterials.length}
          itemsPerPageOptions={[50, 100, 200, 500, 1000]}
        />
      </div>

      {/* Add/Edit Modal */}
      <ModalForm
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEditMode ? "Edit Raw Material" : "Add Raw Materials"}
        onSubmit={handleSave}
        submitText={isEditMode ? "Save Changes" : "Add Records"}
        cancelText="Cancel"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name Search */}
            <div className="space-y-1">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">Product Name *</label>
              <SearchableDropdown
                options={masterItems.map(item => ({ value: item.name, label: item.name }))}
                value={selectedProductName}
                onChange={handleProductSelect}
                placeholder="Search Product"
                className="w-full"
                height="h-[36px]"
                rounded="rounded"
              />
            </div>

            {/* FG Code Search */}
            <div className="space-y-1">
              <label className="block text-[11px] md:text-[13px] text-gray-700 uppercase tracking-tight font-semibold">FG Code *</label>
              <SearchableDropdown
                options={masterItems.map(item => ({ value: item.code, label: item.code }))}
                value={selectedFGCode}
                onChange={handleFGSelect}
                placeholder="Search FG Code"
                className="w-full"
                height="h-[36px]"
                rounded="rounded"
              />
            </div>
          </div>

          {/* Raw Materials List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-1 border-b border-indigo-50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Raw Material Items</h4>
              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleAddRawRow}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-black text-[10px] uppercase transition active:scale-95 border border-indigo-200"
                >
                  <Plus size={11} />
                  <span>Add Material Row</span>
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
              {rawItems.map((row, index) => (
                <div key={index} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 relative space-y-3">
                  {/* Delete button (only if more than 1 item and in add mode) */}
                  {!isEditMode && rawItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRawRow(index)}
                      className="absolute right-2 top-2 p-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                      title="Remove Row"
                    >
                      <X size={14} />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Raw Item Name */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-500 uppercase tracking-tight font-bold">Raw Item Name *</label>
                      <input
                        type="text"
                        value={row.rawItemName}
                        onChange={(e) => handleRawItemChange(index, 'rawItemName', e.target.value)}
                        placeholder="e.g. Cover Milan Jumbo"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                        required
                      />
                    </div>

                    {/* Item Code */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-500 uppercase tracking-tight font-bold">Item Code *</label>
                      <input
                        type="text"
                        value={row.itemCode}
                        onChange={(e) => handleRawItemChange(index, 'itemCode', e.target.value)}
                        placeholder="e.g. CMJ"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Unit */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-500 uppercase tracking-tight font-bold">Unit *</label>
                      <select
                        value={row.unit}
                        onChange={(e) => handleRawItemChange(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px] bg-white"
                        required
                      >
                        {unitOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-500 uppercase tracking-tight font-bold">Quantity *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.000000001"
                        value={row.qty}
                        onChange={(e) => handleRawItemChange(index, 'qty', e.target.value)}
                        placeholder="Quantity"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                        required
                      />
                    </div>

                    {/* Cost Per Unit */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-500 uppercase tracking-tight font-bold">Cost / Unit *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.costPerUnit}
                        onChange={(e) => handleRawItemChange(index, 'costPerUnit', e.target.value)}
                        placeholder="Cost"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                        required
                      />
                    </div>

                    {/* Batch Qty */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-400 uppercase tracking-tight">Batch Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={row.batchQty}
                        onChange={(e) => handleRawItemChange(index, 'batchQty', e.target.value)}
                        placeholder="Batch Qty"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                      />
                    </div>

                    {/* Qty From Raw */}
                    <div className="space-y-1">
                      <label className="block text-[10px] md:text-[11px] text-gray-400 uppercase tracking-tight">Qty From Raw</label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={row.qtyFromRaw}
                        onChange={(e) => handleRawItemChange(index, 'qtyFromRaw', e.target.value)}
                        placeholder="From Raw"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs h-[34px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </ModalForm>

    </div>
  );
}
