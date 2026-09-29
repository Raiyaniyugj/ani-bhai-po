const mongoose = require('mongoose');
const Product = require('./models/Product');
const PO = require('./models/PO');

const MONGO_URI = 'mongodb+srv://raiyaniyug5457_db_user:AojNqDRerUfi6L3Y@cluster0.53gdfyi.mongodb.net/po_app?retryWrites=true&w=majority';

async function clearData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete all products
    const productResult = await Product.deleteMany({});
    console.log(`Deleted ${productResult.deletedCount} products`);

    // Delete all POs
    const poResult = await PO.deleteMany({});
    console.log(`Deleted ${poResult.deletedCount} POs`);

    console.log('All data has been successfully erased.');
  } catch (err) {
    console.error('Error clearing data:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

clearData();
