import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import CreatePO from './pages/CreatePO';
import POList from './pages/POList';
import CompanyDashboard from './pages/CompanyDashboard';
import Products from './pages/Products';
import { FileText, PlusCircle, LayoutDashboard, ScanLine } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      {/* Desktop Top Nav */}
      <nav className="hidden md:flex items-center gap-6">
        <Link to="/dashboard" className={`flex items-center gap-2 font-medium transition-colors ${path === '/dashboard' ? 'text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}>
          <LayoutDashboard size={18} /> Overview
        </Link>
        <Link to="/list" className={`flex items-center gap-2 font-medium transition-colors ${path === '/list' ? 'text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}>
          <FileText size={18} /> View POs
        </Link>
        <Link 
          to="/create" 
          onClick={() => {
            localStorage.removeItem('active_po_company');
            localStorage.removeItem('active_po_products');
            localStorage.removeItem('active_po_boxes');
            sessionStorage.setItem('force_blank_po', 'true');
            window.dispatchEvent(new CustomEvent('clear-po-form'));
          }}
          className={`flex items-center gap-2 font-medium transition-colors ${path === '/create' ? 'text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}
        >
          <ScanLine size={18} /> New PO
        </Link>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-slate-200 flex justify-around items-center px-2 pb-safe z-50">
        <Link to="/dashboard" className="flex flex-col items-center justify-center w-20 gap-1">
          <div className={`p-1.5 rounded-full ${path === '/dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>
            <LayoutDashboard size={24} />
          </div>
          <span className={`text-[11px] font-bold ${path === '/dashboard' ? 'text-indigo-700' : 'text-slate-500'}`}>Overview</span>
        </Link>
        
        <Link to="/list" className="flex flex-col items-center justify-center w-20 gap-1">
          <div className={`p-1.5 rounded-full ${path === '/list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>
            <FileText size={24} />
          </div>
          <span className={`text-[11px] font-bold ${path === '/list' ? 'text-indigo-700' : 'text-slate-500'}`}>POs</span>
        </Link>

        <Link 
          to="/create" 
          onClick={() => {
            localStorage.removeItem('active_po_company');
            localStorage.removeItem('active_po_products');
            localStorage.removeItem('active_po_boxes');
            sessionStorage.setItem('force_blank_po', 'true');
            window.dispatchEvent(new CustomEvent('clear-po-form'));
          }}
          className="flex flex-col items-center justify-center w-20 gap-1"
        >
          <div className={`p-1.5 rounded-full ${path === '/create' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>
            <ScanLine size={24} />
          </div>
          <span className={`text-[11px] font-bold ${path === '/create' ? 'text-indigo-700' : 'text-slate-500'}`}>New PO</span>
        </Link>
      </nav>
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#f4f5fa] text-[#14172b] font-jakarta">
        <header className="bg-white shadow-sm border-b border-[#e4e6f0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                  P
                </div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">PO System</h1>
              </div>
              <Navigation />
            </div>
          </div>
        </header>

        {/* Add bottom padding pb-24 for the mobile tab bar (76px + safe area) */}
        <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">
          <Routes>
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route path="/create" element={<CreatePO />} />
            <Route path="/list" element={<POList />} />
            <Route path="/products" element={<Products />} />
            <Route path="/dashboard" element={<CompanyDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
