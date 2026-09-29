const mongoose = require('mongoose');
const PO = require('./models/PO');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/po_app';

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const allPOs = await PO.find({});
  let updatedCount = 0;

  for (const po of allPOs) {
    let modified = false;

    // Fix poNo
    const poMatch = (po.poNo || '').match(/^PO-0+(\d+)$/i);
    if (poMatch) {
      po.poNo = `PO-${poMatch[1]}`;
      modified = true;
    } else if ((po.poNo || '').match(/^PO-0$/i)) {
      po.poNo = `PO-0`; // Should not happen, but just in case
      modified = true;
    }

    // Fix boxNo
    const boxMatch = (po.boxNo || '').match(/^BOX-0+(\d+)$/i);
    if (boxMatch) {
      po.boxNo = `BOX-${boxMatch[1]}`;
      modified = true;
    } else if ((po.boxNo || '').match(/^BOX-0$/i)) {
      po.boxNo = `BOX-0`;
      modified = true;
    }

    if (modified) {
      await po.save();
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} POs`);
  process.exit(0);
};

run().catch(console.error);
