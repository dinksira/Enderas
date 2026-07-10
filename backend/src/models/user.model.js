import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    role_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    user_type: {
      type: DataTypes.ENUM('individual', 'organization'),
      allowNull: false,
      defaultValue: 'individual',
    },
    mobile_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    national_id_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    tin_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    organization_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    profile_picture: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    preferred_language: {
      type: DataTypes.ENUM('en', 'am'),
      allowNull: false,
      defaultValue: 'en',
    },
    is_mobile_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'kyc_pending',
        'kyc_under_review',
        'kyc_rejected',
        'active',
        'suspended',
        'deactivated',
      ),
      allowNull: false,
      defaultValue: 'pending',
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'users',
    paranoid: true,
    defaultScope: {
      attributes: {
        exclude: ['password', 'national_id_number', 'tin_number'],
      },
    },
    scopes: {
      withCredentials: {
        attributes: { include: ['password'] },
      },
    },
  },
);

export default User;
