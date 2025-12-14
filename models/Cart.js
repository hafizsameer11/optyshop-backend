const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  coupon_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Applied coupon code'
  },
  shipping_info: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Shipping information as JSON string'
  },
  payment_info: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Payment information as JSON string (encrypted)'
  }
}, {
  tableName: 'carts',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['coupon_code'] }
  ]
});

module.exports = Cart;

