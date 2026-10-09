if (!process.env.VERCEL) {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const { Op } = require('sequelize');

const { sequelize, connectMySQL } = require('./db');
const PO = require('./models_sql/PO');
const Product = require('./models_sql/Product');
const User = require('./models_sql/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Ensure DB connection before API requests
app.use(async (req, res, next) => {
  if (!req.path.startsWith('/api')) return next();
  try {
    await connectMySQL();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

// AUTH ROUTES
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, name });
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Draft Routes
app.get('/api/draft', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    res.json(user.draftPO || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/draft', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    user.draftPO = req.body;
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Product by barcode, ASIN, or modelNumber
app.get('/api/products/:barcode', auth, async (req, res) => {
  try {
    const rawCode = (req.params.barcode || '').trim();
    if (!rawCode) return res.status(400).json({ message: 'Barcode is required' });

    const product = await Product.findOne({
      where: {
        UserId: req.user.id,
        [Op.or]: [
          { barcode: rawCode },
          { asin: rawCode },
          { modelNumber: rawCode },
          { name: rawCode }
        ]
      }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Bulk upsert products
app.post('/api/products/bulk', auth, async (req, res) => {
  try {
    const { products, companyName } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'No products provided' });
    }

    await Product.destroy({ where: { UserId: req.user.id } });

    const deduplicatedProducts = {};
    for (const item of products) {
      let barcode = (item.barcode || item.asin || item.modelNumber || '').trim();
      if (!barcode) {
        barcode = `ITEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }

      if (!deduplicatedProducts[barcode]) {
        deduplicatedProducts[barcode] = { ...item, barcode };
      } else {
        deduplicatedProducts[barcode].totalQty = 
          (parseInt(deduplicatedProducts[barcode].totalQty, 10) || 0) + 
          (parseInt(item.totalQty, 10) || 0);
      }
    }

    const uniqueProducts = Object.values(deduplicatedProducts).map(item => ({
      UserId: req.user.id,
      barcode: item.barcode,
      asin: (item.asin || '').trim(),
      modelNumber: (item.modelNumber || '').trim(),
      name: (item.name || item.modelNumber || item.asin || item.barcode).trim(),
      totalQty: parseInt(item.totalQty, 10) || 0,
      price: parseFloat(item.price) || 0,
      companyName: (companyName || item.companyName || '').trim()
    }));

    await Product.bulkCreate(uniqueProducts);
    
    const identifiers = products.map(p => (p.barcode || p.asin || p.modelNumber || '').trim()).filter(Boolean);
    const savedProducts = await Product.findAll({
      where: {
        UserId: req.user.id,
        [Op.or]: [
          { barcode: { [Op.in]: identifiers } },
          { asin: { [Op.in]: identifiers } },
          { modelNumber: { [Op.in]: identifiers } }
        ]
      }
    });

    res.json({
      success: true,
      message: `Successfully processed ${products.length} products`,
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
    const products = await Product.findAll({
      where: { UserId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new Product
app.post('/api/products', auth, async (req, res) => {
  try {
    const { barcode, name, asin, modelNumber, totalQty, price, companyName } = req.body;
    
    const finalBarcode = barcode || `ITEM-${Date.now().toString().slice(-6)}`;
    const existing = await Product.findOne({ where: { barcode: finalBarcode, UserId: req.user.id } });
    if (existing) {
      return res.status(400).json({ message: 'Product with this barcode already exists' });
    }

    const newProduct = await Product.create({
      barcode: finalBarcode,
      UserId: req.user.id,
      name: name || modelNumber || asin || 'New Product',
      asin: asin || '',
      modelNumber: modelNumber || '',
      totalQty: totalQty || 0,
      price: price || 0,
      companyName: companyName || ''
    });

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update Product
app.put('/api/products/:barcode', auth, async (req, res) => {
  try {
    const oldBarcode = req.params.barcode;
    const { barcode, name, asin, modelNumber, totalQty, companyName } = req.body;
    
    if (barcode && barcode !== oldBarcode) {
      const existing = await Product.findOne({ where: { barcode, UserId: req.user.id } });
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

    await Product.update(updateFields, {
      where: { barcode: oldBarcode, UserId: req.user.id }
    });
    
    if (name || barcode) {
      const pos = await PO.findAll({ where: { UserId: req.user.id } });
      for (let po of pos) {
        let changed = false;
        let newItems = po.items ? [...po.items] : [];
        newItems.forEach(item => {
          if (item.barcode === oldBarcode) {
             if(barcode) item.barcode = barcode;
             if(name) item.name = name;
             changed = true;
          }
        });
        if (changed) {
          po.items = newItems;
          await po.save();
        }
      }
    }

    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const getNextPoNumber = async () => {
  const allPOs = await PO.findAll({ attributes: ['poNo'] });
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
  while (await PO.findOne({ where: { poNo: `PO-${nextNum}` } })) {
    nextNum++;
  }
  return `PO-${nextNum}`;
};

const getNextBoxNumber = async () => {
  const allPOs = await PO.findAll({ attributes: ['boxNo'] });
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
  while (await PO.findOne({ where: { boxNo: `BOX-${nextNum}` } })) {
    nextNum++;
  }
  return `BOX-${nextNum}`;
};

app.get('/api/po/next-number', auth, async (req, res) => {
  try {
    const nextPoNo = await getNextPoNumber();
    res.json({ nextPoNo });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

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

    const savedPO = await PO.create({
      ...req.body,
      poNo,
      boxNo,
      totalPcs,
      totalAmount,
      items,
      boxes: req.body.boxes || [],
      UserId: req.user.id
    });

    for (const item of items) {
      if (item.barcode && item.barcode !== 'N/A') {
        const product = await Product.findOne({
          where: { UserId: req.user.id, barcode: item.barcode }
        });
        if (product) {
          product.packedQty = (product.packedQty || 0) + (parseInt(item.qty, 10) || 0);
          await product.save();
        }
      }
    }
    res.status(201).json(savedPO);
  } catch (err) {
    console.error('PO Creation Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/po', auth, async (req, res) => {
  try {
    const pos = await PO.findAll({ 
      where: { UserId: req.user.id },
      order: [['poNo', 'ASC']]
    });
    res.json(pos);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/po/:id', auth, async (req, res) => {
  try {
    const po = await PO.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    if (!po) {
      return res.status(404).json({ message: 'PO not found' });
    }
    res.json(po);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/po/:id', auth, async (req, res) => {
  try {
    const po = await PO.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    if (!po) {
      return res.status(404).json({ message: 'PO not found' });
    }
    await po.destroy();
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
