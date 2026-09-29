if (!process.env.VERCEL) {
  require('dotenv').config();
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const PO = require('./models/PO');
const Product = require('./models/Product');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const User = require('./models/User');


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const getMongoUri = () => process.env.MONGO_URI || process.env.MONGODB_URI || (!process.env.VERCEL ? 'mongodb://localhost:27017/po_app' : '');

// Serverless-friendly cached MongoDB connection
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }
  const mongoUri = getMongoUri();
  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in Vercel. Please add your MongoDB Atlas connection string to your Vercel Project Environment Variables.');
  }
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(mongoUri, opts).then(async (m) => {
      console.log('Connected to MongoDB');
      try {
        const count = await Product.countDocuments();
        if (count === 0) {
          await Product.insertMany([
            { barcode: '123456789', name: 'Premium Wireless Headphones', price: 199.99 },
            { barcode: '987654321', name: 'Ergonomic Office Chair', price: 249.50 },
            { barcode: '111222333', name: 'Mechanical Keyboard RGB', price: 129.00 },
            { barcode: '444555666', name: '4K Ultra HD Monitor', price: 349.99 },
          ]);
        }
      } catch (seedErr) {
        console.error('Error during initial product seed:', seedErr);
      }
      return m;
    }).catch(err => {
      cached.promise = null;
      throw err;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

// Ensure database is connected before handling any API request
app.use(async (req, res, next) => {
  if (!req.path.startsWith('/api')) return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    const rawUri = getMongoUri();
    const sanitizedUri = rawUri ? rawUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@') : 'NOT_SET';
    console.error(`Database connection error [Target: ${sanitizedUri}]:`, err);
    res.status(500).json({ 
      message: 'Database connection failed', 
      configuredUri: sanitizedUri,
      hint: sanitizedUri.includes('localhost') || sanitizedUri.includes('127.0.0.1')
        ? 'Your Vercel environment variable MONGO_URI is set to localhost. Cloud deployments on Vercel cannot reach your local computer. Please provide a MongoDB Atlas cloud connection string (mongodb+srv://...).'
        : 'Ensure your MongoDB Atlas network access allows access from anywhere (0.0.0.0/0).',
      error: err.message 
    });
  }
});

// --- API Endpoints ---

// AUTH ROUTES
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.status(201).json({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
    res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get Product by barcode, ASIN, or modelNumber
app.get('/api/products/:barcode', auth, async (req, res) => {
  try {
    const rawCode = (req.params.barcode || '').trim();
    if (!rawCode) return res.status(400).json({ message: 'Barcode is required' });

    const escaped = rawCode.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const exactRegex = new RegExp(`^${escaped}$`, 'i');

    const product = await Product.findOne({
      user: req.user.id,
      $or: [
        { barcode: rawCode },
        { barcode: { $regex: exactRegex } },
        { asin: { $regex: exactRegex } },
        { modelNumber: { $regex: exactRegex } },
        { name: { $regex: exactRegex } }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Bulk upsert products (from Excel import)
app.post('/api/products/bulk', auth, async (req, res) => {
  try {
    const { products, companyName } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'No products provided' });
    }

    const operations = products.map(item => {
      const barcode = (item.barcode || item.asin || item.modelNumber || `ITEM-${Date.now().toString().slice(-6)}`).trim();
      const asin = (item.asin || '').trim();
      const modelNumber = (item.modelNumber || '').trim();
      const name = (item.name || modelNumber || asin || barcode).trim();
      const totalQty = parseInt(item.totalQty, 10) || 0;
      const price = parseFloat(item.price) || 0;
      const comp = (companyName || item.companyName || '').trim();

      const updateDoc = {
        user: req.user.id,
        name,
        totalQty,
        price,
        companyName: comp
      };
      if (asin) updateDoc.asin = asin;
      if (modelNumber) updateDoc.modelNumber = modelNumber;

      return {
        updateOne: {
          filter: {
            user: req.user.id,
            $or: [
              { barcode },
              ...(asin ? [{ asin }] : []),
              ...(modelNumber ? [{ modelNumber }] : [])
            ]
          },
          update: {
            $set: updateDoc,
            $setOnInsert: { barcode }
          },
          upsert: true
        }
      };
    });

    const bulkResult = await Product.bulkWrite(operations);

    // Return the updated products
    const identifiers = products.map(p => (p.barcode || p.asin || p.modelNumber || '').trim()).filter(Boolean);
    const savedProducts = await Product.find({
      $or: [
        { barcode: { $in: identifiers } },
        { asin: { $in: identifiers } },
        { modelNumber: { $in: identifiers } }
      ]
    });

    res.json({
      success: true,
      message: `Successfully processed ${products.length} products`,
      upsertedCount: bulkResult.upsertedCount,
      modifiedCount: bulkResult.modifiedCount,
      products: savedProducts
    });
  } catch (err) {
    console.error('Bulk Import Error:', err);
    res.status(500).json({ message: 'Failed to import products', error: err.message });
  }
});

// Get all Products
app.get('/api/products', auth, async (req, res) => {
  try {
    const products = await Product.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new Product
app.post('/api/products', auth, async (req, res) => {
  try {
    const { barcode, name, asin, modelNumber, totalQty, price, companyName } = req.body;
    
    // Check if barcode already exists
    const existing = await Product.findOne({ barcode, user: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'Product with this barcode already exists' });
    }

    const newProduct = new Product({
      barcode: barcode || `ITEM-${Date.now().toString().slice(-6)}`,
      name: name || modelNumber || asin || 'New Product',
      asin: asin || '',
      modelNumber: modelNumber || '',
      totalQty: totalQty || 0,
      price: price || 0,
      companyName: companyName || ''
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Product
app.put('/api/products/:barcode', auth, async (req, res) => {
  try {
    const oldBarcode = req.params.barcode;
    const { barcode, name, asin, modelNumber, totalQty, companyName } = req.body;
    
    // Check if new barcode already exists
    if (barcode && barcode !== oldBarcode) {
      const existing = await Product.findOne({ barcode });
      if (existing) {
        return res.status(400).json({ message: 'Product with this new barcode already exists' });
      }
    }

    const updateFields = { barcode: barcode || oldBarcode };
    if (name) updateFields.name = name;
    if (asin !== undefined) updateFields.asin = asin;
    if (modelNumber !== undefined) updateFields.modelNumber = modelNumber;
    if (totalQty !== undefined) updateFields.totalQty = totalQty;
    if (companyName !== undefined) updateFields.companyName = companyName;

    // Update in Product collection
    await Product.findOneAndUpdate(
      { barcode: oldBarcode, user: req.user.id },
      { $set: updateFields },
      { new: true }
    );
    
    // Update in PO items
    if (name || barcode) {
      const setObj = {};
      if (barcode) setObj["items.$[elem].barcode"] = barcode;
      if (name) setObj["items.$[elem].name"] = name;

      await PO.updateMany(
        { "items.barcode": oldBarcode },
        { $set: setObj },
        { arrayFilters: [ { "elem.barcode": oldBarcode } ] }
      );
    }

    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Helper for sequential ascending PO Number (PO-0001, PO-0002, PO-0003...)
const getNextPoNumber = async () => {
  const allPOs = await PO.find({}, { poNo: 1 });
  let maxSeq = 0;
  for (const p of allPOs) {
    const m = (p.poNo || '').match(/^PO-(\d+)$/i);
    if (m) {
      const val = parseInt(m[1], 10);
      if (!isNaN(val) && val < 100000 && val > maxSeq) {
        maxSeq = val;
      }
    }
  }
  let nextNum = maxSeq + 1;
  while (await PO.exists({ poNo: `PO-${nextNum}` })) {
    nextNum++;
  }
  return `PO-${nextNum}`;
};

// Helper for sequential ascending Box Number (BOX-0001, BOX-0002...)
const getNextBoxNumber = async () => {
  const allPOs = await PO.find({}, { boxNo: 1 });
  let maxSeq = 0;
  for (const p of allPOs) {
    const m = (p.boxNo || '').match(/^BOX-(\d+)$/i);
    if (m) {
      const val = parseInt(m[1], 10);
      if (!isNaN(val) && val < 100000 && val > maxSeq) {
        maxSeq = val;
      }
    }
  }
  let nextNum = maxSeq + 1;
  while (await PO.exists({ boxNo: `BOX-${nextNum}` })) {
    nextNum++;
  }
  return `BOX-${nextNum}`;
};

// Get next sequential PO number
app.get('/api/po/next-number', auth, async (req, res) => {
  try {
    const nextPoNo = await getNextPoNumber();
    res.json({ nextPoNo });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new PO
app.post('/api/po', auth, async (req, res) => {
  try {
    const poNo = await getNextPoNumber();
    const boxNo = await getNextBoxNumber();

    const rawItems = req.body.items || [];
    const items = rawItems.map(item => ({
      barcode: item.barcode || 'N/A',
      name: item.name || 'Product',
      asin: item.asin || '',
      modelNumber: item.modelNumber || '',
      totalQty: item.totalQty || 0,
      qty: item.qty || 0,
      price: item.price || 0
    }));

    const totalPcs = req.body.totalPcs || items.reduce((sum, i) => sum + i.qty, 0);
    const totalAmount = req.body.totalAmount || items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    const newPO = new PO({
      ...req.body,
      poNo,
      boxNo,
      totalPcs,
      totalAmount,
      items,
      boxes: req.body.boxes || [],
      user: req.user.id
    });

    const savedPO = await newPO.save();

    // Update packedQty for each product
    for (const item of items) {
      if (item.barcode && item.barcode !== 'N/A') {
        await Product.updateOne(
          { barcode: item.barcode },
          { $inc: { packedQty: item.qty } }
        );
      }
    }
    res.status(201).json(savedPO);
  } catch (err) {
    console.error('PO Creation Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all POs - line-wise in ascending order
app.get('/api/po', auth, async (req, res) => {
  try {
    const pos = await PO.find({ user: req.user.id }).collation({ locale: 'en', numericOrdering: true }).sort({ poNo: 1 });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single PO
app.get('/api/po/:id', auth, async (req, res) => {
  try {
    const po = await PO.findOne({ _id: req.params.id, user: req.user.id });
    if (!po) {
      return res.status(404).json({ message: 'PO not found' });
    }
    res.json(po);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete PO
app.delete('/api/po/:id', auth, async (req, res) => {
  try {
    const po = await PO.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!po) {
      return res.status(404).json({ message: 'PO not found' });
    }
    res.json({ message: 'PO deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
