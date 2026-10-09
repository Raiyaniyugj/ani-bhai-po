const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const User = require('./User');

const Product = sequelize.define('Product', {
  barcode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  asin: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  modelNumber: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  totalQty: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  packedQty: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  price: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  companyName: {
    type: DataTypes.STRING,
    defaultValue: '',
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['barcode', 'UserId']
    }
  ]
});

// Relationships
Product.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(Product, { foreignKey: 'UserId' });

module.exports = Product;
