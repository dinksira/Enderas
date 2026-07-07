import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const CPO_PAYMENT_METHODS = Object.freeze(['addis_pay', 'manual']);
export const CPO_PAYMENT_STATUSES = Object.freeze(['pending', 'approved', 'rejected']);

export const CpoPayment = sequelize.define(
  'CpoPayment',
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    cpo_id: {
      type: DataTypes.CHAR(36),
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
      type: DataTypes.ENUM(...CPO_PAYMENT_METHODS),
      allowNull: false,
    },
    receipt_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    transaction_reference: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...CPO_PAYMENT_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
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
  },
  {
    tableName: 'cpo_payments',
    underscored: true,
    timestamps: true,
  },
);

export default CpoPayment;
