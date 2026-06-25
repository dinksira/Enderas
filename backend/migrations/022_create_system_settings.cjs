'use strict';

const DEFAULT_SETTINGS = [
  {
    id: 'a3000001-0001-4001-8001-000000000001',
    setting_key: 'localization.default_language',
    setting_value: 'en',
    description: 'Default UI language code',
  },
  {
    id: 'a3000002-0002-4002-8002-000000000002',
    setting_key: 'localization.supported_languages',
    setting_value: ['en', 'am'],
    description: 'Supported UI language codes',
  },
  {
    id: 'a3000003-0003-4003-8003-000000000003',
    setting_key: 'auction.default_currency',
    setting_value: 'ETB',
    description: 'Default auction currency',
  },
  {
    id: 'a3000004-0004-4004-8004-000000000004',
    setting_key: 'auction.default_cpo_percentage',
    setting_value: 1,
    description: 'Default CPO percentage',
  },
  {
    id: 'a3000005-0005-4005-8005-000000000005',
    setting_key: 'auction.min_bid_increment',
    setting_value: 1000,
    description: 'Minimum bid increment amount',
  },
  {
    id: 'a3000006-0006-4006-8006-000000000006',
    setting_key: 'otp.ttl_seconds',
    setting_value: 300,
    description: 'OTP time-to-live in seconds',
  },
  {
    id: 'a3000007-0007-4007-8007-000000000007',
    setting_key: 'storage.max_file_size',
    setting_value: 5242880,
    description: 'Maximum upload file size in bytes',
  },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('system_settings', {
      id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
      },
      setting_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      setting_value: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      updated_by_staff_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    const now = new Date();
    await queryInterface.bulkInsert(
      'system_settings',
      DEFAULT_SETTINGS.map((row) => ({
        id: row.id,
        setting_key: row.setting_key,
        setting_value: JSON.stringify(row.setting_value),
        description: row.description,
        updated_by_staff_id: null,
        created_at: now,
        updated_at: now,
      })),
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('system_settings');
  },
};
