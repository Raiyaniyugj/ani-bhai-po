const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  asin: { type: String, default: '' },
  modelNumber: { type: String, default: '' },
  totalQty: { type: Number, default: 0 },
  packedQty: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  companyName: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
