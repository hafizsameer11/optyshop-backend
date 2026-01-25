const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('./Product');

const EyeHygieneVariant = sequelize.define('EyeHygieneVariant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'eye_hygiene_variants',
  indexes: [
    { fields: ['product_id'] },
    { fields: ['is_active'] }
  ]
});

// Define associations
EyeHygieneVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(EyeHygieneVariant, { foreignKey: 'product_id', as: 'eyeHygieneVariants' });

module.exports = EyeHygieneVariant;
