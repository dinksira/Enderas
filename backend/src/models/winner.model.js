import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const WINNER_STATUSES = Object.freeze([
  'pending_confirmation',
  'confirmed',
  'declined',
  'replaced',
]);

export const SELECTION_METHODS = Object.freeze(['auto', 'manual']);

export const Winner = sequelize.define(
  'Winner',
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
    bid_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    selected_by_staff_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    selected_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM(...WINNER_STATUSES),
      allowNull: false,
      defaultValue: 'pending_confirmation',
    },
    selection_method: {
      type: DataTypes.ENUM(...SELECTION_METHODS),
      allowNull: false,
      defaultValue: 'manual',
    },
    decline_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    declined_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notification_sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'winners',
    paranoid: true,
    underscored: true,
    timestamps: true,
  },
);

export default Winner;
