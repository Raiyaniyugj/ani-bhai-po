const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  barcode: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  asin: { type: String, default: '' },
  modelNumber: { type: String, default: '' },
  totalQty: { type: Number, default: 0 },
  packedQty: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  companyName: { type: String, default: '' }
}, { timestamps: true });

productSchema.index({ barcode: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
