import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const KYCVerification = sequelize.define(
  'KYCVerification',
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
    document_type: {
      type: DataTypes.ENUM(
        'national_id',
        'passport',
        'driving_license',
        'trade_license',
        'tin_certificate',
        'business_registration',
        'other',
      ),
      allowNull: false,
    },
    document_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    document_front_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    document_back_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    trade_license_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    tin_certificate_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    business_registration_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
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
    review_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    under_review_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'kyc_verifications',
    underscored: true,
    timestamps: true,
    paranoid: true,
  },
);

export default KYCVerification;
