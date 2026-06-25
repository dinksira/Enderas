import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const NOTIFICATION_TYPES = Object.freeze([
  'registration',
  'kyc_approved',
  'kyc_rejected',
  'asset_approved',
  'asset_rejected',
  'payment_approved',
  'payment_rejected',
  'cpo_approved',
  'cpo_rejected',
  'auction_published',
  'winner_announcement',
  'general',
]);

export const NOTIFICATION_CHANNELS = Object.freeze(['sms', 'email', 'in_app']);
export const NOTIFICATION_STATUSES = Object.freeze(['pending', 'sent', 'failed', 'read']);

export const Notification = sequelize.define(
  'Notification',
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
    type: {
      type: DataTypes.ENUM(...NOTIFICATION_TYPES),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    channel: {
      type: DataTypes.ENUM(...NOTIFICATION_CHANNELS),
      allowNull: false,
      defaultValue: 'in_app',
    },
    status: {
      type: DataTypes.ENUM(...NOTIFICATION_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'notifications',
    paranoid: false,
    underscored: true,
    timestamps: true,
  },
);

export default Notification;
