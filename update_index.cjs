const fs = require('fs');
let indexJs = fs.readFileSync('server/index.js', 'utf8');

const imports = `const bcrypt = require('bcryptjs');\nconst jwt = require('jsonwebtoken');\nconst auth = require('./middleware/auth');\nconst User = require('./models/User');\n`;
if (!indexJs.includes("require('bcryptjs')")) {
  indexJs = indexJs.replace("const Product = require('./models/Product');", "const Product = require('./models/Product');\n" + imports);
}

// Add Auth routes
const authRoutes = `
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

// GET /api/auth/me
app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
`;

if (!indexJs.includes('/api/register')) {
  indexJs = indexJs.replace('// --- API ROUTES ---', '// --- API ROUTES ---\n' + authRoutes);
}

// Update existing routes to use auth middleware and filter by user
indexJs = indexJs.replace(/app\.get\('\/api\/pos'/g, "app.get('/api/pos', auth");
indexJs = indexJs.replace(/app\.post\('\/api\/pos'/g, "app.post('/api/pos', auth");
indexJs = indexJs.replace(/app\.get\('\/api\/pos\/:poNo'/g, "app.get('/api/pos/:poNo', auth");

indexJs = indexJs.replace(/app\.get\('\/api\/products'/g, "app.get('/api/products', auth");
indexJs = indexJs.replace(/app\.post\('\/api\/products'/g, "app.post('/api/products', auth");
indexJs = indexJs.replace(/app\.get\('\/api\/products\/barcode\/:barcode'/g, "app.get('/api/products/barcode/:barcode', auth");
indexJs = indexJs.replace(/app\.put\('\/api\/products\/:id'/g, "app.put('/api/products/:id', auth");
indexJs = indexJs.replace(/app\.delete\('\/api\/products\/:id'/g, "app.delete('/api/products/:id', auth");
indexJs = indexJs.replace(/app\.post\('\/api\/products\/bulk'/g, "app.post('/api/products/bulk', auth");

// Inside routes, add user filters
// For GET /api/pos
indexJs = indexJs.replace('const pos = await PO.find().sort({ createdAt: -1 });', 'const pos = await PO.find({ user: req.user.id }).sort({ createdAt: -1 });');
// For POST /api/pos
indexJs = indexJs.replace('const po = new PO({ poNo, companyName, boxes, totalPcs });', 'const po = new PO({ poNo, companyName, boxes, totalPcs, user: req.user.id });');
// For GET /api/pos/:poNo
indexJs = indexJs.replace('const po = await PO.findOne({ poNo });', 'const po = await PO.findOne({ poNo, user: req.user.id });');

// For GET /api/products
indexJs = indexJs.replace('const products = await Product.find().sort({ createdAt: -1 });', 'const products = await Product.find({ user: req.user.id }).sort({ createdAt: -1 });');
// For POST /api/products
indexJs = indexJs.replace('const product = new Product(', 'const product = new Product({ user: req.user.id, ');
indexJs = indexJs.replace('new Product({\n        barcode', 'new Product({\n        user: req.user.id, barcode');
// For GET barcode
indexJs = indexJs.replace('const product = await Product.findOne({ barcode });', 'const product = await Product.findOne({ barcode, user: req.user.id });');

// For Bulk insert
indexJs = indexJs.replace('const ops = products.map(p => ({', 'const ops = products.map(p => ({');
indexJs = indexJs.replace('filter: { barcode: p.barcode },', 'filter: { barcode: p.barcode, user: req.user.id },');
indexJs = indexJs.replace('update: { $set: { ...p } },', 'update: { $set: { ...p, user: req.user.id } },');

fs.writeFileSync('server/index.js', indexJs);
console.log('index.js updated');
