const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Snapshot of product name at time of order'
  },
  product_sku: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Snapshot of product SKU at time of order'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price at time of order'
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  lens_index: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true
  },
  lens_coatings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of coating IDs or names'
  },
  frame_size_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'frame_sizes',
      key: 'id'
    }
  },
  customization: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional customization options'
  }
}, {
  tableName: 'order_items',
  indexes: [
    { fields: ['order_id'] },
    { fields: ['product_id'] }
  ]
});

module.exports = OrderItem;

