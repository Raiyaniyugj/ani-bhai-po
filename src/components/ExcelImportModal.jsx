import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload, X, Check, AlertCircle, Building2, Eye, RefreshCw } from 'lucide-react';
import { bulkImportProducts } from '../services/api';

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  initialCompanyName = '',
  availableCompanies = []
}) {
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [companyName, setCompanyName] = useState(initialCompanyName || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const normalizeRow = (row, index) => {
    // Search keys case-insensitively
    const keys = Object.keys(row);
    
    // Find ASIN key
    const asinKey = keys.find(k => /^\s*asin\s*$/i.test(k));
    // Find Model Number key (Model Number, Model, ModelNo, SKU, Style, Name)
    const modelKey = keys.find(k => /^\s*(model\s*number|model\s*no|model|sku|style|product\s*name|item\s*name)\s*$/i.test(k));
    // Find Quantity key (Quantity Requested, Requested Quantity, Quantity, Qty, Total Qty)
    const qtyKey = keys.find(k => /^\s*(quantity\s*requested|requested\s*quantity|total\s*qty|total\s*quantity|quantity|qty)\s*$/i.test(k));
    // Find Barcode key if present
    const barcodeKey = keys.find(k => /^\s*(barcode|upc|ean|fnsku)\s*$/i.test(k));
    // Find Accepted quantity if present
    const acceptedKey = keys.find(k => /^\s*(accepted\s*quantity|accepted\s*qty|accepted)\s*$/i.test(k));

    const asin = asinKey ? String(row[asinKey] || '').trim() : '';
    const modelNumber = modelKey ? String(row[modelKey] || '').trim() : '';
    // If no explicit barcode, default to ASIN, fallback to Model Number
    const barcode = barcodeKey ? String(row[barcodeKey] || '').trim() : (asin || modelNumber || `ITEM-${index + 1}`);
    
    // Quantity Requested or Total Qty
    const rawQty = qtyKey ? row[qtyKey] : (acceptedKey ? row[acceptedKey] : 0);
    const totalQty = parseInt(rawQty, 10) || 0;
    
    const acceptedQty = acceptedKey ? (parseInt(row[acceptedKey], 10) || 0) : null;
    const name = modelNumber || asin || barcode;

    return {
      asin,
      modelNumber,
      barcode,
      name,
      totalQty,
      acceptedQty,
      price: 0
    };
  };

  const processFile = (selectedFile) => {
    setErrorMsg('');
    if (!selectedFile) return;

    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(fileExt)) {
      setErrorMsg('Please upload a valid Excel file (.xlsx, .xls) or CSV file.');
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setErrorMsg('The selected Excel file is empty.');
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to json
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (!rawJson || rawJson.length === 0) {
          setErrorMsg('No data rows found in the first sheet of this file.');
          return;
        }

        const normalized = rawJson
          .map((row, idx) => normalizeRow(row, idx))
          .filter(item => item.asin || item.modelNumber || item.barcode);

        if (normalized.length === 0) {
          setErrorMsg('Could not find ASIN, Model Number, or Barcode columns. Please ensure columns include ASIN, Model Number, and Quantity Requested.');
          return;
        }

        setParsedRows(normalized);
      } catch (err) {
        console.error('Error parsing Excel:', err);
        setErrorMsg('Failed to parse Excel file: ' + err.message);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImportAndSave = async () => {
    if (parsedRows.length === 0) {
      setErrorMsg('Please upload an Excel file with valid product rows.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const result = await bulkImportProducts(parsedRows, companyName.trim());
      
      if (onImportSuccess) {
        onImportSuccess({
          products: result.products || [],
          rawItems: parsedRows,
          companyName: companyName.trim(),
          fileName: file ? file.name : 'Imported.xlsx',
          totalQtySum: parsedRows.reduce((sum, r) => sum + (r.totalQty || 0), 0)
        });
      }

      onClose();
    } catch (err) {
      console.error('Import Error:', err);
      setErrorMsg(err.message || 'Failed to import products to database.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalQuantitySum = parsedRows.reduce((sum, r) => sum + (r.totalQty || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-fade-in">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Import Excel Sheet</h3>
              <p className="text-xs text-slate-400">Match ASIN, Model Number & Quantity Requested</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Company Assignment */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 size={15} className="text-indigo-600" /> Company Name (Optional)
            </label>
            <input 
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Amazon Fulfillment / Apex Tech Solutions"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-indigo-500 transition-all"
              list="modal-company-list"
            />
            <datalist id="modal-company-list">
              {availableCompanies.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* File Upload Dropzone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver 
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
                : file 
                  ? 'border-emerald-400 bg-emerald-50/30' 
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
            }`}
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            
            <div className="flex flex-col items-center gap-2">
              <div className={`p-3 rounded-full ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {file ? <Check size={28} /> : <Upload size={28} />}
              </div>
              
              {file ? (
                <div>
                  <p className="font-bold text-slate-800 text-sm">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB • Click or drag to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    Click to browse or drag & drop Excel sheet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports .xlsx, .xls, .csv (Headers: <code className="bg-slate-200/80 px-1 py-0.5 rounded text-[11px] text-slate-700">ASIN</code>, <code className="bg-slate-200/80 px-1 py-0.5 rounded text-[11px] text-slate-700">Model Number</code>, <code className="bg-slate-200/80 px-1 py-0.5 rounded text-[11px] text-slate-700">Quantity Requested</code>)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Parsed Summary & Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={15} className="text-indigo-500" /> Data Preview ({parsedRows.length} items)
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  Total Requested Qty: <b>{totalQuantitySum}</b> pcs
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">ASIN</th>
                      <th className="p-2.5">Model Number</th>
                      <th className="p-2.5">Barcode</th>
                      <th className="p-2.5 text-right">Qty Requested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-bold font-mono text-indigo-700">{row.asin || '—'}</td>
                        <td className="p-2.5 font-medium text-slate-800">{row.modelNumber || '—'}</td>
                        <td className="p-2.5 font-mono text-slate-500">{row.barcode}</td>
                        <td className="p-2.5 text-right font-extrabold text-slate-800">{row.totalQty}</td>
                      </tr>
                    ))}
                    {parsedRows.length > 15 && (
                      <tr>
                        <td colSpan="5" className="p-2.5 text-center text-slate-400 italic bg-slate-50">
                          + {parsedRows.length - 15} more rows...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleImportAndSave}
            disabled={parsedRows.length === 0 || isProcessing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Saving to Database...
              </>
            ) : (
              <>
                <Check size={16} />
                Import & Save {parsedRows.length > 0 ? `(${parsedRows.length} Products)` : ''}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
