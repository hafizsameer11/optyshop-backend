const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cart_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'carts',
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
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
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Price at time of adding to cart'
  },
  prescription_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'prescriptions',
      key: 'id'
    },
    comment: 'Prescription ID if applicable'
  }
}, {
  tableName: 'cart_items',
  indexes: [
    { fields: ['cart_id'] },
    { fields: ['product_id'] },
    { fields: ['prescription_id'] },
    { 
      unique: true,
      fields: ['cart_id', 'product_id', 'lens_index', 'frame_size_id'],
      name: 'unique_cart_item'
    }
  ]
});

module.exports = CartItem;

