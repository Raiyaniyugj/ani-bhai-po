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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:absolute print:inset-0 print:bg-transparent print:p-0">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-fade-in print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full print:overflow-visible">
        
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

  const filteredPOs = pos.filter((po) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesCompany = (po.companyName || '').toLowerCase().includes(searchLower);
    const matchesPoNo = (po.poNo || '').toLowerCase().includes(searchLower);
    const matchesBarcode = po.items?.some(item => (item.barcode || '').toLowerCase().includes(searchLower)) || false;
    
    const matchesSearch = matchesCompany || matchesPoNo || matchesBarcode;
    const matchesDate = filterDate ? po.createdAt.startsWith(filterDate) : true;
    return matchesSearch && matchesDate;
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

      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Purchase Orders</h2>
          <p className="text-slate-500 text-sm mt-1">Manage and view all your purchase orders</p>
        </div>
        <Link 
          to="/create"
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-semibold shadow-sm shadow-indigo-600/20"
        >
          <Plus size={20} /> Create New PO
        </Link>
      </div>

      <div className="p-6 md:p-8 print:hidden">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text"
                placeholder="Search by Company, PO Number, or Barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
            <button 
              type="button"
              className="px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center shrink-0"
              onClick={() => setIsScannerOpen(true)}
              title="Scan Barcode"
            >
              <ScanLine size={20} />
            </button>
          </div>
          <div className="md:w-64 relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-semibold w-12 text-center text-slate-400">#</th>
                  <th className="p-4 font-semibold">PO Number</th>
                  <th className="p-4 font-semibold">Company</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold text-center">Total Pcs</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-400">Loading purchase orders...</td>
                  </tr>
                ) : sortedPOs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Filter size={48} className="text-slate-200" />
                        <p>No purchase orders found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedPOs.map((po, idx) => {
                    const pcs = po.totalPcs || (po.items ? po.items.reduce((acc, i) => acc + (i.qty || 0), 0) : 0);
                    return (
                      <tr key={po._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 text-center font-mono text-xs text-slate-400 font-medium">{idx + 1}</td>
                        <td className="p-4 text-indigo-600 font-mono font-bold">{po.poNo}</td>
                        <td className="p-4 font-medium text-slate-800 flex items-center gap-2">
                          <Building2 size={16} className="text-slate-400" />
                          {po.companyName}
                        </td>
                        <td className="p-4 text-slate-600">{new Date(po.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-center font-bold text-indigo-600">
                          {pcs} pcs
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => setSelectedPO(po)}
                              title="View PO Details"
                              className="text-indigo-600 hover:text-indigo-800 p-2 rounded-lg transition-colors bg-indigo-50 hover:bg-indigo-100 border border-indigo-100"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => handleExportExcel(po)}
                              title="Export to Excel"
                              className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg transition-colors bg-emerald-50 hover:bg-emerald-100 border border-emerald-100"
                            >
                              <Download size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(po._id, po.poNo)}
                              title="Delete Purchase Order"
                              className="text-rose-600 hover:text-rose-800 p-2 rounded-lg transition-colors bg-rose-50 hover:bg-rose-100 border border-rose-100"
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

      </div>
    </div>
  );
}
