import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const CPO_STATUSES = Object.freeze(['pending', 'approved', 'rejected']);
export const CPO_REFUND_STATUSES = Object.freeze(['none', 'pending', 'approved', 'paid']);

export const Cpo = sequelize.define(
  'Cpo',
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
    document_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...CPO_STATUSES),
      allowNull: false,
      defaultValue: 'pending',
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    refund_status: {
      type: DataTypes.ENUM(...CPO_REFUND_STATUSES),
      allowNull: false,
      defaultValue: 'none',
    },
    refund_processed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refund_processed_by_staff_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
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
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    selected_auction_asset_ids: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    required_cpo_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    declared_cpo_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    proposed_bids: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'cpos',
    paranoid: true,
    underscored: true,
    timestamps: true,
  },
);

export default Cpo;
