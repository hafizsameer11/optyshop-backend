const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  compare_at_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  stock_status: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'backorder'),
    defaultValue: 'in_stock'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  frame_shape: {
    type: DataTypes.ENUM('round', 'square', 'oval', 'cat-eye', 'aviator', 'rectangle', 'wayfarer', 'geometric'),
    allowNull: true
  },
  frame_material: {
    type: DataTypes.ENUM('acetate', 'metal', 'tr90', 'titanium', 'wood', 'mixed'),
    allowNull: true
  },
  frame_color: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('men', 'women', 'unisex', 'kids'),
    defaultValue: 'unisex'
  },
  lens_type: {
    type: DataTypes.ENUM('prescription', 'sunglasses', 'reading', 'computer', 'photochromic', 'plastic', 'glass', 'polycarbonate', 'trivex', 'high_index'),
    allowNull: true
  },
  lens_index_options: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [1.56, 1.61, 1.67, 1.74]
  },
  treatment_options: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  model_3d_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  try_on_image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  meta_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00
  },
  review_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'products',
  indexes: [
    { fields: ['category_id'] },
    { fields: ['slug'] },
    { fields: ['sku'] },
    { fields: ['frame_shape'] },
    { fields: ['frame_material'] },
    { fields: ['is_active', 'is_featured'] }
  ]
});

module.exports = Product;

