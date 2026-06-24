import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const Staff = sequelize.define(
  'Staff',
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
    },
    role_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    activated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deactivated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by_staff_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
  },
  {
    tableName: 'staff',
    paranoid: true,
  },
);

export default Staff;
