import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';

import CreatePO from './pages/CreatePO';
import POList from './pages/POList';
import CompanyDashboard from './pages/CompanyDashboard';
import Products from './pages/Products';
import { FileText, PlusCircle, LayoutDashboard, ScanLine, QrCode, FileSpreadsheet, Download } from 'lucide-react';
import CameraScanner from './components/CameraScanner';
import { useState } from 'react';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f4f5fa]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function Navigation() {
  const { user } = useAuth();
  if (!user) return null;
  const location = useLocation();
  const path = location.pathname;

  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState(false);
  const navigate = require('react-router-dom').useNavigate(); // We need useNavigate

  const handleGlobalScan = (code) => {
    setIsGlobalScannerOpen(false);
    sessionStorage.setItem('global_scanned_barcode', code);
    navigate('/create');
  };

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
        <button
          onClick={() => {
            if (path !== '/create') {
              sessionStorage.setItem('auto_open_scanner', 'true');
              navigate('/create');
            } else {
              window.dispatchEvent(new CustomEvent('open-camera-scanner'));
            }
          }}
          className="flex items-center gap-2 font-medium transition-colors text-slate-600 hover:text-indigo-600"
        >
          <QrCode size={18} /> Scan
        </button>


        <Link
          to="/create"
          onClick={() => {
            localStorage.removeItem('active_po_products');
            localStorage.removeItem('active_po_boxes');
            sessionStorage.setItem('force_blank_po', 'true');
            window.dispatchEvent(new CustomEvent('clear-po-form', { detail: { fullClear: false } }));
          }}
          className={`flex items-center gap-2 font-medium transition-colors ${path === '/create' ? 'text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}
        >
          <PlusCircle size={18} /> New PO
        </Link>

        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('export-excel'));
          }}
          className="flex items-center gap-2 font-medium transition-colors text-emerald-600 hover:text-emerald-700"
        >
          <Download size={18} /> Export
        </button>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[76px] bg-white border-t border-slate-200 flex justify-around items-center px-2 pb-safe z-50">
        <Link to="/dashboard" className="flex flex-col items-center justify-center w-[16%] gap-1">
          <div className={`p-1.5 rounded-full ${path === '/dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>
            <LayoutDashboard size={22} />
          </div>
          <span className={`text-[10px] font-bold ${path === '/dashboard' ? 'text-indigo-700' : 'text-slate-500'}`}>Overview</span>
        </Link>

        <Link to="/list" className="flex flex-col items-center justify-center w-[16%] gap-1">
          <div className={`p-1.5 rounded-full ${path === '/list' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>
            <FileText size={22} />
          </div>
          <span className={`text-[10px] font-bold ${path === '/list' ? 'text-indigo-700' : 'text-slate-500'}`}>POs</span>
        </Link>

        <button
          onClick={() => {
            if (path !== '/create') {
              sessionStorage.setItem('auto_open_scanner', 'true');
              navigate('/create');
            } else {
              window.dispatchEvent(new CustomEvent('open-camera-scanner'));
            }
          }}
          className="flex flex-col items-center justify-center w-[16%] gap-1"
        >
          <div className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100">
            <QrCode size={22} />
          </div>
          <span className="text-[10px] font-bold text-slate-500">Scan</span>
        </button>

        <button
          onClick={() => {
            if (path !== '/create') navigate('/create');
            // Give time for /create to mount if it wasn't mounted
            setTimeout(() => window.dispatchEvent(new CustomEvent('open-import-modal')), 50);
          }}
          className="flex flex-col items-center justify-center w-[16%] gap-1"
        >
          <div className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100">
            <FileSpreadsheet size={22} />
          </div>
          <span className="text-[10px] font-bold text-slate-500">Import</span>
        </button>

        <Link
          to="/create"
          onClick={() => {
            localStorage.removeItem('active_po_products');
            localStorage.removeItem('active_po_boxes');
            sessionStorage.setItem('force_blank_po', 'true');
            window.dispatchEvent(new CustomEvent('clear-po-form', { detail: { fullClear: false } }));
          }}
          className="flex flex-col items-center justify-center w-[16%] gap-1"
        >
          <div className={`p-1.5 rounded-full ${path === '/create' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`}>
            <PlusCircle size={22} />
          </div>
          <span className={`text-[10px] font-bold ${path === '/create' ? 'text-indigo-700' : 'text-slate-500'}`}>New PO</span>
        </Link>

        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('export-excel'));
          }}
          className="flex flex-col items-center justify-center w-[16%] gap-1"
        >
          <div className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-50">
            <Download size={22} />
          </div>
          <span className="text-[10px] font-bold text-emerald-600">Export</span>
        </button>
      </nav>

      {isGlobalScannerOpen && (
        <CameraScanner
          onResult={handleGlobalScan}
          onClose={() => setIsGlobalScannerOpen(false)}
        />
      )}
    </>
  );
}


const AuthHeader = () => {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <header className="bg-white shadow-sm border-b border-[#e4e6f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              P
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">PO System</h1>
          </div>
          <div className="flex items-center gap-6">
            <Navigation />
            <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors hidden md:block">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#f4f5fa] text-[#14172b] font-jakarta">
          <header className="bg-white shadow-sm border-b border-[#e4e6f0]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-14 sm:h-16 items-center">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-700 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm">
                    P
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">PO System</h1>
                </div>
                <Navigation />
              </div>
            </div>
          </header>

          {/* Add bottom padding pb-40 for the mobile tab bar + floating action bars */}
          <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8 pb-40 md:pb-8">
            <Routes>
              <Route path="/" element={<Navigate to="/create" replace />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/create" element={<ProtectedRoute><CreatePO /></ProtectedRoute>} />
              <Route path="/list" element={<ProtectedRoute><POList /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><CompanyDashboard /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
