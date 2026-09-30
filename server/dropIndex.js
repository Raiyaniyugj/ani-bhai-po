require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/po_app';

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    const indexes = await collection.indexes();
    console.log("Current indexes:", indexes);
    
    // Check if barcode_1 exists
    const hasBarcode1 = indexes.find(i => i.name === 'barcode_1');
    if (hasBarcode1) {
      console.log("Dropping barcode_1 index...");
      await collection.dropIndex('barcode_1');
      console.log("Dropped barcode_1 successfully.");
    } else {
      console.log("barcode_1 index not found.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
