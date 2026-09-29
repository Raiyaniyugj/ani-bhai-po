import React, { useState, useEffect } from 'react';
import { getPOs, createProduct, updateProduct } from '../services/api';
import { Package, Building2, Search, Plus, X, ScanLine, PlusCircle, Check, Pencil, Download, Printer, FileSpreadsheet } from 'lucide-react';
import CameraScanner from '../components/CameraScanner';
import ExcelImportModal from '../components/ExcelImportModal';
import * as XLSX from 'xlsx';

export default function Products() {
  const [pos, setPos] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [newProduct, setNewProduct] = useState({
    barcode: '',
    name: '',
    asin: '',
    modelNumber: '',
    price: '',
    totalQty: 0,
    companyName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showSearchScanner, setShowSearchScanner] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [poData, prodData] = await Promise.all([
        getPOs(),
        import('../services/api').then(m => m.getProducts())
      ]);
      setPos(poData);
      setAllProducts(prodData);
      
      const poCompanies = poData.map(po => po.companyName).filter(Boolean);
      const prodCompanies = prodData.map(p => p.companyName).filter(Boolean);
      const uniqueCompanies = [...new Set([...poCompanies, ...prodCompanies])].sort((a, b) => a.localeCompare(b));
      setCompanies(uniqueCompanies);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate products for the selected company
  const companyProducts = React.useMemo(() => {
    const masterProdMap = {};
    allProducts.forEach(p => {
      masterProdMap[p.barcode] = p;
    });

    const companyPOs = selectedCompany === 'All' ? pos : pos.filter(po => po.companyName === selectedCompany);
    const productMap = {};
    
    // Always populate with all saved products first so they are never missing from the list
    allProducts.forEach(p => {
      productMap[p.barcode] = {
        barcode: p.barcode,
        name: p.name,
        asin: p.asin || '',
        modelNumber: p.modelNumber || '',
        companyName: p.companyName || '',
        masterQty: p.totalQty || 0,
        totalOrdered: 0,
        totalPacked: 0
      };
    });

    companyPOs.forEach(po => {
      if (po.items) {
        po.items.forEach(item => {
          const masterP = masterProdMap[item.barcode];
          if (!productMap[item.barcode]) {
            productMap[item.barcode] = {
              barcode: item.barcode,
              name: masterP ? masterP.name : item.name,
              asin: masterP?.asin || item.asin || '',
              modelNumber: masterP?.modelNumber || item.modelNumber || '',
              masterQty: masterP ? masterP.totalQty : 0,
              totalOrdered: 0,
              totalPacked: 0
            };
          }
          productMap[item.barcode].totalOrdered = Math.max(productMap[item.barcode].totalOrdered, (item.totalQty || 0));
          productMap[item.barcode].totalPacked += (item.qty || 0);
        });
      }
    });
    
    let result = Object.values(productMap);
    if (selectedCompany !== 'All') {
      result = result.filter(p => p.totalOrdered > 0 || p.totalPacked > 0 || p.companyName === selectedCompany);
    }
    return result;
  }, [pos, selectedCompany, allProducts]);

  const filteredProducts = companyProducts.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) || 
      (p.barcode && p.barcode.toLowerCase().includes(term)) ||
      (p.asin && p.asin.toLowerCase().includes(term)) ||
      (p.modelNumber && p.modelNumber.toLowerCase().includes(term))
    );
  });

  const stats = React.useMemo(() => {
    let ordered = 0;
    let packed = 0;
    filteredProducts.forEach(p => {
      ordered += p.totalOrdered;
      packed += p.totalPacked;
    });
    return { ordered, packed };
  }, [filteredProducts]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.barcode || !newProduct.name) {
      alert("Barcode and ASIN are required.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createProduct({
        ...newProduct,
        price: 0,
        totalQty: Number(newProduct.totalQty) || 0
      });
      alert("Product added successfully!");
      setIsAddModalOpen(false);
      setNewProduct({ barcode: '', name: '', price: '', totalQty: 0, companyName: '' });
      setShowScanner(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to create product. It may already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct.barcode || !editingProduct.name) {
      alert("Barcode and ASIN are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProduct(editingProduct.originalBarcode, {
        barcode: editingProduct.barcode,
        name: editingProduct.name,
        totalQty: Number(editingProduct.totalQty),
        companyName: editingProduct.companyName
      });
      alert("Product updated successfully!");
      setIsEditModalOpen(false);
      setEditingProduct(null);
      fetchData(); // refresh the list to see the updated POs
    } catch (error) {
      console.error(error);
      alert("Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const excelData = filteredProducts.map((p) => {
      const displayQty = p.masterQty > 0 ? p.masterQty : p.totalOrdered;
      return {
        "ASIN": p.asin || p.name,
        "Model Number": p.modelNumber || '',
        "Barcode": p.barcode,
        "Total Qty": displayQty,
        "Packed": p.totalPacked,
        "Remaining": displayQty - p.totalPacked
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, `Products_${selectedCompany || 'All'}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in print:shadow-none print:border-none print:m-0 print:p-0">
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Products</h2>
          <p className="text-slate-500 text-sm mt-1">View products by company</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-colors shadow-sm whitespace-nowrap"
            title="Print A4"
          >
            <Printer size={20} />
            Print
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm whitespace-nowrap"
            title="Export to Excel"
          >
            <Download size={20} />
            Export Excel
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap font-medium"
            title="Import Excel"
          >
            <FileSpreadsheet size={18} />
            Import Excel
          </button>
          <button
            onClick={() => {
              setNewProduct({ barcode: '', name: '', asin: '', modelNumber: '', price: '', totalQty: 0, companyName: selectedCompany === 'All' ? '' : selectedCompany });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Stats and Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 print:hidden">
          {/* Stats Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center min-w-[240px] shadow-sm">
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Total Quantity</h3>
            <div className="text-5xl font-black text-slate-900 tracking-tight mb-2">{stats.ordered}</div>
            <div className="text-slate-500 font-medium">Packed: <span className="text-indigo-600 font-bold">{stats.packed}</span> pcs</div>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-64 flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Building2 size={16} className="text-indigo-500" /> Company
                  </label>
                  <button 
                    onClick={() => { setSelectedCompany('All'); }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded"
                    title="Clear filter"
                  >
                    Clear Filter
                  </button>
                </div>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    value={selectedCompany === 'All' ? '' : selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value || 'All')}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder="All Companies"
                    list="filter-company-list"
                  />
                  <datalist id="filter-company-list">
                    {companies.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text"
                    placeholder="Search products by ASIN or Barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                  <button 
                    onClick={() => setShowSearchScanner(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-700 p-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    title="Scan Barcode"
                  >
                    <ScanLine size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSearchScanner && (
          <CameraScanner 
            onResult={(result) => {
              setSearchTerm(result);
              setShowSearchScanner(false);
            }}
            onClose={() => setShowSearchScanner(false)}
          />
        )}

        {loading ? (
          <div className="text-center text-slate-400 p-12">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-slate-400 p-12 flex flex-col items-center">
             <Package size={48} className="text-slate-200 mb-3" />
             <p>No products found for this company.</p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                    <th className="p-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Model Number</th>
                    <th className="p-4 font-semibold text-slate-500 uppercase text-xs tracking-wider">Barcode</th>
                    <th className="p-4 font-semibold text-center text-slate-500 uppercase text-xs tracking-wider">Total Qty</th>
                    <th className="p-4 font-semibold text-center text-slate-500 uppercase text-xs tracking-wider">Packed</th>
                    <th className="p-4 font-semibold text-center text-slate-500 uppercase text-xs tracking-wider">Remaining</th>
                    <th className="p-4 font-semibold text-center text-slate-500 uppercase text-xs tracking-wider print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const displayQty = p.masterQty > 0 ? p.masterQty : p.totalOrdered;
                    return (
                    <tr key={p.barcode} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-indigo-700">{p.name || p.modelNumber || p.asin || p.barcode}</td>
                      <td className="p-4 text-slate-500 font-mono text-sm">{p.barcode}</td>
                      <td className="p-4 text-center font-bold text-slate-700">{displayQty}</td>
                      <td className="p-4 text-center font-bold text-indigo-600">{p.totalPacked}</td>
                      <td className="p-4 text-center">
                        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-lg text-sm">
                          {displayQty - p.totalPacked}
                        </span>
                      </td>
                      <td className="p-4 text-center print:hidden">
                        <button
                          onClick={() => {
                            setEditingProduct({
                              originalBarcode: p.barcode,
                              barcode: p.barcode,
                              name: p.name,
                              companyName: p.companyName || '',
                              totalQty: displayQty
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Pencil size={18} />
                        </button>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 bg-[#111827] text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <PlusCircle className="text-emerald-500" size={20} />
                Add New Product
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setShowScanner(false);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {showScanner ? (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-slate-700">Scan Barcode</h4>
                  </div>
                  <CameraScanner 
                    onResult={(result) => {
                      setNewProduct({...newProduct, barcode: result});
                      setShowScanner(false);
                    }}
                    onClose={() => setShowScanner(false)}
                  />
                </div>
              ) : (
                <form id="add-product-form" onSubmit={handleAddProduct} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Barcode</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={newProduct.barcode}
                        onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700 font-mono"
                        placeholder="Scan or type barcode..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="bg-[#111827] text-white p-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center"
                        title="Scan Barcode"
                      >
                        <ScanLine size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">ASIN</label>
                    <input 
                      type="text" 
                      required
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700"
                      placeholder="Enter ASIN..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Company Name (Optional)</label>
                    <input 
                      type="text" 
                      value={newProduct.companyName}
                      onChange={(e) => setNewProduct({...newProduct, companyName: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700"
                      placeholder="Assign to specific company..."
                      list="filter-company-list"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Total Quantity</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newProduct.totalQty || ''}
                      onChange={(e) => setNewProduct({...newProduct, totalQty: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700"
                      placeholder="Initial inventory..."
                    />
                  </div>
                </form>
              )}
            </div>
            
            <div className="p-6 pt-2 bg-white flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setShowScanner(false);
                }}
                className="px-6 py-2.5 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-product-form"
                disabled={isSubmitting || showScanner}
                className="px-6 py-2.5 rounded-xl font-medium bg-[#059669] text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check size={18} />
                {isSubmitting ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 bg-[#111827] text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Pencil className="text-indigo-500" size={20} />
                Edit Product
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="edit-product-form" onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Barcode</label>
                  <input 
                    type="text" 
                    required
                    value={editingProduct.barcode}
                    onChange={(e) => setEditingProduct({...editingProduct, barcode: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700 font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">ASIN</label>
                  <input 
                    type="text" 
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Company Name (Optional)</label>
                  <input 
                    type="text" 
                    value={editingProduct.companyName || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, companyName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700"
                    list="filter-company-list"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Total Qty</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={editingProduct.totalQty !== undefined ? editingProduct.totalQty : ''}
                    onChange={(e) => setEditingProduct({...editingProduct, totalQty: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-700"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 pt-2 bg-white flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="px-6 py-2.5 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-product-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check size={18} />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={({ companyName: importedCompany }) => {
          fetchData();
          if (importedCompany && selectedCompany !== importedCompany) {
            setSelectedCompany(importedCompany);
          }
        }}
        initialCompanyName={selectedCompany === 'All' ? '' : selectedCompany}
        availableCompanies={companies}
      />
    </div>
  );
}
