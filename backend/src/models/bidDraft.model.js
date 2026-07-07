import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const BID_DRAFT_STATUSES = Object.freeze(['draft', 'locked', 'submitted', 'expired']);

export const BidDraft = sequelize.define(
  'BidDraft',
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    auction_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    auction_asset_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...BID_DRAFT_STATUSES),
      allowNull: false,
      defaultValue: 'draft',
    },
    cpo_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
  },
  {
    tableName: 'bid_drafts',
    paranoid: false,
    underscored: true,
    timestamps: true,
  },
);

export default BidDraft;
