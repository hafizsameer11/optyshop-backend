const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LensType = sequelize.define('LensType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  index: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    comment: 'Lens index (1.56, 1.61, 1.67, 1.74)'
  },
  thickness_factor: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Thickness reduction factor'
  },
  price_adjustment: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Additional price for this lens index'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'lens_types'
});

module.exports = LensType;

