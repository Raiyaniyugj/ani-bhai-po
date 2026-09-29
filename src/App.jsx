import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import CreatePO from './pages/CreatePO';
import POList from './pages/POList';
import CompanyDashboard from './pages/CompanyDashboard';
import Products from './pages/Products';
import { FileText, PlusCircle, LayoutDashboard, Package } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                  P
                </div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">PO System</h1>
              </div>
              <nav className="flex items-center gap-3 sm:gap-6 overflow-x-auto">
                <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">
                  <LayoutDashboard size={18} /> <span className="hidden sm:inline">Overview</span>
                </Link>

                <Link to="/list" className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap">
                  <FileText size={18} /> <span className="hidden sm:inline">View POs</span>
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
                  className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium transition-colors whitespace-nowrap"
                >
                  <PlusCircle size={18} /> <span className="hidden sm:inline">New PO</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
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
