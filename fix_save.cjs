const fs = require('fs');
let c = fs.readFileSync('src/pages/CreatePO.jsx', 'utf8');
c = c.replace(/Save PO A[^\$]*\$\{/g, 'Save PO | ${');
fs.writeFileSync('src/pages/CreatePO.jsx', c);
