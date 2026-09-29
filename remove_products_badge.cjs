const fs = require('fs');
const path = 'src/pages/CreatePO.jsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = '{/* 2. Three tiles side by side: PO NUMBER, PRODUCTS, and TOTAL QUANTITY */}';
const endStr = '        {/* 3. Action row */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newLayout = `{/* 2. Two tiles side by side: PO NUMBER and TOTAL QUANTITY */}
        <div className="flex items-center gap-3 w-full">
          {/* PO Number Badge */}
          <div className="bg-indigo-50 px-4 py-3 rounded-2xl border border-indigo-100 flex flex-col items-center justify-center flex-1 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1 truncate">PO Number</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-indigo-900">{nextPoNo}</span>
          </div>

          {/* Total Quantity Badge */}
          <div className="bg-white px-4 py-3 rounded-2xl border border-[#e4e6f0] flex flex-col items-center justify-center flex-1 min-w-0 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#565b73] mb-1 truncate">Total Qty</span>
            <span className="text-xl sm:text-2xl font-extrabold text-[#14172b]">{sumTotalQty}</span>
            <span className="text-[11px] text-[#565b73] font-medium mt-0.5 truncate">
              Packed: <b className="text-indigo-700">{totalPackedPcs} pcs</b>
            </span>
          </div>
        </div>

`;
  
  content = content.substring(0, startIndex) + newLayout + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log('Badge removed successfully');
} else {
  console.log('Could not find badge block');
}
