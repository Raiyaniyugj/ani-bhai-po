const { DataTypes } = require('sequelize');
const { sequelize } = require('../db');
const User = require('./User');

const PO = sequelize.define('PO', {
  poNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  boxNo: {
    type: DataTypes.STRING,
  },
  totalPcs: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  items: {
    type: DataTypes.JSON, // Stores the array of items
  },
  boxes: {
    type: DataTypes.JSON, // Stores the array of boxes
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  }
}, {
  timestamps: true,
});

// Relationships
PO.belongsTo(User, { foreignKey: 'UserId' });
User.hasMany(PO, { foreignKey: 'UserId' });

module.exports = PO;
