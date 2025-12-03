const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FrameSize = sequelize.define('FrameSize', {
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
  lens_width: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Lens width in mm'
  },
  bridge_width: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Bridge width in mm'
  },
  temple_length: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    comment: 'Temple length in mm'
  },
  frame_width: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Total frame width in mm'
  },
  frame_height: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Frame height in mm'
  },
  size_label: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g., Small, Medium, Large'
  }
}, {
  tableName: 'frame_sizes',
  indexes: [
    { fields: ['product_id'] }
  ]
});

module.exports = FrameSize;

