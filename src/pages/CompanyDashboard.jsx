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

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-fade-in">
      <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Company Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Overall order status company-wise</p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {loading ? (
          <div className="text-center text-slate-400 p-12">Loading company data...</div>
        ) : companies.length === 0 ? (
           <div className="text-center text-slate-400 p-12 flex flex-col items-center">
             <Filter size={48} className="text-slate-200 mb-3" />
             <p>No companies found.</p>
           </div>
        ) : (
          <div className="space-y-4">
            {companies.map(company => (
              <div key={company.name} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div 
                  className="bg-slate-50 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors gap-4"
                  onClick={() => toggleExpand(company.name)}
                >
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{company.name}</h3>
                      <p className="text-sm text-slate-500">{company.totalOrders} {company.totalOrders === 1 ? 'Order' : 'Orders'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pieces</p>
                      <p className="text-xl font-black text-indigo-600">{company.totalPieces} <span className="text-sm font-normal text-indigo-400">pcs</span></p>
                    </div>
                    <div className="text-slate-400">
                      {expandedCompany === company.name ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>
                </div>

                {expandedCompany === company.name && (
                  <div className="p-4 md:p-6 bg-white border-t border-slate-200 animate-fade-in">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText size={18} className="text-indigo-600" /> Orders for {company.name}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                            <th className="p-3 rounded-tl-lg">PO Number</th>
                            <th className="p-3">Date</th>
                            <th className="p-3 text-right rounded-tr-lg">Pieces</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {company.orders.map(order => {
                            const pcs = order.totalPcs || (order.items ? order.items.reduce((sum, i) => sum + (i.qty || 0), 0) : 0);
                            return (
                              <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3 font-mono font-bold text-indigo-600">{order.poNo}</td>
                                <td className="p-3 text-slate-600 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="p-3 text-right font-bold text-slate-800">{pcs}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
