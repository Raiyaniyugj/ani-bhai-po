const mongoose = require('mongoose');
const Product = require('./models/Product');

const MONGO_URI = 'mongodb+srv://raiyaniyug5457_db_user:AojNqDRerUfi6L3Y@cluster0.53gdfyi.mongodb.net/po_app?retryWrites=true&w=majority';

const demoProducts = [
  { barcode: '1001', name: 'Premium NoteBook', totalQty: 50, price: 120.00 },
  { barcode: '1002', name: 'Gel Pen (Blue) Box', totalQty: 100, price: 55.00 },
  { barcode: '1003', name: 'Stapler Heavy Duty', totalQty: 25, price: 350.00 },
  { barcode: '1004', name: 'Printer Paper A4', totalQty: 10, price: 280.00 },
  { barcode: '1005', name: 'Ergonomic Mouse', totalQty: 5, price: 850.00 },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await Product.deleteMany({}); // clear existing
    console.log('Cleared existing products');

    await Product.insertMany(demoProducts);
    console.log('Successfully inserted demo products:');
    demoProducts.forEach(p => console.log(`- ${p.barcode} : ${p.name} (Total Qty: ${p.totalQty}, Price: ₹${p.price})`));

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

seed();
