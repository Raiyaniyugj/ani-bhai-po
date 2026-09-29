const fs = require('fs');
const path = 'src/pages/CreatePO.jsx';
let content = fs.readFileSync(path, 'utf8');

// The string to replace in the badge
const oldBadgeStr = '<span className="text-xl sm:text-2xl font-extrabold text-[#14172b]">{Math.max(0, sumTotalQty - totalPackedPcs)}</span>';
const newBadgeStr = '<span className="text-xl sm:text-2xl font-extrabold text-[#14172b]">{Math.max(0, (importedFileMeta ? importedFileMeta.totalQty : sumTotalQty) - totalPackedPcs)}</span>';

content = content.replace(oldBadgeStr, newBadgeStr);

// The string to replace in the Save PO button
const oldSaveStr = '`Save PO | ${Math.max(0, sumTotalQty - totalPackedPcs)} pcs`';
const newSaveStr = '`Save PO | ${Math.max(0, (importedFileMeta ? importedFileMeta.totalQty : sumTotalQty) - totalPackedPcs)} pcs`';

content = content.replace(oldSaveStr, newSaveStr);
content = content.replace(oldSaveStr, newSaveStr); // There are two Save PO buttons (desktop and mobile)

fs.writeFileSync(path, content, 'utf8');
console.log('Updated display logic to use importedFileMeta.totalQty if available');
