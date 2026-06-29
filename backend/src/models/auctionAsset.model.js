import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const LOT_OUTCOME_STATUSES = Object.freeze([
  'pending',
  'sold',
  'unsold',
  'withdrawn',
]);

export const AuctionAsset = sequelize.define(
  'AuctionAsset',
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
    asset_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    reserve_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lot_label: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    outcome_status: {
      type: DataTypes.ENUM(...LOT_OUTCOME_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    tableName: 'auction_assets',
    underscored: true,
    timestamps: true,
    paranoid: false,
  },
);

export default AuctionAsset;
