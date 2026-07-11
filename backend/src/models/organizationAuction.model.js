import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';

export const OrganizationAuction = sequelize.define(
  'OrganizationAuction',
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    organization_user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    auction_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    linked_by_staff_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
  },
  {
    tableName: 'organization_auctions',
    underscored: true,
    timestamps: true,
    paranoid: false,
  },
);

export default OrganizationAuction;
