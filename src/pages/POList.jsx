import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Calendar, Building2, Filter, Eye, Package, Box, X, Printer, CheckCircle2, Trash2, Download, ScanLine } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import CameraScanner from '../components/CameraScanner';
import { getPOs, deletePO } from '../services/api';



const PODetailModal = ({ po, onClose, onDelete, onExportExcel }) => {
  if (!po) return null;

  const totalPcs = po.totalPcs || (po.items ? po.items.reduce((acc, i) => acc + (i.qty || 0), 0) : 0);
  const boxes = po.boxes || [];
  const items = po.items || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto print:absolute print:inset-0 print:bg-transparent print:p-0">
      <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-fade-in print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full print:overflow-visible">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-md font-mono">
                {po.poNo}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar size={13} /> {new Date(po.createdAt).toLocaleDateString()} at {new Date(po.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-2 pt-1">
              <Building2 size={22} className="text-indigo-400" />
              {po.companyName || 'Unnamed Company'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors print:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 print:overflow-visible print:p-0 print:pt-4">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Package size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Total Pieces</p>
                <p className="text-2xl font-black text-indigo-900">{totalPcs} <span className="text-xs font-normal text-indigo-700">pcs</span></p>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Products</p>
                <p className="text-2xl font-black text-emerald-900">{items.length} <span className="text-xs font-normal text-emerald-700">types</span></p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                <Box size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Boxes Used</p>
                <p className="text-2xl font-black text-amber-900">{boxes.length} <span className="text-xs font-normal text-amber-700">boxes</span></p>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <Package size={18} className="text-indigo-600" /> Products in this Order
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                    <th className="p-3">Model Number</th>
                    <th className="p-3">Barcode</th>
                    <th className="p-3 text-center">Total Qty</th>
                    <th className="p-3 text-right">Packed Pcs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-400">No items recorded in this order</td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-3 text-slate-500 font-mono text-xs">{item.barcode}</td>
                        <td className="p-3 text-center font-medium text-slate-700">{item.totalQty || item.qty}</td>
                        <td className="p-3 text-right font-bold text-indigo-600">{item.qty} pcs</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Boxes Breakdown */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
              <Box size={18} className="text-indigo-600" /> Boxes Breakdown
            </h3>
            {boxes.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No specific box breakdown recorded.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {boxes.map((box, bIdx) => {
                  const boxItems = Array.isArray(box.items) ? box.items : [];
                  const boxPcs = boxItems.reduce((acc, i) => acc + (i.pcs || 0), 0);
                  return (
                    <div key={bIdx} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200/80">
                        <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                          <Box size={16} className="text-indigo-500" /> {box.name}
                        </h4>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          {boxPcs} pcs
                        </span>
                      </div>
                      {boxItems.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Empty</p>
                      ) : (
                        <ul className="space-y-1 text-xs">
                          {boxItems.map((bi, iIdx) => (
                            <li key={iIdx} className="flex justify-between items-center text-slate-600">
                              <span className="truncate pr-2">{bi.name || bi.barcode}</span>
                              <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                                {bi.pcs} pcs
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
            >
              <Printer size={16} /> Print Details
            </button>
            <button
              onClick={() => onExportExcel && onExportExcel(po)}
              className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
            >
              <Download size={16} /> Export Excel
            </button>
            <button
              onClick={() => onDelete(po._id, po.poNo)}
              className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
            >
              <Trash2 size={16} /> Delete PO
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-medium transition-colors text-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default function POList() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedPO, setSelectedPO] = useState(null); // Active PO for Detail Modal
  const [activeCompanyFilter, setActiveCompanyFilter] = useState('All');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    try {
      const data = await getPOs();
      setPos(data);
    } catch (error) {
      console.error('Failed to fetch POs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, poNo) => {
    if (!window.confirm(`Are you sure you want to delete Purchase Order "${poNo}"?`)) {
      return;
    }
    try {
      await deletePO(id);
      setPos(prev => prev.filter(p => p._id !== id));
      if (selectedPO && selectedPO._id === id) {
        setSelectedPO(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete PO: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExportExcel = (po) => {
    if (!po) return;
    const items = po.items || [];
    const excelData = items.map((item, idx) => ({
      "#": idx + 1,
      "Model Number": item.name,
      "Barcode": item.barcode,
      "Total Qty": item.totalQty || item.qty,
      "Packed Pcs": item.qty
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, `${po.poNo}_${po.companyName || 'PO'}.xlsx`);
  };


  const companies = ['All', ...Array.from(new Set(pos.map(po => po.companyName).filter(Boolean)))];

  const filteredPOs = pos.filter((po) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesCompany = (po.companyName || '').toLowerCase().includes(searchLower);
    const matchesPoNo = (po.poNo || '').toLowerCase().includes(searchLower);
    const matchesBarcode = po.items?.some(item => (item.barcode || '').toLowerCase().includes(searchLower)) || false;
    
    const matchesSearch = matchesCompany || matchesPoNo || matchesBarcode;
    const matchesDate = filterDate ? po.createdAt.startsWith(filterDate) : true;
    const matchesCompanyFilter = activeCompanyFilter === 'All' || po.companyName === activeCompanyFilter;
    
    return matchesSearch && matchesDate && matchesCompanyFilter;
  });

  // Sort line-wise in ascending order by PO Number (PO-0001, PO-0002, PO-0003...)
  const sortedPOs = [...filteredPOs].sort((a, b) => {
    return (a.poNo || '').localeCompare(b.poNo || '', undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 print:shadow-none print:border-none print:bg-transparent">
      {/* Detail Modal */}
      {selectedPO && (
        <PODetailModal 
          po={selectedPO} 
          onClose={() => setSelectedPO(null)} 
          onDelete={handleDelete}
          onExportExcel={handleExportExcel}
        />
      )}
      
      {isScannerOpen && (
        <CameraScanner 
          onResult={(code) => {
            setSearchTerm(code);
            setIsScannerOpen(false);
          }} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      <div className="p-4 md:p-8 print:hidden flex flex-col gap-4">
        {/* Search Input Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e4e6f0] p-3 md:p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a0a5b8]" size={20} />
              <input 
                type="text"
                placeholder="Company, PO number or barcode"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[52px] pl-12 pr-4 bg-[#f8f9fc] border-[1.5px] border-[#e4e6f0] rounded-2xl outline-none focus:bg-white focus:border-indigo-700 transition-all text-[#14172b] font-medium"
              />
            </div>
            <button 
              type="button"
              className="w-[52px] h-[52px] bg-[#14172b] text-white rounded-2xl hover:bg-black transition-colors flex items-center justify-center shrink-0"
              onClick={() => setIsScannerOpen(true)}
            >
              <ScanLine size={24} />
            </button>
          </div>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a0a5b8]" size={20} />
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full h-[52px] pl-12 pr-4 bg-[#f8f9fc] border-[1.5px] border-[#e4e6f0] rounded-2xl outline-none focus:bg-white focus:border-indigo-700 transition-all text-[#14172b] font-medium"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {companies.map(company => (
            <button
              key={company}
              onClick={() => setActiveCompanyFilter(company)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-colors ${activeCompanyFilter === company ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white text-[#565b73] border border-[#e4e6f0] hover:bg-[#f4f5fa]'}`}
            >
              {company}
            </button>
          ))}
        </div>

        {/* Desktop Table (Hidden on Mobile) */}
        <div className="hidden md:block border border-[#e4e6f0] rounded-2xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fc] border-b border-[#e4e6f0] text-[#565b73] text-[13px]">
                  <th className="p-4 font-bold w-12 text-center text-[#a0a5b8]">#</th>
                  <th className="p-4 font-bold">PO Number</th>
                  <th className="p-4 font-bold">Company</th>
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold text-center">Total Pcs</th>
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e6f0]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-[#565b73]">Loading purchase orders...</td>
                  </tr>
                ) : sortedPOs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-[#565b73]">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Filter size={48} className="text-[#e4e6f0]" />
                        <p>No purchase orders found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedPOs.map((po, idx) => {
                    const pcs = po.totalPcs || (po.items ? po.items.reduce((acc, i) => acc + (i.qty || 0), 0) : 0);
                    return (
                      <tr key={po._id} className="hover:bg-[#f8f9fc] transition-colors group">
                        <td className="p-4 text-center font-mono text-xs text-[#a0a5b8] font-medium">{idx + 1}</td>
                        <td className="p-4 text-indigo-700 font-mono font-bold">{po.poNo}</td>
                        <td className="p-4 font-medium text-[#14172b] flex items-center gap-2">
                          <Building2 size={16} className="text-[#a0a5b8]" />
                          {po.companyName}
                        </td>
                        <td className="p-4 text-[#565b73]">{new Date(po.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-center font-bold text-indigo-700">
                          {pcs} pcs
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => setSelectedPO(po)}
                              title="View PO Details"
                              className="text-indigo-700 hover:text-indigo-900 p-2 rounded-lg transition-colors bg-indigo-50 hover:bg-indigo-100 border border-indigo-100"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => handleExportExcel(po)}
                              title="Export to Excel"
                              className="text-emerald-700 hover:text-emerald-900 p-2 rounded-lg transition-colors bg-emerald-50 hover:bg-emerald-100 border border-emerald-100"
                            >
                              <Download size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(po._id, po.poNo)}
                              title="Delete Purchase Order"
                              className="text-orange-700 hover:text-orange-900 p-2 rounded-lg transition-colors bg-orange-50 hover:bg-orange-100 border border-orange-100"
                            >
                              <Trash2 size={18} />
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

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col gap-3">
          {loading ? (
             <div className="p-12 text-center text-[#565b73]">Loading purchase orders...</div>
          ) : sortedPOs.length === 0 ? (
             <div className="p-12 text-center text-[#565b73] bg-white rounded-2xl border border-[#e4e6f0]">
               <div className="flex flex-col items-center justify-center gap-3">
                 <Filter size={48} className="text-[#e4e6f0]" />
                 <p className="font-bold">No purchase orders found.</p>
               </div>
             </div>
          ) : (
            sortedPOs.map((po) => {
              const pcs = po.totalPcs || (po.items ? po.items.reduce((acc, i) => acc + (i.qty || 0), 0) : 0);
              const boxesCount = po.boxes ? po.boxes.length : 0;
              return (
                <div 
                  key={po._id}
                  onClick={() => setSelectedPO(po)}
                  className="bg-white rounded-2xl shadow-sm border border-[#e4e6f0] p-4 flex items-center justify-between gap-3 active:scale-[0.98] transition-transform"
                >
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="font-mono font-black text-indigo-700 text-[16px]">{po.poNo}</span>
                    <span className="font-bold text-[#14172b] text-[15px] truncate">{po.companyName || 'Unnamed Company'}</span>
                    <span className="text-[12px] text-[#565b73] font-medium">
                      {new Date(po.createdAt).toLocaleDateString()} &middot; {boxesCount} boxes
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[20px] font-black text-[#14172b] leading-none">{pcs}</span>
                      <span className="text-[10px] font-bold text-[#a0a5b8]">PCS</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.print(); // or handleExportExcel(po) - prompt says print icon button
                      }}
                      className="w-[44px] h-[44px] bg-[#f8f9fc] hover:bg-[#e4e6f0] rounded-xl flex items-center justify-center text-[#565b73] transition-colors"
                      aria-label="Print PO"
                    >
                      <Printer size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}