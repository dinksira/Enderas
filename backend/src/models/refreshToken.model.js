import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const RefreshToken = sequelize.define(
  'RefreshToken',
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
    family_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    token_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    replaced_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
  },
  {
    tableName: 'refresh_tokens',
    paranoid: false,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  },
);

export default RefreshToken;
