import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const BID_STATUSES = Object.freeze(['submitted', 'invalid', 'winning', 'lost']);

export const Bid = sequelize.define(
  'Bid',
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
    auction_asset_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'ETB',
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    is_valid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM(...BID_STATUSES),
      allowNull: false,
      defaultValue: 'submitted',
    },
    invalid_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: 'bids',
    paranoid: false,
    underscored: true,
    timestamps: true,
    updatedAt: false,
  },
);

export default Bid;
