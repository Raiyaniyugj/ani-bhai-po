const { connectMySQL } = require('./db');
const User = require('./models_sql/User');
const bcrypt = require('bcryptjs');

async function init() {
  try {
    console.log('Connecting and syncing database...');
    await connectMySQL();
    
    // Check if demo user exists
    const existing = await User.findOne({ where: { email: 'demo@example.com' } });
    if (!existing) {
      console.log('Creating demo user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'demo@example.com',
        password: hashedPassword,
        name: 'Demo User'
      });
      console.log('✅ Created demo user: demo@example.com (Password: password123)');
    } else {
      console.log('✅ Demo user already exists.');
    }
    
    console.log('✅ Database is fully ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

init();
