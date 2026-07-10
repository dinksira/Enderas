import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const AUCTION_CATEGORIES = Object.freeze([
  'vehicles',
  'machinery',
  'buildings',
  'land',
  'equipment',
  'salvage_assets',
  'other_assets',
]);

export const AUCTION_MODES = Object.freeze(['single', 'multi']);

export const AUCTION_STATUSES = Object.freeze([
  'draft',
  'pending_approval',
  'published',
  'suspended',
  'closed',
  'cancelled',
]);

export const Auction = sequelize.define(
  'Auction',
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    asset_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    created_by_staff_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    owner_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(...AUCTION_CATEGORIES),
      allowNull: false,
      defaultValue: 'other_assets',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    auction_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_urls: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    document_files: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reserve_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    total_reserve_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    document_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    cpo_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'ETB',
    },
    status: {
      type: DataTypes.ENUM(...AUCTION_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    auction_mode: {
      type: DataTypes.ENUM(...AUCTION_MODES),
      allowNull: false,
      defaultValue: 'single',
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'auctions',
    paranoid: true,
    underscored: true,
    timestamps: true,
  },
);

export default Auction;
