import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const SystemSetting = sequelize.define(
  'SystemSetting',
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    setting_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    setting_value: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    updated_by_staff_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
  },
  {
    tableName: 'system_settings',
    paranoid: false,
    underscored: true,
    timestamps: true,
  },
);

export default SystemSetting;
