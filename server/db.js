const { Sequelize } = require('sequelize');

// Make sure your XAMPP MySQL is running!
// Replace 'po_database' with the actual database name you want to use.
// Default XAMPP MySQL user is 'root' and password is '' (empty).
const sequelize = new Sequelize('po_database', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Successfully connected to MySQL (XAMPP)!');
    // Sync models to the database (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ All MySQL tables synced!');
  } catch (error) {
    console.error('❌ Unable to connect to the database. Make sure MySQL is running in XAMPP.', error);
  }
};

module.exports = { sequelize, connectMySQL };
