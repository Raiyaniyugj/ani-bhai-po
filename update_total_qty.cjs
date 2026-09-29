const fs = require('fs');
const path = 'src/pages/CreatePO.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Change the big number in TOTAL QUANTITY badge to show remaining pieces
const badgeStart = content.indexOf('{/* Total Quantity Badge */}');
const badgeEnd = content.indexOf('</div>', badgeStart) + 6;

if (badgeStart !== -1 && badgeEnd !== -1) {
  let badgeBlock = content.substring(badgeStart, badgeEnd);
  // Replace the sumTotalQty with the remaining calculation
  badgeBlock = badgeBlock.replace(
    '<span className="text-xl sm:text-2xl font-extrabold text-[#14172b]">{sumTotalQty}</span>',
    '<span className="text-xl sm:text-2xl font-extrabold text-[#14172b]">{Math.max(0, sumTotalQty - totalPackedPcs)}</span>'
  );
  content = content.substring(0, badgeStart) + badgeBlock + content.substring(badgeEnd);
}

// 2. Fix the Save PO button encoding issue
content = content.replace(/Save PO A \$\{sumTotalQty\}/g, 'Save PO · ${Math.max(0, sumTotalQty - totalPackedPcs)}');
content = content.replace(/Save PO · \$\{sumTotalQty\}/g, 'Save PO · ${Math.max(0, sumTotalQty - totalPackedPcs)}');

fs.writeFileSync(path, content, 'utf8');
console.log('Total Quantity logic updated');
