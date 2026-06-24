import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const ASSET_OWNER_STATUSES = Object.freeze(['active', 'inactive', 'suspended']);

export const AssetOwner = sequelize.define(
  'AssetOwner',
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
    contact_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address_line1: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address_line2: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Ethiopia',
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...ASSET_OWNER_STATUSES),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    tableName: 'asset_owners',
    paranoid: true,
    underscored: true,
    timestamps: true,
  },
);

export default AssetOwner;
