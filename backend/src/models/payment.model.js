import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const PAYMENT_METHODS = Object.freeze(['addis_pay', 'manual']);
export const PAYMENT_STATUSES = Object.freeze(['pending', 'approved', 'rejected']);

export const Payment = sequelize.define(
  'Payment',
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
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'ETB',
    },
    payment_method: {
      type: DataTypes.ENUM(...PAYMENT_METHODS),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    transaction_reference: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    receipt_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    verified_by_staff_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gateway_response: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'payments',
    paranoid: true,
    underscored: true,
    timestamps: true,
  },
);

export default Payment;
