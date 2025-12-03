const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  prescription_type: {
    type: DataTypes.ENUM('single_vision', 'bifocal', 'trifocal', 'progressive'),
    allowNull: false,
    defaultValue: 'single_vision'
  },
  // Right Eye (OD)
  od_sphere: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Right eye sphere power'
  },
  od_cylinder: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Right eye cylinder power'
  },
  od_axis: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 180
    },
    comment: 'Right eye axis (0-180)'
  },
  od_add: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Right eye add power (for bifocal/progressive)'
  },
  // Left Eye (OS)
  os_sphere: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Left eye sphere power'
  },
  os_cylinder: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Left eye cylinder power'
  },
  os_axis: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 180
    },
    comment: 'Left eye axis (0-180)'
  },
  os_add: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Left eye add power (for bifocal/progressive)'
  },
  // Pupillary Distance
  pd_binocular: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Binocular PD in mm'
  },
  pd_monocular_od: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Right eye monocular PD in mm'
  },
  pd_monocular_os: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Left eye monocular PD in mm'
  },
  pd_near: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Near PD in mm'
  },
  // Pupillary Height
  ph_od: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Right eye pupillary height in mm'
  },
  ph_os: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Left eye pupillary height in mm'
  },
  // Additional Info
  doctor_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  doctor_license: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  prescription_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether prescription is verified by admin'
  }
}, {
  tableName: 'prescriptions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_active'] }
  ]
});

module.exports = Prescription;

