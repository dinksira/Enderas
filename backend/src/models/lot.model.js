import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const Lot = sequelize.define(
  'Lot',
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: 'lots',
    paranoid: true,
    underscored: true,
    timestamps: true,
  },
);

export default Lot;
