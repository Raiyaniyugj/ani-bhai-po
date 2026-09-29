import React, { useState, useEffect } from 'react';
import { getPOs } from '../services/api';
import { Building2, Package, Filter, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function CompanyDashboard() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCompany, setExpandedCompany] = useState(null);

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

  // Group by company
  const companyData = pos.reduce((acc, po) => {
    const name = po.companyName || 'Unnamed Company';
    if (!acc[name]) {
      acc[name] = {
        name,
        totalOrders: 0,
        totalPieces: 0,
        orders: []
      };
    }
    acc[name].totalOrders += 1;
    acc[name].totalPieces += po.totalPcs || (po.items ? po.items.reduce((sum, i) => sum + (i.qty || 0), 0) : 0);
    acc[name].orders.push(po);
    return acc;
  }, {});

  const companies = Object.values(companyData).sort((a, b) => a.name.localeCompare(b.name));

  const toggleExpand = (companyName) => {
    if (expandedCompany === companyName) {
      setExpandedCompany(null);
    } else {
      setExpandedCompany(companyName);
    }
  };

  const totalOrders = pos.length;
  const totalPiecesAll = pos.reduce((acc, po) => acc + (po.totalPcs || (po.items ? po.items.reduce((sum, i) => sum + (i.qty || 0), 0) : 0)), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Summary Tiles */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e4e6f0] p-4 flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-[#565b73] uppercase tracking-wider mb-1">Companies</span>
          <span className="text-2xl font-black text-[#14172b]">{companies.length}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[#e4e6f0] p-4 flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-[#565b73] uppercase tracking-wider mb-1">Orders</span>
          <span className="text-2xl font-black text-[#14172b]">{totalOrders}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[#e4e6f0] p-4 flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-[#565b73] uppercase tracking-wider mb-1">Pieces</span>
          <span className="text-2xl font-black text-indigo-700">{totalPiecesAll}</span>
        </div>
      </div>

      {/* 2. Main Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e4e6f0]">
        <div className="p-4 border-b border-[#e4e6f0]">
          <h2 className="text-[18px] font-bold text-[#14172b]">Company Overview</h2>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {loading ? (
            <div className="text-center text-[#565b73] p-8">Loading company data...</div>
          ) : companies.length === 0 ? (
            <div className="text-center text-[#565b73] p-8 flex flex-col items-center gap-3 bg-[#f8f9fc] rounded-2xl">
              <Filter size={48} className="text-[#e4e6f0]" />
              <p className="font-bold">No companies found.</p>
            </div>
          ) : (
            companies.map(company => (
              <div key={company.name} className="border border-[#e4e6f0] rounded-2xl overflow-hidden shadow-sm transition-all bg-[#f8f9fc]">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#e4e6f0]/50 transition-colors gap-3"
                  onClick={() => toggleExpand(company.name)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-[44px] h-[44px] rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Building2 size={24} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-[15px] font-bold text-[#14172b] truncate">{company.name}</h3>
                      <p className="text-[13px] text-[#565b73] font-medium">{company.totalOrders} {company.totalOrders === 1 ? 'order' : 'orders'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[16px] font-black text-[#14172b]">{company.totalPieces}</span>
                      <span className="text-[10px] font-bold text-[#565b73] uppercase">pcs</span>
                    </div>
                    <div className="text-[#a0a5b8] flex items-center justify-center w-6 h-6">
                      {expandedCompany === company.name ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>
                </div>

                {expandedCompany === company.name && (
                  <div className="bg-white border-t border-[#e4e6f0]">
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f8f9fc] text-[#565b73] text-[12px] uppercase font-bold border-b border-[#e4e6f0]">
                            <th className="p-3 pl-4">PO Number</th>
                            <th className="p-3">Date</th>
                            <th className="p-3 pr-4 text-right">Pieces</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e4e6f0]">
                          {company.orders.map(order => {
                            const pcs = order.totalPcs || (order.items ? order.items.reduce((sum, i) => sum + (i.qty || 0), 0) : 0);
                            return (
                              <tr key={order._id} className="hover:bg-[#f8f9fc]">
                                <td className="p-3 pl-4 font-mono font-bold text-indigo-700">{order.poNo}</td>
                                <td className="p-3 text-[#565b73] text-[13px] font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="p-3 pr-4 text-right font-bold text-[#14172b]">{pcs}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:hidden flex flex-col divide-y divide-[#e4e6f0]">
                      {company.orders.map(order => {
                        const pcs = order.totalPcs || (order.items ? order.items.reduce((sum, i) => sum + (i.qty || 0), 0) : 0);
                        return (
                          <div key={order._id} className="flex justify-between items-center p-4">
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-indigo-700 text-[15px]">{order.poNo}</span>
                              <span className="text-[#565b73] text-[12px] font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className="font-bold text-[#14172b] bg-[#f8f9fc] px-2 py-1 rounded-lg border border-[#e4e6f0]">{pcs} pcs</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
