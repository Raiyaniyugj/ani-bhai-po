const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  barcode: { type: String, required: true },
  name: { type: String, required: true },
  asin: { type: String, default: '' },
  modelNumber: { type: String, default: '' },
  totalQty: { type: Number, default: 0 },
  qty: { type: Number, required: true },
  price: { type: Number, default: 0 }
}, { _id: false });

const boxItemSchema = new mongoose.Schema({
  barcode: { type: String },
  name: { type: String },
  pcs: { type: Number, default: 0 }
}, { _id: false });

const boxSchema = new mongoose.Schema({
  name: { type: String, required: true },
  items: [boxItemSchema]
}, { _id: false });

const poSchema = new mongoose.Schema({
  poNo: { type: String, required: true },
  boxNo: { type: String },
  totalPcs: { type: Number, default: 0 },
  companyName: { type: String, required: true },
  items: [poItemSchema],
  boxes: [boxSchema],
  totalAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PO', poSchema);
