const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SimulationConfig = sequelize.define('SimulationConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  config_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  config_value: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Configuration value as JSON'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g., pd_calculator, lens_thickness, photochromic'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'simulation_configs',
  indexes: [
    { fields: ['config_key'] },
    { fields: ['category'] }
  ]
});

module.exports = SimulationConfig;

