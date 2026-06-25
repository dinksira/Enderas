import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const WINNER_STATUSES = Object.freeze([
  'pending_confirmation',
  'confirmed',
  'declined',
  'replaced',
]);

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
      unique: true,
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
    decline_reason: {
      type: DataTypes.TEXT,
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
