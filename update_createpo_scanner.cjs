const fs = require('fs');
const path = 'src/pages/CreatePO.jsx';
let content = fs.readFileSync(path, 'utf8');

const insertionPoint = content.indexOf('  useEffect(() => {\n    refreshNextPoNo();\n  }, []);');

if (insertionPoint !== -1 && !content.includes('global_scanned_barcode')) {
  const newUseEffect = `  useEffect(() => {
    const globalCode = sessionStorage.getItem('global_scanned_barcode');
    if (globalCode) {
      sessionStorage.removeItem('global_scanned_barcode');
      setBarcodeInput(globalCode);
      lookupBarcode(globalCode);
      // Optional: focus the QTY input or model number input after a slight delay
      setTimeout(() => {
        const qtyInput = document.getElementById('qty-to-pack');
        if (qtyInput) qtyInput.focus();
      }, 500);
    }
  }, []);\n\n`;
  content = content.substring(0, insertionPoint) + newUseEffect + content.substring(insertionPoint);
}

// Add ID to Qty to pack input for autofocus
content = content.replace(
  'className="w-full h-[52px] px-4 bg-[#f8f9fc] border-[1.5px] border-[#e4e6f0] rounded-2xl outline-none focus:bg-white focus:border-indigo-700 font-bold text-[#14172b] text-[16px]"\n                    placeholder="Qty to pack"',
  'id="qty-to-pack"\n                    className="w-full h-[52px] px-4 bg-[#f8f9fc] border-[1.5px] border-[#e4e6f0] rounded-2xl outline-none focus:bg-white focus:border-indigo-700 font-bold text-[#14172b] text-[16px]"\n                    placeholder="Qty to pack"'
);

fs.writeFileSync(path, content, 'utf8');
console.log('CreatePO.jsx updated with global scanner logic');
