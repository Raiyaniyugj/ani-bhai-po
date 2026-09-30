const fs = require('fs');

let indexJs = fs.readFileSync('server/index.js', 'utf8');

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
  indexJs = indexJs.replace('// --- API Endpoints ---', '// --- API Endpoints ---\n' + authRoutes);
}

// Fix /api/po routes which were missed
indexJs = indexJs.replace("app.get('/api/po', async", "app.get('/api/po', auth, async");
indexJs = indexJs.replace("app.post('/api/po', async", "app.post('/api/po', auth, async");
indexJs = indexJs.replace("app.get('/api/po/:id', async", "app.get('/api/po/:id', auth, async");
indexJs = indexJs.replace("app.delete('/api/po/:id', async", "app.delete('/api/po/:id', auth, async");

// Fix user queries for /api/po
indexJs = indexJs.replace("const pos = await PO.find().collation({ locale: 'en', numericOrdering: true }).sort({ poNo: 1 });", "const pos = await PO.find({ user: req.user.id }).collation({ locale: 'en', numericOrdering: true }).sort({ poNo: 1 });");
indexJs = indexJs.replace("const po = await PO.findById(req.params.id);", "const po = await PO.findOne({ _id: req.params.id, user: req.user.id });");
indexJs = indexJs.replace("const po = await PO.findByIdAndDelete(req.params.id);", "const po = await PO.findOneAndDelete({ _id: req.params.id, user: req.user.id });");

// For PO creation, attach user
indexJs = indexJs.replace("boxes: req.body.boxes || []\n    });", "boxes: req.body.boxes || [],\n      user: req.user.id\n    });");

// Make sure Product updates handle user correctly
indexJs = indexJs.replace("const existing = await Product.findOne({ barcode });", "const existing = await Product.findOne({ barcode, user: req.user.id });");
indexJs = indexJs.replace("const product = await Product.findOne({\n      $or", "const product = await Product.findOne({\n      user: req.user.id,\n      $or");
indexJs = indexJs.replace("await Product.findOneAndUpdate(\n      { barcode: oldBarcode },", "await Product.findOneAndUpdate(\n      { barcode: oldBarcode, user: req.user.id },");
indexJs = indexJs.replace("app.put('/api/products/:barcode', async", "app.put('/api/products/:barcode', auth, async");
indexJs = indexJs.replace("app.get('/api/products/:barcode', async", "app.get('/api/products/:barcode', auth, async");
indexJs = indexJs.replace("app.get('/api/po/next-number', async", "app.get('/api/po/next-number', auth, async");

// BulkWrite products - ensure user constraint on updates
// The previous script already added user to ops, let's verify if it's there
// "const updateDoc = {" -> "const updateDoc = { user: req.user.id,"
// "filter: {" -> "filter: { user: req.user.id,"
if (!indexJs.includes("filter: { user: req.user.id,")) {
  indexJs = indexJs.replace("filter: {\n            $or", "filter: {\n            user: req.user.id,\n            $or");
  indexJs = indexJs.replace("const updateDoc = {\n        name", "const updateDoc = {\n        user: req.user.id,\n        name");
}

fs.writeFileSync('server/index.js', indexJs);
console.log('Fixed auth routes in server/index.js');
