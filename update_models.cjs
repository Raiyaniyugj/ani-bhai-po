const fs = require('fs');

const poPath = 'server/models/PO.js';
let poContent = fs.readFileSync(poPath, 'utf8');
if (!poContent.includes("user: {")) {
  poContent = poContent.replace(
    'poNo: { type: String, required: true },',
    'poNo: { type: String, required: true },\n  user: { type: mongoose.Schema.Types.ObjectId, ref: \'User\', required: true },'
  );
  fs.writeFileSync(poPath, poContent, 'utf8');
}

const prodPath = 'server/models/Product.js';
let prodContent = fs.readFileSync(prodPath, 'utf8');
if (!prodContent.includes("user: {")) {
  prodContent = prodContent.replace(
    'barcode: { type: String, required: true, unique: true },',
    'barcode: { type: String, required: true },\n  user: { type: mongoose.Schema.Types.ObjectId, ref: \'User\', required: true },'
  );
  // Remove unique constraint on barcode because it should be unique PER USER, not globally
  // We will need to define a compound index in Product.js
  if (!prodContent.includes("productSchema.index({ barcode: 1, user: 1 }, { unique: true })")) {
      prodContent = prodContent.replace(
        'module.exports = mongoose.model',
        'productSchema.index({ barcode: 1, user: 1 }, { unique: true });\n\nmodule.exports = mongoose.model'
      );
  }
  fs.writeFileSync(prodPath, prodContent, 'utf8');
}
