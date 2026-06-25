import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const EVALUATION_STATUSES = Object.freeze([
  'scheduled',
  'in_progress',
  'completed',
  'approved',
  'rejected',
]);

export const EVALUATION_RECOMMENDATIONS = Object.freeze(['approved', 'rejected']);

export const Evaluation = sequelize.define(
  'Evaluation',
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    asset_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
    },
    evaluated_by_staff_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    valuation_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'ETB',
    },
    reserve_price_recommendation: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    photo_urls: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    report_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    recommendation: {
      type: DataTypes.ENUM(...EVALUATION_RECOMMENDATIONS),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...EVALUATION_STATUSES),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'evaluations',
    paranoid: true,
    underscored: true,
    timestamps: true,
  },
);

export default Evaluation;
