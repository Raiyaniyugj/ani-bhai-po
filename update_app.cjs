const fs = require('fs');
const path = 'src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import CameraScanner')) {
  content = content.replace(
    "import { FileText, PlusCircle, LayoutDashboard, ScanLine } from 'lucide-react';",
    "import { FileText, PlusCircle, LayoutDashboard, ScanLine, QrCode } from 'lucide-react';\nimport CameraScanner from './components/CameraScanner';\nimport { useState } from 'react';"
  );
}

const navFunctionStart = content.indexOf('function Navigation() {');
const navReturnStart = content.indexOf('  return (', navFunctionStart);

if (navFunctionStart !== -1 && navReturnStart !== -1 && !content.includes('const [isGlobalScannerOpen')) {
  const stateInsert = `  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState(false);
  const navigate = require('react-router-dom').useNavigate(); // We need useNavigate

  const handleGlobalScan = (code) => {
    setIsGlobalScannerOpen(false);
    sessionStorage.setItem('global_scanned_barcode', code);
    navigate('/create');
  };\n\n`;
  content = content.substring(0, navReturnStart) + stateInsert + content.substring(navReturnStart);
}

// Add the Scan button in the middle of mobile tab bar (between POs and New PO)
const mobileTabBarStart = content.indexOf('{/* Mobile Bottom Tab Bar */}');
const newPoLinkStart = content.indexOf('<Link \n          to="/create" ', mobileTabBarStart);

if (mobileTabBarStart !== -1 && newPoLinkStart !== -1 && !content.includes('onClick={() => setIsGlobalScannerOpen(true)}')) {
  const scanButton = `
        <button 
          onClick={() => setIsGlobalScannerOpen(true)}
          className="flex flex-col items-center justify-center w-20 gap-1"
        >
          <div className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100">
            <QrCode size={24} />
          </div>
          <span className="text-[11px] font-bold text-slate-500">Scan</span>
        </button>

        `;
  content = content.substring(0, newPoLinkStart) + scanButton + content.substring(newPoLinkStart);
}

// Also add it to desktop nav
const desktopNavStart = content.indexOf('{/* Desktop Top Nav */}');
const desktopNewPoStart = content.indexOf('<Link \n          to="/create" ', desktopNavStart);
if (desktopNavStart !== -1 && desktopNewPoStart !== -1 && !content.substring(desktopNavStart, desktopNewPoStart).includes('setIsGlobalScannerOpen(true)')) {
  const desktopScanButton = `
        <button 
          onClick={() => setIsGlobalScannerOpen(true)}
          className="flex items-center gap-2 font-medium transition-colors text-slate-600 hover:text-indigo-600"
        >
          <QrCode size={18} /> Scan
        </button>
`;
  content = content.substring(0, desktopNewPoStart) + desktopScanButton + content.substring(desktopNewPoStart);
}

// Finally render CameraScanner
const navReturnEnd = content.lastIndexOf('</>');
if (navReturnEnd !== -1 && !content.includes('isGlobalScannerOpen &&')) {
  const cameraScannerRender = `
      {isGlobalScannerOpen && (
        <CameraScanner 
          onResult={handleGlobalScan}
          onClose={() => setIsGlobalScannerOpen(false)}
        />
      )}
      `;
  content = content.substring(0, navReturnEnd) + cameraScannerRender + content.substring(navReturnEnd);
}

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx updated');
