import React, { useState, useEffect, useRef } from 'react';
import { Package, Box, Building2, ScanLine, Search, Check, Save, PlusCircle, CheckCircle2, X, Pencil, Trash2, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchProductByBarcode, createPO, getPOs, getNextPoNumber, createProduct } from '../services/api';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-fade-in">
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-fade-in">
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

  const refreshNextPoNo = async () => {
    try {
      const num = await getNextPoNumber();
      if (num) setNextPoNo(num);
    } catch (err) {
      console.error('Failed to get next PO number:', err);
    }
  };

  useEffect(() => {
    refreshNextPoNo();
  }, []);

  const handleExportExcel = () => {
    if (products.length === 0) {
      alert("No products to export!");
      return;
    }
    const excelData = products.map((p, idx) => ({
      "#": idx + 1,
      "Model Number": p.name || p.modelNumber || p.asin || p.barcode,
      "Barcode": p.barcode,
      "Company": p.companyName || companyName || 'Common',
      "Total Qty": p.totalQty,
      "Packed": p.packedQty,
      "Remaining": Math.max(0, p.totalQty - (p.historicalPacked || 0) - p.packedQty)
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Current Order");
    XLSX.writeFile(workbook, `Draft_${nextPoNo}_${companyName || 'PO'}.xlsx`);
  };

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

  const handleClearForm = () => {
    sessionStorage.removeItem('force_blank_po');
    setCompanyName('');
    setProducts([]);
    setBoxes([{ name: 'Box 1', items: [] }]);
    setActiveBoxName('Box 1');
    setBarcodeInput('');
    setProductNameInput('');
    setRemainingInput('');
    setPcsInput('');
    setActiveProduct(null);
    setImportedFileMeta(null);
    loadedCompanyRef.current = '';
    localStorage.removeItem('active_po_company');
    localStorage.removeItem('active_po_products');
    localStorage.removeItem('active_po_boxes');
    localStorage.removeItem('active_po_imported_meta');
    refreshNextPoNo();
  };

  // Called when Excel file is imported and saved
  const handleImportSuccess = ({ rawItems, companyName: importedCompany, fileName, totalQtySum }) => {
    if (importedCompany && !companyName) {
      setCompanyName(importedCompany);
    }
    
    setImportedFileMeta({
      fileName,
      count: rawItems.length,
      totalQty: totalQtySum
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

    const onClear = () => handleClearForm();
    window.addEventListener('clear-po-form', onClear);
    return () => window.removeEventListener('clear-po-form', onClear);
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
      newTotal = currentPacked + parsedRemain;
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

  // Lookup barcode function (used for typing, pressing Enter, or camera scan)
  const lookupBarcode = async (codeToLookup) => {
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
    setRemainingInput(rem > 0 ? rem.toString() : (foundProduct.totalQty > 0 ? foundProduct.totalQty.toString() : ''));
    if (pcsInputRef.current) pcsInputRef.current.focus();
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
      const newTotal = newRemain + activeProduct.packedQty;
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
        items: products.map(p => ({ 
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
      handleClearForm();
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
      await handleSavePO();
    } else {
      handleClearForm();
    }
  };

  const handleClearAllOrder = () => {
    if (!window.confirm("Are you sure you want to clear all products and start a completely blank order?")) {
      return;
    }
    handleClearForm();
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
            lookupBarcode(code);
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex-1 w-full max-w-md space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-500" /> Company Name
            </label>
            <button 
              type="button" 
              onClick={() => { 
                setCompanyName(''); 
                setTimeout(() => document.getElementById('company-input')?.focus(), 10); 
              }} 
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded"
              title="Add a new company"
            >
              <PlusCircle size={14} /> Add New
            </button>
          </div>
          <input 
            id="company-input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
            placeholder="e.g. Acme Corp"
            list="company-list"
          />
          <datalist id="company-list">
            {availableCompanies.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto justify-between xl:justify-end flex-wrap">
          {/* Stat Badges: PO Number, Total Products & Total Quantity */}
          <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Sequential Ascending PO Number Badge */}
            <div className="bg-indigo-50 px-2 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-indigo-100 flex flex-col items-center flex-1 sm:flex-none min-w-0 sm:min-w-[120px]">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-0.5 truncate">PO Number</span>
              <span className="text-base sm:text-2xl font-black font-mono text-indigo-900">{nextPoNo}</span>
            </div>

            {/* Total Products Badge */}
            <div className="bg-purple-50 px-2 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-purple-100 flex flex-col items-center flex-1 sm:flex-none min-w-0 sm:min-w-[120px]">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-700 mb-0.5 truncate">Products</span>
              <span className="text-base sm:text-2xl font-black font-mono text-purple-900">{totalProductsCount}</span>
              <span className="text-[9px] sm:text-[11px] text-purple-600 font-medium mt-0.5 truncate">
                {totalProductsCount === 1 ? '1 item' : `${totalProductsCount} items`}
              </span>
            </div>

            {/* Total Quantity Badge */}
            <div className="bg-slate-50 px-2 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-slate-200 flex flex-col items-center flex-1 sm:flex-none min-w-0 sm:min-w-[120px]">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-0.5 truncate">Total Qty</span>
              <span className="text-base sm:text-2xl font-extrabold text-slate-800">{sumTotalQty}</span>
              <span className="text-[9px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                Packed: <b className="text-indigo-600">{totalPackedPcs}</b>
              </span>
            </div>
          </div>



          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-2 text-sm shrink-0 shadow-sm flex-1 sm:flex-none"
            title="Import Excel order sheet"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            Import Excel
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-2 text-sm shrink-0 shadow-sm flex-1 sm:flex-none"
            title="Export current order to Excel"
          >
            <Download size={18} className="text-blue-600" />
            Export Excel
          </button>

          <button
            onClick={handleStartNewPO}
            className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shrink-0 flex-1 sm:flex-none"
            title="Start a fresh PO"
          >
            <PlusCircle size={18} />
            New PO
          </button>

          {/* Save PO - Visible on desktop, moved next to Box on mobile */}
          <button
            onClick={handleSavePO}
            disabled={isSaving || products.length === 0}
            className="hidden sm:flex px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2 shadow-sm shrink-0 text-sm"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save PO'}
          </button>
        </div>
      </div>

      {/* Imported File Info Banner */}
      {importedFileMeta && (
        <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-900 px-5 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5 font-medium text-xs sm:text-sm">
            <FileSpreadsheet className="text-emerald-600 shrink-0" size={18} />
            <span>
              Order File: <strong className="font-bold text-emerald-950">{importedFileMeta.fileName}</strong> • Loaded <b>{importedFileMeta.count}</b> products ({importedFileMeta.totalQty} requested pcs)
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setImportedFileMeta(null)} 
            className="text-emerald-700 hover:text-emerald-950 p-1"
            title="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Scanner and Boxes */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Scanner Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ScanLine size={20} className="text-indigo-500" /> Packing Scanner
              </h2>
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                Scan or Manual
              </span>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Barcode</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      value={barcodeInput}
                      onChange={handleBarcodeChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          lookupBarcode(barcodeInput);
                        }
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-mono"
                      placeholder="Scan or type barcode..."
                      autoFocus
                    />
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <button 
                    type="button"
                    className="px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 font-medium shrink-0"
                    onClick={() => setIsCameraOpen(true)}
                    title="Open Camera Scanner"
                  >
                    <ScanLine size={18} />
                  </button>
                </div>
              </div>

              {/* Model Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Model Number</label>
                <input 
                  type="text"
                  value={productNameInput}
                  onChange={handleProductNameChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 font-medium text-slate-800 transition-all"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">
                      Total Qty <span className="text-[10px] text-orange-600 font-bold bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded ml-0.5">Remaining</span>
                    </label>
                    {activeProduct && activeProduct.packedQty > 0 && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        Packed: <strong className="text-indigo-600">{activeProduct.packedQty}</strong>
                      </span>
                    )}
                  </div>
                  <input 
                    type="number"
                    min="0"
                    value={remainingInput}
                    onChange={handleRemainingChange}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800 text-lg"
                    placeholder="Remaining"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-indigo-600">Pcs</label>
                    {activeProduct && activeProduct.packedQty > 0 && (
                      <span className="text-[11px] text-slate-500 font-medium">
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
                    className="w-full px-4 py-3 bg-white border border-indigo-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                    placeholder="Qty to pack"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-600">Target Box</label>
                <input 
                  list="box-options"
                  value={activeBoxName}
                  onChange={handleBoxChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-slate-800"
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
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4 shadow-sm"
              >
                <Check size={20} /> Pack Items
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Tables */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Products Summary (ALWAYS LIVE) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Package size={20} className="text-indigo-500" /> Overall Order Status
                <span className="flex items-center gap-1 ml-2 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
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
            <div className="overflow-x-auto">
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
                        <Box size={18} className={activeBoxName.trim() === box.name ? 'text-indigo-500' : 'text-slate-400'} /> {box.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
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

            {/* Save PO Button DOWN the Box (Mobile Version) */}
            <div className="pt-2 sm:hidden">
              <button
                type="button"
                onClick={handleSavePO}
                disabled={isSaving || products.length === 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save PO"
              >
                <Save size={20} />
                {isSaving ? 'Saving PO...' : 'Save PO'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
