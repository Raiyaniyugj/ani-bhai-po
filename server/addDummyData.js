require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const PO = require('./models/PO');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/po_app';

const dummyProducts = [
  // Company 1: Apex Tech Solutions (5 products)
  {
    barcode: 'APX-1001',
    name: 'Wireless Bluetooth Keyboard RGB',
    price: 1299,
    totalQty: 100,
    companyName: 'Apex Tech Solutions'
  },
  {
    barcode: 'APX-1002',
    name: 'Ergonomic Optical Gaming Mouse',
    price: 799,
    totalQty: 150,
    companyName: 'Apex Tech Solutions'
  },
  {
    barcode: 'APX-1003',
    name: 'Ultra-Slim USB-C Multi-Port Adapter',
    price: 1450,
    totalQty: 80,
    companyName: 'Apex Tech Solutions'
  },
  {
    barcode: 'APX-1004',
    name: 'Noise-Cancelling Stereo Headset',
    price: 2499,
    totalQty: 60,
    companyName: 'Apex Tech Solutions'
  },
  {
    barcode: 'APX-1005',
    name: '1080P Full HD Streaming Webcam',
    price: 1899,
    totalQty: 90,
    companyName: 'Apex Tech Solutions'
  },

  // Company 2: Zenith Retail Corp (5 products)
  {
    barcode: 'ZNT-2001',
    name: 'Heavy Duty Packaging Tape (6-Pack)',
    price: 350,
    totalQty: 200,
    companyName: 'Zenith Retail Corp'
  },
  {
    barcode: 'ZNT-2002',
    name: 'Direct Thermal Shipping Labels (1000 Pcs)',
    price: 520,
    totalQty: 250,
    companyName: 'Zenith Retail Corp'
  },
  {
    barcode: 'ZNT-2003',
    name: 'Automatic Electronic Tape Dispenser',
    price: 2150,
    totalQty: 40,
    companyName: 'Zenith Retail Corp'
  },
  {
    barcode: 'ZNT-2004',
    name: 'Digital Heavy Duty Weight Scale 50KG',
    price: 1650,
    totalQty: 50,
    companyName: 'Zenith Retail Corp'
  },
  {
    barcode: 'ZNT-2005',
    name: 'Air Cushion Bubble Wrap Roll 50m',
    price: 780,
    totalQty: 120,
    companyName: 'Zenith Retail Corp'
  }
];

async function addDummyData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Upsert products so rerunning won't fail with duplicate key error
    console.log('\n--- Inserting / Updating Products ---');
    for (const prod of dummyProducts) {
      const updated = await Product.findOneAndUpdate(
        { barcode: prod.barcode },
        { $set: prod },
        { upsert: true, new: true }
      );
      console.log(`[Product] [${updated.companyName}] Barcode: ${updated.barcode} | Name: ${updated.name} | Qty: ${updated.totalQty} | Price: ₹${updated.price}`);
    }

    // Determine next sequential PO and Box numbers
    const allPOs = await PO.find({}, { poNo: 1, boxNo: 1 });
    let maxPoSeq = 0;
    let maxBoxSeq = 0;
    for (const p of allPOs) {
      const mPo = (p.poNo || '').match(/^PO-(\d+)$/i);
      if (mPo) {
        const val = parseInt(mPo[1], 10);
        if (!isNaN(val) && val < 100000 && val > maxPoSeq) maxPoSeq = val;
      }
      const mBox = (p.boxNo || '').match(/^BOX-(\d+)$/i);
      if (mBox) {
        const val = parseInt(mBox[1], 10);
        if (!isNaN(val) && val < 100000 && val > maxBoxSeq) maxBoxSeq = val;
      }
    }

    // Check if sample POs already exist for these companies, if not create sample POs
    const apexPoExists = await PO.findOne({ companyName: 'Apex Tech Solutions' });
    if (!apexPoExists) {
      maxPoSeq++;
      maxBoxSeq++;
      const apexPO = new PO({
        poNo: `PO-${maxPoSeq}`,
        boxNo: `BOX-${maxBoxSeq}`,
        companyName: 'Apex Tech Solutions',
        items: [
          {
            barcode: 'APX-1001',
            name: 'Wireless Bluetooth Keyboard RGB',
            totalQty: 100,
            qty: 25,
            price: 1299
          },
          {
            barcode: 'APX-1002',
            name: 'Ergonomic Optical Gaming Mouse',
            totalQty: 150,
            qty: 35,
            price: 799
          },
          {
            barcode: 'APX-1005',
            name: '1080P Full HD Streaming Webcam',
            totalQty: 90,
            qty: 15,
            price: 1899
          }
        ],
        boxes: [
          {
            name: 'Box 1',
            items: [
              { barcode: 'APX-1001', name: 'Wireless Bluetooth Keyboard RGB', pcs: 25 },
              { barcode: 'APX-1002', name: 'Ergonomic Optical Gaming Mouse', pcs: 15 }
            ]
          },
          {
            name: 'Box 2',
            items: [
              { barcode: 'APX-1002', name: 'Ergonomic Optical Gaming Mouse', pcs: 20 },
              { barcode: 'APX-1005', name: '1080P Full HD Streaming Webcam', pcs: 15 }
            ]
          }
        ],
        totalPcs: 75,
        totalAmount: (25 * 1299) + (35 * 799) + (15 * 1899)
      });
      await apexPO.save();
      console.log(`\n[PO Created] ${apexPO.poNo} for ${apexPO.companyName} (${apexPO.totalPcs} pcs, ₹${apexPO.totalAmount})`);
    } else {
      console.log(`\nSample PO for Apex Tech Solutions already exists (${apexPoExists.poNo})`);
    }

    const zenithPoExists = await PO.findOne({ companyName: 'Zenith Retail Corp' });
    if (!zenithPoExists) {
      maxPoSeq++;
      maxBoxSeq++;
      const zenithPO = new PO({
        poNo: `PO-${maxPoSeq}`,
        boxNo: `BOX-${maxBoxSeq}`,
        companyName: 'Zenith Retail Corp',
        items: [
          {
            barcode: 'ZNT-2001',
            name: 'Heavy Duty Packaging Tape (6-Pack)',
            totalQty: 200,
            qty: 50,
            price: 350
          },
          {
            barcode: 'ZNT-2002',
            name: 'Direct Thermal Shipping Labels (1000 Pcs)',
            totalQty: 250,
            qty: 60,
            price: 520
          },
          {
            barcode: 'ZNT-2004',
            name: 'Digital Heavy Duty Weight Scale 50KG',
            totalQty: 50,
            qty: 10,
            price: 1650
          }
        ],
        boxes: [
          {
            name: 'Box 1',
            items: [
              { barcode: 'ZNT-2001', name: 'Heavy Duty Packaging Tape (6-Pack)', pcs: 50 },
              { barcode: 'ZNT-2002', name: 'Direct Thermal Shipping Labels (1000 Pcs)', pcs: 30 }
            ]
          },
          {
            name: 'Box 2',
            items: [
              { barcode: 'ZNT-2002', name: 'Direct Thermal Shipping Labels (1000 Pcs)', pcs: 30 },
              { barcode: 'ZNT-2004', name: 'Digital Heavy Duty Weight Scale 50KG', pcs: 10 }
            ]
          }
        ],
        totalPcs: 120,
        totalAmount: (50 * 350) + (60 * 520) + (10 * 1650)
      });
      await zenithPO.save();
      console.log(`[PO Created] ${zenithPO.poNo} for ${zenithPO.companyName} (${zenithPO.totalPcs} pcs, ₹${zenithPO.totalAmount})`);
    } else {
      console.log(`Sample PO for Zenith Retail Corp already exists (${zenithPoExists.poNo})`);
    }

    console.log('\n--- Dummy Data Insertion Complete ---');
  } catch (err) {
    console.error('Error adding dummy data:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

addDummyData();
