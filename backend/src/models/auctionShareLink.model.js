import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const AuctionShareLink = sequelize.define(
  'AuctionShareLink',
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    auction_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    organization_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    max_views: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    view_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_accessed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by_staff_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    visibility_settings: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'auction_share_links',
    timestamps: true,
    underscored: true,
    paranoid: false,
  },
);

export default AuctionShareLink;
