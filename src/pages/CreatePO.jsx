import React, { useState, useEffect, useRef } from 'react';
import { Package, Box, Building2, ScanLine, Search, Check, Save, PlusCircle, CheckCircle2, X, Pencil, Trash2, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchProductByBarcode, createPO, getPOs, getNextPoNumber, createProduct, getProducts } from '../services/api';
import CameraScanner from '../components/CameraScanner';
import ExcelImportModal from '../components/ExcelImportModal';

const EditProductModal = ({ product, onClose, onSave, onDelete }) => {
  const [name, setName] = useState(product.name);
  const [totalQty, setTotalQty] = useState(product.totalQty.toString());

  const handleSave = (e) => {
    e.preventDefault();
    const parsedTotal = parseInt(totalQty, 10);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      alert('Please enter a valid total quantity');
      return;
    }
    if (parsedTotal < product.packedQty) {
      alert(`Total Quantity cannot be less than already packed quantity (${product.packedQty})!`);
      return;
    }
    onSave(product.barcode, { name: name.trim() || product.name, totalQty: parsedTotal });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-w-md w-full overflow-y-auto max-h-[85vh] md:max-h-none border border-slate-200 animate-fade-in">
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Pencil size={18} className="text-indigo-400" /> Edit Product
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Barcode</label>
            <input
              value={product.barcode}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">ASIN</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
              placeholder="Enter ASIN..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Total Quantity</label>
              <input
                type="number"
                min={product.packedQty}
                value={totalQty}
                onChange={(e) => setTotalQty(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Packed Pcs</label>
              <input
                value={product.packedQty}
                disabled
                className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-700 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to remove "${product.name}" from this order?`)) {
                  onDelete(product.barcode);
                  onClose();
                }
              }}
              className="px-3.5 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 size={15} /> Remove
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Check size={16} /> Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddProductModal = ({ onClose, onSave, activeCompanyName }) => {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [totalQty, setTotalQty] = useState('');
  const [companyName, setCompanyName] = useState(activeCompanyName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const parsedTotal = parseInt(totalQty, 10);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      alert('Please enter a valid total quantity');
      return;
    }
    if (!barcode.trim() || !name.trim()) {
      alert('Barcode and ASIN are required');
      return;
    }
    try {
      setIsSubmitting(true);
      const newProduct = await createProduct({
        barcode: barcode.trim(),
        name: name.trim(),
        totalQty: parsedTotal,
        companyName: companyName.trim()
      });
      onSave({
        barcode: newProduct.barcode,
        name: newProduct.name,
        companyName: newProduct.companyName,
        totalQty: newProduct.totalQty,
        packedQty: 0
      });
      onClose();
    } catch (err) {
      alert('Failed to add product. ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
        <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-w-md w-full overflow-y-auto max-h-[85vh] md:max-h-none border border-slate-200 animate-fade-in">
          <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <PlusCircle size={18} className="text-emerald-400" /> Add New Product
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Barcode</label>
              <div className="flex gap-2">
                <input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="flex-1 w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                  placeholder="Scan or type barcode..."
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="px-3 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center shrink-0"
                  onClick={() => setIsScannerOpen(true)}
                  title="Scan Barcode"
                >
                  <ScanLine size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">ASIN</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                placeholder="Enter ASIN..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Company Name (Optional)</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                placeholder="Assign to specific company..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Total Quantity</label>
              <input
                type="number"
                min="1"
                value={totalQty}
                onChange={(e) => setTotalQty(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                required
                placeholder="Initial inventory..."
              />
            </div>

            <div className="pt-2 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Check size={16} /> {isSubmitting ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {isScannerOpen && (
        <CameraScanner
          onResult={(code) => {
            setBarcode(code);
            setIsScannerOpen(false);
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </>
  );
};


export default function CreatePO() {
  const [companyName, setCompanyName] = useState(() => {
    return localStorage.getItem('active_po_company') || '';
  });

  // App state
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('active_po_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [boxes, setBoxes] = useState(() => {
    try {
      const saved = localStorage.getItem('active_po_boxes');
      return saved ? JSON.parse(saved) : [{ name: 'Box 1', items: [] }];
    } catch {
      return [{ name: 'Box 1', items: [] }];
    }
  });

  const [activeBoxName, setActiveBoxName] = useState('Box 1');
  const [editingBoxIndex, setEditingBoxIndex] = useState(null);
  const [editBoxNameValue, setEditBoxNameValue] = useState('');

  // Form input states
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productNameInput, setProductNameInput] = useState('');
  const [remainingInput, setRemainingInput] = useState('');
  const [pcsInput, setPcsInput] = useState('');
  const [activeProduct, setActiveProduct] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedFileMeta, setImportedFileMeta] = useState(() => {
    try {
      const saved = localStorage.getItem('active_po_imported_meta');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [nextPoNo, setNextPoNo] = useState('PO-0001');

  const [availableCompanies, setAvailableCompanies] = useState([]);
  const loadedCompanyRef = useRef('');

  const pcsInputRef = useRef(null);
  const productsRef = useRef(products);

  useEffect(() => {
    // Check if we need to auto-open scanner (coming from another page)
    if (sessionStorage.getItem('auto_open_scanner') === 'true') {
      setIsCameraOpen(true);
      sessionStorage.removeItem('auto_open_scanner');
    }

    // Listen for events if we're already on this page
    const handleOpenScanner = () => setIsCameraOpen(true);
    window.addEventListener('open-camera-scanner', handleOpenScanner);
    return () => window.removeEventListener('open-camera-scanner', handleOpenScanner);
  }, []);

  const refreshNextPoNo = async () => {
    try {
      const num = await getNextPoNumber();
      if (num) setNextPoNo(num);
    } catch (err) {
      console.error('Failed to get next PO number:', err);
    }
  };

  useEffect(() => {
    const globalCode = sessionStorage.getItem('global_scanned_barcode');
    if (globalCode) {
      sessionStorage.removeItem('global_scanned_barcode');
      setBarcodeInput(globalCode);
      lookupBarcode(globalCode);
      // Optional: focus the QTY input or model number input after a slight delay
      setTimeout(() => {
        const qtyInput = document.getElementById('qty-to-pack');
        if (qtyInput) qtyInput.focus();
      }, 500);
    }
  }, []);

  useEffect(() => {
    refreshNextPoNo();
  }, []);

  const handleExportExcel = async () => {
    try {
      let dbProducts = [];
      try {
        dbProducts = await getProducts();
      } catch (err) {
        console.warn("Failed to fetch products for export, falling back to local products", err);
      }

      // Filter by company name if we have one selected
      let companyProducts = companyName
        ? dbProducts.filter(p => (p.companyName || '').toLowerCase() === companyName.toLowerCase())
        : dbProducts;

      if (companyProducts.length === 0 && (!products || products.length === 0)) {
        alert("No products to export!");
        return;
      }

      // Merge list: Start with all DB products, then append any scanned products that aren't in DB
      const exportList = [...companyProducts];
      if (products) {
        products.forEach(p => {
          const pCode = String(p.barcode || '').trim().toLowerCase();
          if (!pCode) return;
          const exists = companyProducts.some(cp => {
            const dbBarcode = String(cp.barcode || '').trim().toLowerCase();
            const dbAsin = String(cp.asin || '').trim().toLowerCase();
            const dbModel = String(cp.modelNumber || '').trim().toLowerCase();
            const dbName = String(cp.name || '').trim().toLowerCase();
            return (dbBarcode && dbBarcode === pCode) ||
                   (dbAsin && dbAsin === pCode) ||
                   (dbModel && dbModel === pCode) ||
                   (dbName && dbName === pCode);
          });
          if (!exists) {
            exportList.push(p);
          }
        });
      }

      const excelData = exportList.map((dbProd, idx) => {
        const dbBarcode = String(dbProd.barcode || '').trim().toLowerCase();
        const dbAsin = String(dbProd.asin || '').trim().toLowerCase();
        const dbModel = String(dbProd.modelNumber || '').trim().toLowerCase();
        const dbName = String(dbProd.name || '').trim().toLowerCase();

        // Robust matching to find if this item was packed locally
        const localProd = (products || []).find(p => {
          const pCode = String(p.barcode || '').trim().toLowerCase();
          if (!pCode) return false;
          return (dbBarcode && pCode === dbBarcode) || 
                 (dbAsin && pCode === dbAsin) || 
                 (dbModel && pCode === dbModel) ||
                 (dbName && pCode === dbName);
        }) || (dbProd.packedQty !== undefined ? dbProd : null); // If dbProd IS the localProd (appended)

        const lpCode = localProd ? String(localProd.barcode || '').trim().toLowerCase() : '';

        // Quantities
        const totalQty = localProd ? localProd.totalQty : (dbProd.totalQty || 0);
        const packedQty = localProd ? localProd.packedQty : 0;
        const historicalPacked = localProd ? (localProd.historicalPacked || 0) : (dbProd.totalPacked || 0);

        // Boxes
        const itemBoxes = [];
        if (boxes) {
          boxes.forEach(box => {
            const boxItem = (box.items || []).find(bi => {
              const biCode = String(bi.barcode || '').trim().toLowerCase();
              if (!biCode) return false;
              return (dbBarcode && biCode === dbBarcode) || 
                     (dbAsin && biCode === dbAsin) || 
                     (dbModel && biCode === dbModel) ||
                     (dbName && biCode === dbName) ||
                     (lpCode && biCode === lpCode);
            });
            if (boxItem && boxItem.pcs > 0) {
              itemBoxes.push(`${boxItem.pcs}(${box.name})`);
            }
          });
        }

        return {
          "#": idx + 1,
          "Model Number": localProd?.name || dbProd.name || dbProd.modelNumber || dbProd.asin || dbProd.barcode,
          "Barcode": dbProd.barcode,
          "Company": dbProd.companyName || companyName || 'Common',
          "Total Qty": totalQty,
          "Packed": packedQty,
          "Boxes": itemBoxes.join(', '),
          "Remaining": Math.max(0, totalQty - historicalPacked - packedQty)
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Current Order");
      XLSX.writeFile(workbook, `Draft_${nextPoNo}_${companyName || 'PO'}.xlsx`);
    } catch (err) {
      console.error(err);
      alert("An error occurred while exporting.");
    }
  };

  useEffect(() => {
    const handleEvent = () => handleExportExcel();
    window.addEventListener('export-excel', handleEvent);
    return () => window.removeEventListener('export-excel', handleEvent);
  }, [products, boxes, companyName, nextPoNo]);

  // Sync ref and localStorage
  useEffect(() => {
    productsRef.current = products;
    localStorage.setItem('active_po_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('active_po_company', companyName);
  }, [companyName]);

  useEffect(() => {
    localStorage.setItem('active_po_boxes', JSON.stringify(boxes));
  }, [boxes]);

  useEffect(() => {
    if (importedFileMeta) {
      localStorage.setItem('active_po_imported_meta', JSON.stringify(importedFileMeta));
    } else {
      localStorage.removeItem('active_po_imported_meta');
    }
  }, [importedFileMeta]);

  const handleClearForm = (fullClear = false) => {
    sessionStorage.removeItem('force_blank_po');

    if (fullClear) {
      setCompanyName('');
      setImportedFileMeta(null);
      localStorage.removeItem('active_po_company');
      localStorage.removeItem('active_po_imported_meta');
      loadedCompanyRef.current = '';
    }

    setProducts([]);
    setBoxes([{ name: 'Box 1', items: [] }]);
    setActiveBoxName('Box 1');
    setBarcodeInput('');
    setProductNameInput('');
    setRemainingInput('');
    setPcsInput('');
    setActiveProduct(null);
    localStorage.removeItem('active_po_products');
    localStorage.removeItem('active_po_boxes');
    refreshNextPoNo();
  };

  // Called when Excel file is imported and saved
  const handleImportSuccess = ({ rawItems, companyName: importedCompany, fileName, totalQtySum, products: savedProducts }) => {
    // Clear out any existing packing progress to start fresh for this new import
    handleClearForm(false);
    
    if (importedCompany && !companyName) {
      setCompanyName(importedCompany);
    }

    setImportedFileMeta({
      fileName,
      count: rawItems.length,
      totalQty: totalQtySum,
      packedQty: 0
    });

    setSaveSuccessMsg(`Excel Imported: ${rawItems.length} products loaded from ${fileName} (${totalQtySum} total requested pcs)`);
    setTimeout(() => setSaveSuccessMsg(''), 6000);
  };

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const pos = await getPOs();
        if (!pos) return;

        const companies = [...new Set(pos.map(p => p.companyName).filter(Boolean))];
        setAvailableCompanies(companies);

        if (products.length > 0) {
          loadedCompanyRef.current = (companyName || '').toLowerCase();
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    fetchInitialData();

    const onClear = (e) => {
      const isFull = e.detail?.fullClear === true;
      handleClearForm(isFull);
    };
    const onOpenImport = () => setIsImportModalOpen(true);

    window.addEventListener('clear-po-form', onClear);
    window.addEventListener('open-import-modal', onOpenImport);

    return () => {
      window.removeEventListener('clear-po-form', onClear);
      window.removeEventListener('open-import-modal', onOpenImport);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Company watcher removed: New POs should start completely blank.

  const packItem = (code, name, pcs, parsedRemain = NaN) => {
    const existing = productsRef.current.find(p =>
      (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
      (p.asin && p.asin.toLowerCase() === code.toLowerCase()) ||
      (p.modelNumber && p.modelNumber.toLowerCase() === code.toLowerCase()) ||
      (p.name && p.name.toLowerCase() === code.toLowerCase())
    );
    const canonicalBarcode = existing ? existing.barcode : code;
    const currentPacked = existing ? existing.packedQty : 0;

    let actualRemaining = isNaN(parsedRemain) ? pcs : parsedRemain;
    if (existing) {
      actualRemaining = existing.totalQty - (existing.historicalPacked || 0) - existing.packedQty;
    }

    if (actualRemaining <= 0) {
      alert(`Cannot pack item! 0 remaining for this product.`);
      return false;
    }

    // Check if packing exceeds remaining qty
    if (pcs > actualRemaining) {
      alert(`Cannot pack more than remaining quantity! (Remaining: ${actualRemaining}, Trying to pack: ${pcs})`);
      return false;
    }

    let newTotal = existing ? existing.totalQty : 0;
    if (!isNaN(parsedRemain) && parsedRemain > 0) {
      const histPacked = activeProduct ? (activeProduct.historicalPacked || 0) : 0;
      newTotal = currentPacked + parsedRemain + histPacked;
    }
    const newPacked = currentPacked + pcs;
    newTotal = Math.max(newTotal, newPacked);

    // Update products list
    if (existing) {
      setProducts(prev => prev.map(p =>
        p.barcode === canonicalBarcode
          ? {
            ...p,
            name: name || p.name,
            totalQty: newTotal,
            packedQty: newPacked
          }
          : p
      ));
    } else {
      setProducts(prev => [...prev, {
        barcode: canonicalBarcode,
        name: name,
        asin: activeProduct?.asin || '',
        modelNumber: activeProduct?.modelNumber || '',
        companyName: activeProduct?.companyName || '',
        totalQty: newTotal,
        historicalPacked: activeProduct?.historicalPacked || 0,
        packedQty: newPacked
      }]);
    }

    // Update or create active box
    setBoxes(prev => {
      const boxTarget = activeBoxName.trim() || 'Box 1';
      const boxIndex = prev.findIndex(b => b.name === boxTarget);
      if (boxIndex >= 0) {
        const newBoxes = [...prev];
        const b = { ...newBoxes[boxIndex] };
        const existingItem = b.items.find(i => i.barcode === canonicalBarcode);
        if (existingItem) {
          b.items = b.items.map(i => i.barcode === canonicalBarcode ? { ...i, pcs: i.pcs + pcs } : i);
        } else {
          b.items = [...b.items, { barcode: canonicalBarcode, name: name, pcs }];
        }
        newBoxes[boxIndex] = b;
        return newBoxes;
      } else {
        return [...prev, {
          name: boxTarget,
          items: [{ barcode: canonicalBarcode, name: name, pcs }]
        }];
      }
    });

    // Reset inputs for next item
    setBarcodeInput('');
    setProductNameInput('');
    setRemainingInput('');
    setPcsInput('');
    setActiveProduct(null);
    return true;
  };

  const saveBoxName = (idx) => {
    const newName = editBoxNameValue.trim();
    if (newName && newName !== boxes[idx].name) {
      setBoxes(prev => {
        const newBoxes = [...prev];
        const oldName = newBoxes[idx].name;
        newBoxes[idx] = { ...newBoxes[idx], name: newName };
        if (activeBoxName.trim() === oldName) {
          setActiveBoxName(newName);
        }
        return newBoxes;
      });
    }
    setEditingBoxIndex(null);
  };

  const handleDeleteBox = (indexToRemove) => {
    const boxToRemove = boxes[indexToRemove];
    if (window.confirm(`Are you sure you want to delete "${boxToRemove.name}"?`)) {
      // Return packed quantities to products
      setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        boxToRemove.items.forEach(item => {
          const productIndex = newProducts.findIndex(p => p.barcode === item.barcode);
          if (productIndex >= 0) {
            newProducts[productIndex] = {
              ...newProducts[productIndex],
              packedQty: Math.max(0, newProducts[productIndex].packedQty - item.pcs)
            };
          }
        });
        return newProducts;
      });

      // Remove the box
      setBoxes(prev => {
        const remainingBoxes = prev.filter((_, idx) => idx !== indexToRemove);
        if (remainingBoxes.length === 0) {
          return [{ name: 'Box 1', items: [] }];
        }
        return remainingBoxes;
      });
      
      // If we deleted the active box, switch to the first available box
      if (activeBoxName.trim() === boxToRemove.name) {
        if (boxes.length > 1) {
          const firstAvailable = boxes.find((_, idx) => idx !== indexToRemove);
          setActiveBoxName(firstAvailable.name);
        } else {
          setActiveBoxName('Box 1');
        }
      }
    }
  };

  // Lookup barcode function (used for typing, pressing Enter, or camera scan)
  const lookupBarcode = async (codeToLookup, shouldFocus = false) => {
    const code = (codeToLookup || '').trim();
    if (!code) return;

    let foundProduct = null;

    // 1. Check local products list first with latest products ref (checking barcode, asin, modelNumber, or name)
    const localMatch = productsRef.current.find(p =>
      (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
      (p.asin && p.asin.toLowerCase() === code.toLowerCase()) ||
      (p.modelNumber && p.modelNumber.toLowerCase() === code.toLowerCase()) ||
      (p.name && p.name.toLowerCase() === code.toLowerCase())
    );

    if (localMatch) {
      foundProduct = localMatch;
    } else {
      // 2. Fetch from DB (API searches barcode, asin, modelNumber, and name)
      try {
        const dbProduct = await fetchProductByBarcode(code);
        if (dbProduct) {
          foundProduct = {
            barcode: dbProduct.barcode || code,
            name: dbProduct.name || dbProduct.modelNumber || dbProduct.asin || code,
            asin: dbProduct.asin || '',
            modelNumber: dbProduct.modelNumber || '',
            companyName: dbProduct.companyName || '',
            totalQty: dbProduct.totalQty || 0,
            historicalPacked: dbProduct.packedQty || 0,
            packedQty: 0
          };
        }
      } catch (err) {
        // Not found in DB -> prepare for manual entry
      }
    }

    // 3. Fallback: custom product
    if (!foundProduct) {
      foundProduct = {
        barcode: code,
        name: code,
        asin: code,
        modelNumber: '',
        companyName: '',
        totalQty: 0,
        packedQty: 0
      };
    }

    setActiveProduct(foundProduct);
    // Auto-fill barcode and ASIN / Model Number
    setBarcodeInput(foundProduct.barcode || code);
    setProductNameInput(foundProduct.name || foundProduct.modelNumber || foundProduct.asin || code);
    const rem = Math.max(0, foundProduct.totalQty - (foundProduct.historicalPacked || 0) - foundProduct.packedQty);
    setRemainingInput(rem > 0 || foundProduct.totalQty > 0 ? rem.toString() : '');
    if (shouldFocus && pcsInputRef.current) pcsInputRef.current.focus();
  };

  // Instant barcode change check + debounced network lookup
  const handleBarcodeChange = (e) => {
    const val = e.target.value;
    setBarcodeInput(val);
    const code = val.trim();
    if (!code) {
      setActiveProduct(null);
      return;
    }
    // Instantly check local products without waiting
    const localMatch = productsRef.current.find(p =>
      (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
      (p.asin && p.asin.toLowerCase() === code.toLowerCase()) ||
      (p.modelNumber && p.modelNumber.toLowerCase() === code.toLowerCase()) ||
      (p.name && p.name.toLowerCase() === code.toLowerCase())
    );
    if (localMatch) {
      setActiveProduct(localMatch);
      setProductNameInput(localMatch.name || localMatch.modelNumber || localMatch.asin);
      const rem = Math.max(0, localMatch.totalQty - (localMatch.historicalPacked || 0) - localMatch.packedQty);
      setRemainingInput(rem.toString());
    }
  };

  // Auto-lookup barcode when typing (with debounce) for backend DB products
  useEffect(() => {
    const code = barcodeInput.trim();
    if (!code) return;

    const timer = setTimeout(() => {
      lookupBarcode(code);
    }, 300);

    return () => clearTimeout(timer);
  }, [barcodeInput]);

  // Handle changes to Remaining (main bracket) input
  const handleRemainingChange = (e) => {
    const val = e.target.value;
    setRemainingInput(val);
    const num = parseInt(val, 10);
    const newRemain = isNaN(num) ? 0 : num;
    if (activeProduct) {
      const newTotal = newRemain + activeProduct.packedQty + (activeProduct.historicalPacked || 0);
      setActiveProduct(prev => prev ? { ...prev, totalQty: newTotal } : null);
      setProducts(prev => prev.map(p =>
        p.barcode === activeProduct.barcode ? { ...p, totalQty: newTotal } : p
      ));
    }
  };

  // Handle changes to Product Name input
  const handleProductNameChange = (e) => {
    const val = e.target.value;
    setProductNameInput(val);
    if (activeProduct) {
      setActiveProduct(prev => prev ? { ...prev, name: val } : null);
      setProducts(prev => prev.map(p =>
        p.barcode === activeProduct.barcode ? { ...p, name: val } : p
      ));
    }
  };

  const handleBoxChange = (e) => {
    setActiveBoxName(e.target.value);
  };

  // Pack items into box and update table
  const handleAdd = (e) => {
    if (e) e.preventDefault();

    if (!companyName.trim()) {
      alert("Please enter or select a Company Name before packing items.");
      return;
    }

    const pcs = parseInt(pcsInput, 10);
    if (isNaN(pcs) || pcs <= 0) {
      alert("Please enter a valid number of pieces (Pcs)");
      if (pcsInputRef.current) pcsInputRef.current.focus();
      return;
    }

    const code = barcodeInput.trim() || `ITEM-${Date.now().toString().slice(-4)}`;
    const name = productNameInput.trim() || code;
    const parsedRemain = parseInt(remainingInput, 10);

    packItem(code, name, pcs, parsedRemain);
  };

  const handleSavePO = async () => {
    if (!companyName.trim()) {
      alert('Please enter a Company Name before saving.');
      return;
    }
    if (products.length === 0) {
      alert('Please pack at least one product before saving.');
      return;
    }

    try {
      setIsSaving(true);
      const currentPoBoxes = boxes;
      const currentPoPcs = currentPoBoxes.reduce((sum, b) =>
        sum + (b.items ? b.items.reduce((s, i) => s + (i.pcs || 0), 0) : 0), 0
      );

      const savedPO = await createPO({
        companyName,
        totalPcs: currentPoPcs > 0 ? currentPoPcs : totalPackedPcs,
        items: products.filter(p => p.packedQty > 0).map(p => ({
          barcode: p.barcode,
          name: p.name,
          companyName: p.companyName,
          totalQty: p.totalQty,
          qty: p.packedQty,
          price: 0
        })),
        boxes: currentPoBoxes,
        totalAmount: 0
      });

      setSaveSuccessMsg(`Purchase Order (${savedPO.poNo}) created and saved!`);
      setTimeout(() => setSaveSuccessMsg(''), 6000);
      
      if (importedFileMeta) {
        setImportedFileMeta(prev => ({
          ...prev,
          packedQty: (prev.packedQty || 0) + (currentPoPcs > 0 ? currentPoPcs : totalPackedPcs)
        }));
      }

      handleClearForm(false); // Retain imported master sheet and company
    } catch (err) {
      console.error(err);
      alert('Failed to save PO. ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const handleStartNewPO = async () => {
    if (products.length > 0) {
      if (!companyName.trim()) {
        alert('Please enter a Company Name to save the current PO before starting a new one.');
        return;
      }
      await handleSavePO(); // Automatically retains sheet data
    } else {
      handleClearForm(false); // Just clear the empty product list
    }
  };

  const handleClearAllOrder = () => {
    if (!window.confirm("Are you sure you want to clear all products and start a completely blank order?")) {
      return;
    }
    handleClearForm(true); // Explicitly clear everything, including imported sheet
  };

  const handleSaveProductEdit = (barcode, updatedData) => {
    setProducts(prev => prev.map(p =>
      p.barcode === barcode
        ? { ...p, ...updatedData }
        : p
    ));

    // Also update activeProduct if it is currently selected in the scanner
    if (activeProduct && activeProduct.barcode === barcode) {
      setActiveProduct(prev => ({ ...prev, ...updatedData }));
      setProductNameInput(updatedData.name);
      const rem = Math.max(0, updatedData.totalQty - activeProduct.packedQty);
      setRemainingInput(rem.toString());
    }
  };

  const handleDeleteProduct = (barcode) => {
    setProducts(prev => prev.filter(p => p.barcode !== barcode));
    // Also remove from boxes
    setBoxes(prev => prev.map(b => ({
      ...b,
      items: b.items.filter(i => i.barcode !== barcode)
    })));
    if (activeProduct && activeProduct.barcode === barcode) {
      setActiveProduct(null);
      setBarcodeInput('');
      setProductNameInput('');
      setRemainingInput('');
      setPcsInput('');
    }
  };

  const totalValue = activeProduct ? activeProduct.totalQty : (parseInt(remainingInput, 10) || 0);
  const packedValue = activeProduct ? activeProduct.packedQty : 0;
  const currentRemaining = activeProduct
    ? Math.max(0, activeProduct.totalQty - (activeProduct.historicalPacked || 0) - activeProduct.packedQty)
    : (parseInt(remainingInput, 10) || 0);

  // Check if user is typing a new item not yet in the products table
  const draftBarcode = barcodeInput.trim();
  const isDraftNewItem = draftBarcode && !products.some(p => p.barcode.toLowerCase() === draftBarcode.toLowerCase());

  // Products count and sum of total quantity across all products (including draft item if being added)
  const totalProductsCount = products.length + (isDraftNewItem ? 1 : 0);
  const sumTotalQty = products.reduce((sum, p) => sum + (p.totalQty || 0), 0) + (isDraftNewItem ? totalValue : 0);
  const totalPackedPcs = products.reduce((sum, p) => sum + (p.packedQty || 0), 0);
  const totalHistoricalPacked = products.reduce((sum, p) => sum + (p.historicalPacked || 0), 0);

  const filterCode = barcodeInput.trim().toLowerCase();
  const displayedProducts = filterCode
    ? products.filter(p =>
      (p.barcode && p.barcode.toLowerCase().includes(filterCode)) ||
      (p.asin && p.asin.toLowerCase().includes(filterCode)) ||
      (p.modelNumber && p.modelNumber.toLowerCase().includes(filterCode)) ||
      (p.name && p.name.toLowerCase().includes(filterCode))
    )
    : products;

  return (
    <div className="space-y-6">
      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        initialCompanyName={companyName}
        availableCompanies={availableCompanies}
      />

      {/* Add Product Modal */}
      {isAddProductModalOpen && (
        <AddProductModal
          activeCompanyName={companyName}
          onClose={() => setIsAddProductModalOpen(false)}
          onSave={(prod) => {
            // Check if already in list, if not add it
            if (!products.some(p => p.barcode === prod.barcode)) {
              setProducts(prev => [...prev, prod]);

              // Push to imported file database tracking as well
              if (importedFileMeta) {
                setImportedFileMeta(prev => ({
                  ...prev,
                  count: prev.count + 1,
                  totalQty: prev.totalQty + (prod.totalQty || 0)
                }));
              }
            }
            setActiveProduct(prod);
            setBarcodeInput(prod.barcode);
            setProductNameInput(prod.name);
            setRemainingInput(prod.totalQty.toString());
            setSaveSuccessMsg(`Product ${prod.name} added successfully!`);
            setTimeout(() => setSaveSuccessMsg(''), 3000);
          }}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProductEdit}
          onDelete={handleDeleteProduct}
        />
      )}

      {isCameraOpen && (
        <CameraScanner
          onResult={(code) => {
            setBarcodeInput(code);
            setIsCameraOpen(false);
            lookupBarcode(code, true);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Save Success Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="text-emerald-600" size={20} />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg('')}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* 1. Company Name card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e4e6f0] p-3 sm:p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-bold text-[#565b73] flex items-center gap-2 uppercase tracking-wider">
              <Building2 size={20} className="text-indigo-700" /> Company Name
            </label>
            <button
              type="button"
              onClick={() => {
                setCompanyName('');
                setTimeout(() => document.getElementById('company-input')?.focus(), 10);
              }}
              className="text-[12px] font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-full flex items-center gap-1"
            >
              <PlusCircle size={14} /> Add New
            </button>
          </div>
          <input
            id="company-input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full h-[52px] px-4 bg-[#f8f9fc] border-[1.5px] border-[#e4e6f0] rounded-2xl outline-none focus:bg-white focus:border-indigo-700 transition-all font-medium text-[15px]"
            placeholder="e.g. Acme Corp"
            list="company-list"
          />
          <datalist id="company-list">
            {availableCompanies.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>

        {/* 2. Two tiles side by side: PO NUMBER and TOTAL QUANTITY */}
        <div className="flex items-center gap-3 w-full">
          {/* PO Number Badge */}
          <div className="bg-indigo-50 px-4 py-3 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1 truncate">PO Number</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-indigo-900">{nextPoNo}</span>
          </div>

          {/* Quantity Badge */}
          <div className="bg-white px-4 py-3 rounded-2xl border border-[#e4e6f0] flex flex-col items-center justify-center flex-1 min-w-0 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#565b73] mb-1 truncate">Remaining / Total</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-extrabold text-[#14172b]">
                {Math.max(0, 
                  (importedFileMeta ? importedFileMeta.totalQty : sumTotalQty) 
                  - (importedFileMeta ? (importedFileMeta.packedQty || 0) : totalHistoricalPacked) 
                  - totalPackedPcs
                )}
              </span>
              <span className="text-sm font-bold text-slate-400">
                / {importedFileMeta ? importedFileMeta.totalQty : sumTotalQty}
              </span>
            </div>
            <span className="text-[11px] text-[#565b73] font-medium mt-0.5 truncate">
              Packed: <b className="text-indigo-700">{totalPackedPcs} pcs</b>
            </span>
          </div>
        </div>

      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Scanner and Boxes */}
        <div className="lg:col-span-1 space-y-6">

          {/* Scanner Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ScanLine size={18} className="text-indigo-500" /> Packing Scanner
              </h2>
              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                Scan or Manual
              </span>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Barcode</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      value={barcodeInput}
                      onChange={handleBarcodeChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          lookupBarcode(barcodeInput, true);
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-mono text-sm"
                      placeholder="Scan or type barcode..."
                      autoFocus
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-medium shrink-0"
                    onClick={() => setIsCameraOpen(true)}
                    title="Open Camera Scanner"
                  >
                    <ScanLine size={16} />
                  </button>
                </div>
              </div>

              {/* Model Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Model Number</label>
                <input
                  type="text"
                  value={productNameInput}
                  onChange={handleProductNameChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium text-slate-800 text-sm transition-all"
                  placeholder="Enter Model Number..."
                />
              </div>


              {/* Product Info Bar */}
              {(activeProduct || remainingInput) && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Total Qty:</span>
                    <strong className="text-slate-700 font-bold">{totalValue}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Packed:</span>
                    <strong className="text-indigo-600 font-bold">{packedValue}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500 font-medium">Remaining:</span>
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${currentRemaining <= 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {currentRemaining}
                    </span>
                  </div>
                </div>
              )}

              {/* Main Bracket: Total Qty / Remaining & Pcs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Total Qty <span className="text-[9px] text-orange-600 font-bold bg-orange-50 border border-orange-200 px-1 py-0.5 rounded ml-0.5">Remaining</span>
                    </label>
                    {activeProduct && activeProduct.packedQty > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        Packed: <strong className="text-indigo-600">{activeProduct.packedQty}</strong>
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={remainingInput}
                    onChange={handleRemainingChange}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-base"
                    placeholder="Remaining"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-indigo-600">Pcs</label>
                    {activeProduct && activeProduct.packedQty > 0 && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        Packed: <strong className="text-indigo-600">{activeProduct.packedQty}</strong>
                      </span>
                    )}
                  </div>
                  <input
                    ref={pcsInputRef}
                    type="number"
                    min="1"
                    value={pcsInput}
                    onChange={(e) => setPcsInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-base"
                    placeholder="Qty to pack"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Target Box</label>
                <input
                  list="box-options"
                  value={activeBoxName}
                  onChange={handleBoxChange}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-800 text-sm"
                  placeholder="Type or select a box..."
                />
                <datalist id="box-options">
                  {boxes.map((b, idx) => (
                    <option key={idx} value={b.name} />
                  ))}
                </datalist>
              </div>

              <button
                type="submit"
                disabled={!pcsInput || parseInt(pcsInput, 10) <= 0}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 shadow-sm text-sm"
              >
                <Check size={18} /> Pack Items
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Tables */}
        <div className="lg:col-span-2 space-y-6">

          {/* Products Summary (ALWAYS LIVE) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 sm:p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-[15px] sm:text-base">
                <Package size={18} className="text-indigo-500" /> Overall Order Status
                <span className="flex items-center gap-1 ml-1 sm:ml-2 text-emerald-600 text-[10px] sm:text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                </span>
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">
                  {(products.length + (isDraftNewItem ? 1 : 0))} {(products.length + (isDraftNewItem ? 1 : 0)) === 1 ? 'Product' : 'Products'} Listed
                </span>

                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded hover:bg-indigo-50 font-medium flex items-center gap-1 border border-transparent hover:border-indigo-100"
                  title="Add New Product to Database"
                >
                  <PlusCircle size={14} /> Add Product
                </button>
                {products.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllOrder}
                    className="text-xs text-slate-400 hover:text-rose-600 transition-colors px-2 py-1 rounded hover:bg-rose-50 border border-transparent hover:border-rose-100 font-medium"
                    title="Clear all products and start a blank order"
                  >
                    Clear Order
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Cards (Hidden on Desktop) */}
            <div className="md:hidden flex flex-col gap-3 p-2 sm:p-3 bg-[#f4f5fa]">
              {products.length === 0 && !isDraftNewItem ? (
                <div className="bg-white rounded-2xl p-4 sm:p-6 text-center text-[#565b73] border border-[#e4e6f0] shadow-sm flex flex-col items-center gap-2 sm:gap-3">
                  <Package size={36} className="text-[#a0a5b8]" />
                  <p className="font-bold text-[#14172b] text-[15px]">No products in this order yet.</p>
                  <p className="text-[12px] sm:text-[13px]">
                    Scan a barcode, add a product, or <button type="button" onClick={() => setIsImportModalOpen(true)} className="text-indigo-700 font-bold underline">Import Excel</button>
                  </p>
                </div>
              ) : (
                <>
                  {isDraftNewItem && (
                    <div className="bg-indigo-50 border-2 border-indigo-500 rounded-2xl p-4 shadow-sm animate-fade-in flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-indigo-900 text-[15px] flex items-center gap-2">
                            {productNameInput || 'New Product'}
                            <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded uppercase tracking-wider">Scanning...</span>
                          </span>
                          <span className="text-[13px] text-indigo-700 font-mono mt-1">{draftBarcode}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-white border border-indigo-200 rounded-xl p-2 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-[#565b73] uppercase">Total</span>
                          <span className="font-bold text-[#14172b]">{totalValue}</span>
                        </div>
                        <div className="flex-1 bg-indigo-100 border border-indigo-200 rounded-xl p-2 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase">Packed</span>
                          <span className="font-bold text-indigo-700">0</span>
                        </div>
                        <div className="flex-1 bg-orange-100 border border-orange-200 rounded-xl p-2 flex flex-col items-center">
                          <span className="text-[10px] font-bold text-orange-800 uppercase">Left</span>
                          <span className="font-bold text-orange-800">{currentRemaining}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {displayedProducts.map(p => {
                    const remain = p.totalQty - (p.historicalPacked || 0) - p.packedQty;
                    const isRowActive = activeProduct && (activeProduct.barcode === p.barcode || (p.asin && activeProduct.asin === p.asin));
                    return (
                      <div
                        key={p.barcode}
                        onClick={() => {
                          setActiveProduct(p);
                          setBarcodeInput(p.barcode);
                          setProductNameInput(p.name || p.modelNumber || p.asin);
                          const rem = Math.max(0, p.totalQty - (p.historicalPacked || 0) - p.packedQty);
                          setRemainingInput(rem.toString());
                          if (document.getElementById('mobile-pcs-input')) document.getElementById('mobile-pcs-input').focus();
                        }}
                        className={`bg-white rounded-2xl p-4 shadow-sm border transition-colors flex flex-col gap-3 ${isRowActive ? 'border-indigo-500 bg-indigo-50/30' : 'border-[#e4e6f0]'}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-[#14172b] text-[15px] truncate flex items-center gap-2">
                              {p.name || p.modelNumber || p.asin || p.barcode}
                              {isRowActive && <span className="text-[10px] bg-indigo-700 text-white px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">Active</span>}
                            </span>
                            <span className="text-[13px] text-[#565b73] font-mono mt-0.5 truncate">{p.barcode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProduct(p);
                            }}
                            className="w-[44px] h-[44px] bg-[#f4f5fa] hover:bg-[#e4e6f0] text-[#565b73] rounded-xl flex items-center justify-center shrink-0 transition-colors"
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-[#f4f5fa] rounded-xl p-2 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-[#565b73] uppercase">Total</span>
                            <span className="font-bold text-[#14172b]">{p.totalQty}</span>
                          </div>
                          <div className="flex-1 bg-indigo-50 rounded-xl p-2 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-indigo-700 uppercase">Packed</span>
                            <span className="font-bold text-indigo-700">{p.packedQty}</span>
                          </div>
                          <div className={`flex-1 rounded-xl p-2 flex flex-col items-center ${remain <= 0 ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                            <span className={`text-[10px] font-bold uppercase ${remain <= 0 ? 'text-emerald-700' : 'text-orange-800'}`}>Left</span>
                            <span className={`font-bold ${remain <= 0 ? 'text-emerald-700' : 'text-orange-800'}`}>{remain}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider bg-white">
                    <th className="p-4 font-semibold">Model Number</th>
                    <th className="p-4 font-semibold">Barcode</th>
                    <th className="p-4 font-semibold">Company</th>
                    <th className="p-4 font-semibold text-center">Total Qty</th>
                    <th className="p-4 font-semibold text-center">Packed</th>
                    <th className="p-4 font-semibold text-center">Remaining</th>
                    <th className="p-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Live Draft Row if user is typing a new item in scanner */}
                  {isDraftNewItem && (
                    <tr className="bg-indigo-50/40 border-l-4 border-l-indigo-500 transition-colors animate-fade-in">
                      <td className="p-4 font-semibold text-slate-800 flex items-center gap-2">
                        {productNameInput || 'New Product'}
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                          Scanning...
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-sm">{draftBarcode}</td>
                      <td className="p-4 text-slate-600 text-sm">
                        <span className="text-slate-400 italic text-xs">Scanning...</span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700">{totalValue}</td>
                      <td className="p-4 text-center font-semibold text-indigo-600">0</td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700">
                          {currentRemaining}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs text-slate-400 italic">-</span>
                      </td>
                    </tr>
                  )}

                  {products.length === 0 && !isDraftNewItem ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package size={28} className="text-slate-300" />
                          <p>No products in this order yet.</p>
                          <p className="text-xs text-slate-400">
                            Scan a barcode, add a product, or click <button type="button" onClick={() => setIsImportModalOpen(true)} className="text-indigo-600 font-semibold underline hover:text-indigo-800">Import Excel</button> to load an order sheet.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : displayedProducts.length === 0 && !isDraftNewItem ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-400">
                        No matching product found in order for "{barcodeInput.trim()}".
                      </td>
                    </tr>
                  ) : (
                    displayedProducts.map(p => {
                      const remain = p.totalQty - (p.historicalPacked || 0) - p.packedQty;
                      const isRowActive = activeProduct && (activeProduct.barcode === p.barcode || (p.asin && activeProduct.asin === p.asin));
                      return (
                        <tr
                          key={p.barcode}
                          onClick={() => {
                            setActiveProduct(p);
                            setBarcodeInput(p.barcode);
                            setProductNameInput(p.name || p.modelNumber || p.asin);
                            const rem = Math.max(0, p.totalQty - (p.historicalPacked || 0) - p.packedQty);
                            setRemainingInput(rem.toString());
                            if (pcsInputRef.current) pcsInputRef.current.focus();
                          }}
                          className={`cursor-pointer transition-colors ${isRowActive ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600 font-medium' : 'hover:bg-slate-50'}`}
                        >
                          <td className="p-4 font-mono font-bold text-indigo-700">
                            <div className="flex items-center gap-2">
                              {p.name || p.modelNumber || p.asin || p.barcode}
                              {isRowActive && (
                                <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-sans">
                                  Active
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 font-mono text-xs">{p.barcode}</td>
                          <td className="p-4 text-slate-600 text-sm">
                            {p.companyName ? (
                              <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-medium">{p.companyName}</span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Common</span>
                            )}
                          </td>
                          <td className="p-4 text-center font-bold text-slate-700">{p.totalQty}</td>
                          <td className="p-4 text-center font-bold text-indigo-600">{p.packedQty}</td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${remain <= 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {remain}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProduct(p);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-sm"
                                title="Edit ASIN and total quantity"
                              >
                                <Pencil size={13} />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to remove "${p.name}" from this order?`)) {
                                    handleDeleteProduct(p.barcode);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-sm"
                                title="Remove product from order"
                              >
                                <Trash2 size={13} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Boxes Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Box size={20} className="text-indigo-500" /> Boxes ({boxes.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {boxes.map((box, idx) => {
                const boxPcs = box.items.reduce((acc, i) => acc + (i.pcs || 0), 0);
                return (
                  <div key={idx} className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${activeBoxName.trim() === box.name ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Box size={18} className={activeBoxName.trim() === box.name ? 'text-indigo-500' : 'text-slate-400'} />
                        {editingBoxIndex === idx ? (
                          <input
                            type="text"
                            value={editBoxNameValue}
                            onChange={e => setEditBoxNameValue(e.target.value)}
                            onBlur={() => saveBoxName(idx)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveBoxName(idx);
                              if (e.key === 'Escape') setEditingBoxIndex(null);
                            }}
                            autoFocus
                            className="border border-indigo-300 rounded px-1.5 py-0.5 text-sm outline-none w-24 md:w-32"
                          />
                        ) : (
                          <>
                            <span 
                              className="cursor-pointer hover:underline decoration-slate-300 underline-offset-2"
                              onClick={() => {
                                setEditingBoxIndex(idx);
                                setEditBoxNameValue(box.name);
                              }}
                              title="Click to edit name"
                            >
                              {box.name}
                            </span>
                            <button 
                              type="button"
                              onClick={() => {
                                setEditingBoxIndex(idx);
                                setEditBoxNameValue(box.name);
                              }}
                              className="text-slate-400 hover:text-indigo-500"
                              title="Edit box name"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBox(idx)}
                              className="text-slate-400 hover:text-rose-500"
                              title="Delete box"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        {activeBoxName.trim() === box.name && (
                          <button
                            type="button"
                            onClick={() => {
                              const newBoxName = `Box ${boxes.length + 1}`;
                              setBoxes(prev => [...prev, { name: newBoxName, items: [] }]);
                              setActiveBoxName(newBoxName);
                            }}
                            className="text-[10px] font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-2 py-1 rounded-md shadow-sm transition-colors"
                            title="Mark as full and create new box"
                          >
                            Box Full
                          </button>
                        )}
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg shadow-sm">
                          {boxPcs} pcs total
                        </span>
                      </div>
                    </div>
                    {box.items.length === 0 ? (
                      <p className="text-sm text-slate-400 italic py-2 text-center">Empty box</p>
                    ) : (
                      <ul className="space-y-2">
                        {box.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 truncate pr-2">{item.name}</span>
                            <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{item.pcs}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Save & New PO Buttons DOWN the Box */}
            <div className="pt-2 hidden md:flex flex-row gap-3">
              <button
                type="button"
                onClick={handleStartNewPO}
                className="w-full sm:flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2.5 text-base"
                title="Start New PO"
              >
                <PlusCircle size={20} />
                New PO
              </button>
              <button
                type="button"
                onClick={handleSavePO}
                disabled={isSaving || products.length === 0}
                className="w-full sm:flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save PO"
              >
                <Save size={20} />
                {isSaving ? 'Saving PO...' : (products.length > 0 ? `Save PO · ${totalPackedPcs} pcs` : 'Save PO')}
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Fixed Save PO Bar */}
        <div className="md:hidden fixed bottom-[76px] left-0 right-0 p-3 bg-white border-t border-[#e4e6f0] z-40 flex gap-3">
          <button
            onClick={handleStartNewPO}
            className="h-[52px] px-5 bg-slate-100 hover:bg-slate-200 text-[#14172b] font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <PlusCircle size={20} className="text-[#565b73]" />
            New PO
          </button>
          <button
            onClick={handleSavePO}
            disabled={isSaving || products.length === 0}
            className="h-[52px] flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-[#e4e6f0] disabled:text-[#a0a5b8] text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {isSaving ? 'Saving...' : (products.length > 0 ? `Save PO · ${totalPackedPcs} pcs` : 'Save PO')}
          </button>
        </div>
      </div>
    </div>
  );
}
