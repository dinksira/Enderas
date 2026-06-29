import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const ASSET_TYPES = Object.freeze([
  'vehicle',
  'land',
  'building',
  'machinery',
  'equipment',
  'salvage',
  'other',
]);

export const OWNERSHIP_DOCUMENT_TYPES = Object.freeze([
  'vehicle_registration_book',
  'title_deed',
  'ownership_certificate',
  'purchase_documents',
  'other',
]);

export const ASSET_STATUSES = Object.freeze([
  'pending_review',
  'approved',
  'rejected',
  'under_evaluation',
  'evaluated',
  'in_auction',
  'sold',
]);

export const ASSET_TYPE_OWNERSHIP_DOC = Object.freeze({
  vehicle: 'vehicle_registration_book',
  land: 'title_deed',
  building: 'ownership_certificate',
  machinery: 'purchase_documents',
  equipment: 'purchase_documents',
  salvage: 'other',
  other: 'other',
});

export const Asset = sequelize.define(
  'Asset',
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    asset_owner_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    submission_batch_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    asset_type: {
      type: DataTypes.ENUM(...ASSET_TYPES),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ownership_document_type: {
      type: DataTypes.ENUM(...OWNERSHIP_DOCUMENT_TYPES),
      allowNull: true,
    },
    ownership_document_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    additional_document_urls: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    condition_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image_urls: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    desired_reserve_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    auction_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...ASSET_STATUSES),
      allowNull: false,
      defaultValue: 'pending_review',
    },
    reviewed_by_staff_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'assets',
    paranoid: true,
    underscored: true,
    timestamps: true,
  },
);

export default Asset;
