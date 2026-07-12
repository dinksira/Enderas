'use strict';

const {
  ROLE_IDS,
  ROLE_SEEDS,
  DEFAULT_SETTINGS,
  SUPER_ADMIN_USER_ID,
  SUPER_ADMIN_STAFF_ID,
  SUPER_ADMIN_PASSWORD_HASH,
} = require('./data/role-permissions.cjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { DATE, NOW, CHAR, STRING, TEXT, ENUM, DECIMAL, INTEGER, BOOLEAN, JSON } = Sequelize;

    // ─────────────────────────────────────────────
    // 1. ROLES
    // ─────────────────────────────────────────────
    await queryInterface.createTable('roles', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      name: { type: STRING(100), allowNull: false, unique: true },
      code: { type: STRING(50), allowNull: false, unique: true },
      description: { type: TEXT, allowNull: true },
      is_active: { type: BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    await queryInterface.addIndex('roles', ['is_active'], { name: 'roles_is_active_idx' });

    // ─────────────────────────────────────────────
    // 2. USERS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('users', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      role_id: { type: CHAR(36), allowNull: false },
      user_type: {
        type: ENUM('individual', 'organization'),
        allowNull: false,
        defaultValue: 'individual',
      },
      mobile_number: { type: STRING(20), allowNull: false, unique: true },
      email: { type: STRING(255), allowNull: true, unique: true },
      password: { type: STRING(255), allowNull: false },
      national_id_number: { type: STRING(50), allowNull: true, unique: true },
      tin_number: { type: STRING(50), allowNull: true, unique: true },
      first_name: { type: STRING(100), allowNull: true },
      last_name: { type: STRING(100), allowNull: true },
      organization_name: { type: STRING(255), allowNull: true },
      profile_picture: { type: STRING(500), allowNull: true },
      preferred_language: {
        type: ENUM('en', 'am'),
        allowNull: false,
        defaultValue: 'en',
      },
      is_mobile_verified: { type: BOOLEAN, allowNull: false, defaultValue: false },
      is_email_verified: { type: BOOLEAN, allowNull: false, defaultValue: false },
      status: {
        type: ENUM(
          'pending',
          'kyc_pending',
          'kyc_under_review',
          'kyc_rejected',
          'active',
          'suspended',
          'deactivated',
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      last_login_at: { type: DATE, allowNull: true },
      failed_login_attempts: { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      display_password: { type: STRING(255), allowNull: true, defaultValue: null },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('users', ['role_id'], { name: 'users_role_id_idx' });
    await queryInterface.addIndex('users', ['status'], { name: 'users_status_idx' });
    await queryInterface.addIndex('users', ['user_type'], { name: 'users_user_type_idx' });

    // ─────────────────────────────────────────────
    // 3. ASSET OWNERS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('asset_owners', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      user_id: { type: CHAR(36), allowNull: false, unique: true },
      contact_phone: { type: STRING(20), allowNull: true },
      address_line1: { type: STRING(255), allowNull: true },
      address_line2: { type: STRING(255), allowNull: true },
      city: { type: STRING(100), allowNull: true },
      region: { type: STRING(100), allowNull: true },
      country: { type: STRING(100), allowNull: false, defaultValue: 'Ethiopia' },
      postal_code: { type: STRING(20), allowNull: true },
      status: {
        type: ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('asset_owners', ['status'], { name: 'asset_owners_status_idx' });

    // ─────────────────────────────────────────────
    // 4. STAFF
    // ─────────────────────────────────────────────
    await queryInterface.createTable('staff', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      user_id: { type: CHAR(36), allowNull: false, unique: true },
      role_id: { type: CHAR(36), allowNull: false },
      employee_id: { type: STRING(50), allowNull: true, unique: true },
      department: { type: STRING(100), allowNull: true },
      is_active: { type: BOOLEAN, allowNull: false, defaultValue: true },
      activated_at: { type: DATE, allowNull: true },
      deactivated_at: { type: DATE, allowNull: true },
      created_by_staff_id: { type: CHAR(36), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('staff', ['role_id'], { name: 'staff_role_id_idx' });
    await queryInterface.addIndex('staff', ['is_active'], { name: 'staff_is_active_idx' });
    await queryInterface.addIndex('staff', ['created_by_staff_id'], { name: 'staff_created_by_staff_id_idx' });

    // ─────────────────────────────────────────────
    // 5. KYC VERIFICATIONS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('kyc_verifications', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      user_id: { type: CHAR(36), allowNull: false },
      document_type: {
        type: ENUM(
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
      document_number: { type: STRING(100), allowNull: true },
      document_front_url: { type: STRING(500), allowNull: true },
      document_back_url: { type: STRING(500), allowNull: true },
      trade_license_url: { type: STRING(500), allowNull: true },
      tin_certificate_url: { type: STRING(500), allowNull: true },
      business_registration_url: { type: STRING(500), allowNull: true },
      status: {
        type: ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reviewed_by_staff_id: { type: CHAR(36), allowNull: true },
      reviewed_at: { type: DATE, allowNull: true },
      rejection_reason: { type: TEXT, allowNull: true },
      review_notes: { type: TEXT, allowNull: true },
      under_review_at: { type: DATE, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('kyc_verifications', ['user_id'], { name: 'kyc_verifications_user_id_idx' });
    await queryInterface.addIndex('kyc_verifications', ['status'], { name: 'kyc_verifications_status_idx' });
    await queryInterface.addIndex('kyc_verifications', ['reviewed_by_staff_id'], {
      name: 'kyc_verifications_reviewed_by_staff_id_idx',
    });
    await queryInterface.addIndex('kyc_verifications', ['user_id', 'status'], {
      name: 'kyc_verifications_user_id_status_idx',
    });

    // ─────────────────────────────────────────────
    // 6. ASSETS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('assets', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      asset_owner_id: { type: CHAR(36), allowNull: false },
      submission_batch_id: { type: CHAR(36), allowNull: true },
      asset_type: {
        type: ENUM('vehicle', 'land', 'building', 'machinery', 'equipment', 'salvage', 'other'),
        allowNull: false,
      },
      title: { type: STRING(255), allowNull: false },
      description: { type: TEXT, allowNull: true },
      location: { type: STRING(255), allowNull: true },
      address: { type: STRING(500), allowNull: true },
      ownership_document_type: {
        type: ENUM(
          'vehicle_registration_book',
          'title_deed',
          'ownership_certificate',
          'purchase_documents',
          'other',
        ),
        allowNull: true,
      },
      ownership_document_url: { type: STRING(500), allowNull: true },
      additional_document_urls: { type: JSON, allowNull: true },
      condition_notes: { type: TEXT, allowNull: true },
      image_urls: { type: JSON, allowNull: true },
      desired_reserve_price: { type: DECIMAL(15, 2), allowNull: true },
      auction_conditions: { type: TEXT, allowNull: true },
      status: {
        type: ENUM(
          'pending_review',
          'approved',
          'rejected',
          'under_evaluation',
          'evaluated',
          'in_auction',
          'sold',
        ),
        allowNull: false,
        defaultValue: 'pending_review',
      },
      reviewed_by_staff_id: { type: CHAR(36), allowNull: true },
      reviewed_at: { type: DATE, allowNull: true },
      rejection_reason: { type: TEXT, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('assets', ['asset_owner_id'], { name: 'assets_asset_owner_id_idx' });
    await queryInterface.addIndex('assets', ['submission_batch_id'], { name: 'assets_submission_batch_id_idx' });
    await queryInterface.addIndex('assets', ['status'], { name: 'assets_status_idx' });
    await queryInterface.addIndex('assets', ['asset_type'], { name: 'assets_asset_type_idx' });
    await queryInterface.addIndex('assets', ['reviewed_by_staff_id'], { name: 'assets_reviewed_by_staff_id_idx' });

    // ─────────────────────────────────────────────
    // 7. EVALUATIONS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('evaluations', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      asset_id: { type: CHAR(36), allowNull: false, unique: true },
      evaluated_by_staff_id: { type: CHAR(36), allowNull: true },
      scheduled_at: { type: DATE, allowNull: true },
      started_at: { type: DATE, allowNull: true },
      completed_at: { type: DATE, allowNull: true },
      valuation_amount: { type: DECIMAL(18, 2), allowNull: true },
      currency: { type: STRING(3), allowNull: false, defaultValue: 'ETB' },
      reserve_price_recommendation: { type: DECIMAL(18, 2), allowNull: true },
      photo_urls: { type: JSON, allowNull: true },
      report_url: { type: STRING(500), allowNull: true },
      recommendation: { type: ENUM('approved', 'rejected'), allowNull: true },
      status: {
        type: ENUM('scheduled', 'in_progress', 'completed', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      notes: { type: TEXT, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('evaluations', ['evaluated_by_staff_id'], {
      name: 'evaluations_evaluated_by_staff_id_idx',
    });
    await queryInterface.addIndex('evaluations', ['status'], { name: 'evaluations_status_idx' });

    // ─────────────────────────────────────────────
    // 8. AUCTIONS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('auctions', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      asset_id: { type: CHAR(36), allowNull: true },
      created_by_staff_id: { type: CHAR(36), allowNull: false },
      owner_id: { type: CHAR(36), allowNull: true },
      title: { type: STRING(255), allowNull: false },
      category: {
        type: ENUM(
          'vehicles',
          'machinery',
          'buildings',
          'land',
          'equipment',
          'salvage_assets',
          'other_assets',
        ),
        allowNull: false,
        defaultValue: 'other_assets',
      },
      description: { type: TEXT, allowNull: true },
      auction_conditions: { type: TEXT, allowNull: true },
      image_urls: { type: JSON, allowNull: true },
      document_files: { type: JSON, allowNull: true },
      start_date: { type: DATE, allowNull: false },
      end_date: { type: DATE, allowNull: false },
      reserve_price: { type: DECIMAL(18, 2), allowNull: false },
      total_reserve_price: { type: DECIMAL(18, 2), allowNull: true },
      document_price: { type: DECIMAL(18, 2), allowNull: false, defaultValue: 0 },
      cpo_percentage: { type: DECIMAL(5, 2), allowNull: false, defaultValue: 1 },
      currency: { type: STRING(3), allowNull: false, defaultValue: 'ETB' },
      status: {
        type: ENUM('draft', 'pending_approval', 'published', 'suspended', 'closed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      auction_mode: {
        type: ENUM('single', 'multi'),
        allowNull: false,
        defaultValue: 'single',
      },
      published_at: { type: DATE, allowNull: true },
      closed_at: { type: DATE, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('auctions', ['created_by_staff_id'], { name: 'auctions_created_by_staff_id_idx' });
    await queryInterface.addIndex('auctions', ['status'], { name: 'auctions_status_idx' });
    await queryInterface.addIndex('auctions', ['start_date'], { name: 'auctions_start_date_idx' });
    await queryInterface.addIndex('auctions', ['end_date'], { name: 'auctions_end_date_idx' });
    await queryInterface.addIndex('auctions', ['status', 'end_date'], { name: 'auctions_status_end_date_idx' });
    await queryInterface.addIndex('auctions', ['asset_id'], { name: 'auctions_asset_id_idx' });
    await queryInterface.addIndex('auctions', ['owner_id'], { name: 'auctions_owner_id_idx' });

    // ─────────────────────────────────────────────
    // 9. LOTS (from 004)
    // ─────────────────────────────────────────────
    await queryInterface.createTable('lots', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      auction_id: { type: CHAR(36), allowNull: false },
      title: { type: STRING(255), allowNull: false },
      description: { type: TEXT, allowNull: true },
      sort_order: { type: INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('lots', ['auction_id'], { name: 'lots_auction_id_idx' });
    await queryInterface.addIndex('lots', ['auction_id', 'sort_order'], { name: 'lots_sort_order_idx' });

    // ─────────────────────────────────────────────
    // 10. AUCTION ASSETS (with lot_id + tags from 004)
    // ─────────────────────────────────────────────
    await queryInterface.createTable('auction_assets', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      auction_id: { type: CHAR(36), allowNull: false },
      lot_id: { type: CHAR(36), allowNull: true },
      asset_id: { type: CHAR(36), allowNull: false },
      reserve_price: { type: DECIMAL(18, 2), allowNull: false },
      sort_order: { type: INTEGER, allowNull: false, defaultValue: 0 },
      lot_label: { type: STRING(50), allowNull: true },
      tags: { type: JSON, allowNull: true },
      outcome_status: {
        type: ENUM('pending', 'sold', 'unsold', 'withdrawn'),
        allowNull: false,
        defaultValue: 'pending',
      },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    await queryInterface.addIndex('auction_assets', ['auction_id', 'asset_id'], {
      unique: true,
      name: 'auction_assets_auction_id_asset_id_unique',
    });
    await queryInterface.addIndex('auction_assets', ['auction_id'], { name: 'auction_assets_auction_id_idx' });
    await queryInterface.addIndex('auction_assets', ['asset_id'], { name: 'auction_assets_asset_id_idx' });
    await queryInterface.addIndex('auction_assets', ['lot_id'], { name: 'auction_assets_lot_id_idx' });

    // ─────────────────────────────────────────────
    // 11. AUCTION DOCUMENTS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('auction_documents', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      auction_id: { type: CHAR(36), allowNull: false },
      uploaded_by_staff_id: { type: CHAR(36), allowNull: false },
      title: { type: STRING(255), allowNull: false },
      description: { type: TEXT, allowNull: true },
      file_url: { type: STRING(500), allowNull: false },
      file_name: { type: STRING(255), allowNull: false },
      file_size: { type: INTEGER.UNSIGNED, allowNull: true },
      mime_type: { type: STRING(100), allowNull: false, defaultValue: 'application/pdf' },
      download_count: { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      is_active: { type: BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('auction_documents', ['auction_id'], { name: 'auction_documents_auction_id_idx' });
    await queryInterface.addIndex('auction_documents', ['uploaded_by_staff_id'], {
      name: 'auction_documents_uploaded_by_staff_id_idx',
    });
    await queryInterface.addIndex('auction_documents', ['is_active'], { name: 'auction_documents_is_active_idx' });

    // ─────────────────────────────────────────────
    // 12. BIDS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('bids', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      auction_id: { type: CHAR(36), allowNull: false },
      auction_asset_id: { type: CHAR(36), allowNull: true },
      user_id: { type: CHAR(36), allowNull: false },
      amount: { type: DECIMAL(18, 2), allowNull: false },
      currency: { type: STRING(3), allowNull: false, defaultValue: 'ETB' },
      submitted_at: { type: DATE, allowNull: false, defaultValue: NOW },
      is_valid: { type: BOOLEAN, allowNull: false, defaultValue: true },
      status: {
        type: ENUM('submitted', 'invalid', 'winning', 'lost'),
        allowNull: false,
        defaultValue: 'submitted',
      },
      invalid_reason: { type: STRING(255), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    await queryInterface.addIndex('bids', ['auction_id'], { name: 'bids_auction_id_idx' });
    await queryInterface.addIndex('bids', ['auction_asset_id'], { name: 'bids_auction_asset_id_idx' });
    await queryInterface.addIndex('bids', ['user_id'], { name: 'bids_user_id_idx' });
    await queryInterface.addIndex('bids', ['submitted_at'], { name: 'bids_submitted_at_idx' });
    await queryInterface.addIndex('bids', ['auction_id', 'amount'], { name: 'bids_auction_id_amount_idx' });
    await queryInterface.addIndex('bids', ['is_valid'], { name: 'bids_is_valid_idx' });
    await queryInterface.addIndex('bids', ['auction_id', 'user_id', 'auction_asset_id'], {
      unique: true,
      name: 'bids_auction_user_lot_unique',
    });

    // ─────────────────────────────────────────────
    // 13. BID DRAFTS (from 003 + 008 expired status)
    // ─────────────────────────────────────────────
    await queryInterface.createTable('bid_drafts', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      user_id: { type: CHAR(36), allowNull: false },
      auction_id: { type: CHAR(36), allowNull: false },
      auction_asset_id: { type: CHAR(36), allowNull: true },
      amount: { type: DECIMAL(18, 2), allowNull: false },
      status: {
        type: ENUM('draft', 'locked', 'submitted', 'expired'),
        allowNull: false,
        defaultValue: 'draft',
      },
      cpo_id: { type: CHAR(36), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    await queryInterface.addIndex('bid_drafts', ['user_id'], { name: 'bid_drafts_user_id_idx' });
    await queryInterface.addIndex('bid_drafts', ['auction_id'], { name: 'bid_drafts_auction_id_idx' });
    await queryInterface.addIndex('bid_drafts', ['cpo_id'], { name: 'bid_drafts_cpo_id_idx' });
    await queryInterface.addIndex('bid_drafts', ['user_id', 'auction_id'], {
      name: 'bid_drafts_user_auction_idx',
    });
    await queryInterface.addIndex('bid_drafts', ['user_id', 'auction_id', 'auction_asset_id'], {
      unique: true,
      name: 'bid_drafts_user_auction_lot_unique',
    });

    // ─────────────────────────────────────────────
    // 14. CPOs (with proposed_bids from 003, deposit/refund from 006)
    // ─────────────────────────────────────────────
    await queryInterface.createTable('cpos', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      user_id: { type: CHAR(36), allowNull: false },
      auction_id: { type: CHAR(36), allowNull: false },
      document_url: { type: STRING(500), allowNull: false },
      selected_auction_asset_ids: { type: JSON, allowNull: true },
      required_cpo_amount: { type: DECIMAL(18, 2), allowNull: true },
      declared_cpo_amount: { type: DECIMAL(18, 2), allowNull: true },
      deposit_amount: { type: DECIMAL(18, 2), allowNull: true },
      proposed_bids: { type: JSON, allowNull: true },
      status: {
        type: ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      refund_status: {
        type: ENUM('none', 'pending', 'approved', 'paid'),
        allowNull: false,
        defaultValue: 'none',
      },
      refund_processed_at: { type: DATE, allowNull: true },
      refund_processed_by_staff_id: { type: CHAR(36), allowNull: true },
      reviewed_by_staff_id: { type: CHAR(36), allowNull: true },
      reviewed_at: { type: DATE, allowNull: true },
      rejection_reason: { type: TEXT, allowNull: true },
      expiry_date: { type: DATE, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('cpos', ['user_id'], { name: 'cpos_user_id_idx' });
    await queryInterface.addIndex('cpos', ['auction_id'], { name: 'cpos_auction_id_idx' });
    await queryInterface.addIndex('cpos', ['status'], { name: 'cpos_status_idx' });
    await queryInterface.addIndex('cpos', ['refund_status'], { name: 'cpos_refund_status_idx' });
    await queryInterface.addIndex('cpos', ['reviewed_by_staff_id'], { name: 'cpos_reviewed_by_staff_id_idx' });
    await queryInterface.addIndex('cpos', ['user_id', 'auction_id'], { name: 'cpos_user_id_auction_id_idx' });
    await queryInterface.addIndex('cpos', ['refund_status'], { name: 'cpos_refund_status_idx' });

    // ─────────────────────────────────────────────
    // 15. CPO PAYMENTS (from 007)
    // ─────────────────────────────────────────────
    await queryInterface.createTable('cpo_payments', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      cpo_id: { type: CHAR(36), allowNull: false },
      user_id: { type: CHAR(36), allowNull: false },
      auction_id: { type: CHAR(36), allowNull: false },
      amount: { type: DECIMAL(18, 2), allowNull: false },
      currency: { type: STRING(3), allowNull: false, defaultValue: 'ETB' },
      payment_method: {
        type: ENUM('addis_pay', 'manual'),
        allowNull: false,
      },
      receipt_url: { type: STRING(500), allowNull: true },
      transaction_reference: { type: STRING(255), allowNull: true },
      status: {
        type: ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      verified_by_staff_id: { type: CHAR(36), allowNull: true },
      verified_at: { type: DATE, allowNull: true },
      rejection_reason: { type: TEXT, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('cpo_payments', ['cpo_id'], { name: 'cpo_payments_cpo_id_idx' });
    await queryInterface.addIndex('cpo_payments', ['status'], { name: 'cpo_payments_status_idx' });
    await queryInterface.addIndex('cpo_payments', ['user_id'], { name: 'cpo_payments_user_id_idx' });
    await queryInterface.addIndex('cpo_payments', ['auction_id'], { name: 'cpo_payments_auction_id_idx' });

    // ─────────────────────────────────────────────
    // 16. PAYMENTS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('payments', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      user_id: { type: CHAR(36), allowNull: false },
      auction_id: { type: CHAR(36), allowNull: false },
      amount: { type: DECIMAL(18, 2), allowNull: false },
      currency: { type: STRING(3), allowNull: false, defaultValue: 'ETB' },
      payment_method: { type: ENUM('addis_pay', 'manual'), allowNull: false },
      status: {
        type: ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      transaction_reference: { type: STRING(255), allowNull: true, unique: true },
      receipt_url: { type: STRING(500), allowNull: true },
      verified_by_staff_id: { type: CHAR(36), allowNull: true },
      verified_at: { type: DATE, allowNull: true },
      rejection_reason: { type: TEXT, allowNull: true },
      paid_at: { type: DATE, allowNull: true },
      gateway_response: { type: JSON, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('payments', ['user_id'], { name: 'payments_user_id_idx' });
    await queryInterface.addIndex('payments', ['auction_id'], { name: 'payments_auction_id_idx' });
    await queryInterface.addIndex('payments', ['status'], { name: 'payments_status_idx' });
    await queryInterface.addIndex('payments', ['payment_method'], { name: 'payments_payment_method_idx' });
    await queryInterface.addIndex('payments', ['verified_by_staff_id'], { name: 'payments_verified_by_staff_id_idx' });
    await queryInterface.addIndex('payments', ['user_id', 'auction_id'], { name: 'payments_user_id_auction_id_idx' });

    // ─────────────────────────────────────────────
    // 17. WINNERS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('winners', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      auction_id: { type: CHAR(36), allowNull: false },
      bid_id: { type: CHAR(36), allowNull: false, unique: true },
      auction_asset_id: { type: CHAR(36), allowNull: true },
      user_id: { type: CHAR(36), allowNull: false },
      selected_by_staff_id: { type: CHAR(36), allowNull: false },
      selected_at: { type: DATE, allowNull: false, defaultValue: NOW },
      status: {
        type: ENUM('pending_confirmation', 'confirmed', 'declined', 'replaced'),
        allowNull: false,
        defaultValue: 'pending_confirmation',
      },
      selection_method: {
        type: ENUM('auto', 'manual'),
        allowNull: false,
        defaultValue: 'manual',
      },
      decline_reason: { type: TEXT, allowNull: true },
      declined_at: { type: DATE, allowNull: true },
      notification_sent_at: { type: DATE, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
      deleted_at: { type: DATE, allowNull: true },
    });

    await queryInterface.addIndex('winners', ['auction_id'], { name: 'winners_auction_id_idx' });
    await queryInterface.addIndex('winners', ['auction_asset_id'], { name: 'winners_auction_asset_id_idx' });
    await queryInterface.addIndex('winners', ['user_id'], { name: 'winners_user_id_idx' });
    await queryInterface.addIndex('winners', ['selected_by_staff_id'], { name: 'winners_selected_by_staff_id_idx' });
    await queryInterface.addIndex('winners', ['status'], { name: 'winners_status_idx' });
    await queryInterface.addIndex('winners', ['auction_id', 'auction_asset_id'], {
      unique: true,
      name: 'winners_auction_lot_unique',
    });

    // ─────────────────────────────────────────────
    // 18. ORGANIZATION AUCTIONS (from 009)
    // ─────────────────────────────────────────────
    await queryInterface.createTable('organization_auctions', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      organization_user_id: { type: CHAR(36), allowNull: false },
      auction_id: { type: CHAR(36), allowNull: false },
      linked_by_staff_id: { type: CHAR(36), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('organization_auctions', ['organization_user_id'], {
      name: 'org_auctions_org_user_id_idx',
    });
    await queryInterface.addIndex('organization_auctions', ['auction_id'], {
      name: 'org_auctions_auction_id_idx',
    });
    await queryInterface.addConstraint('organization_auctions', {
      fields: ['organization_user_id', 'auction_id'],
      type: 'unique',
      name: 'uq_org_user_auction',
    });

    // ─────────────────────────────────────────────
    // 19. AUCTION SHARE LINKS (from 010)
    // ─────────────────────────────────────────────
    await queryInterface.createTable('auction_share_links', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      auction_id: { type: CHAR(36), allowNull: false },
      organization_name: { type: STRING(255), allowNull: false },
      contact_email: { type: STRING(255), allowNull: true },
      token: { type: STRING(64), allowNull: false, unique: true },
      password_hash: { type: STRING(255), allowNull: true },
      expires_at: { type: DATE, allowNull: true },
      max_views: { type: INTEGER.UNSIGNED, allowNull: true },
      view_count: { type: INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      is_active: { type: BOOLEAN, allowNull: false, defaultValue: true },
      last_accessed_at: { type: DATE, allowNull: true },
      created_by_staff_id: { type: CHAR(36), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('auction_share_links', ['auction_id'], {
      name: 'asl_auction_id_idx',
    });
    await queryInterface.addIndex('auction_share_links', ['token'], {
      name: 'asl_token_idx',
    });

    // ─────────────────────────────────────────────
    // 20. NOTIFICATIONS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('notifications', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      user_id: { type: CHAR(36), allowNull: false },
      type: {
        type: ENUM(
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
        ),
        allowNull: false,
      },
      title: { type: STRING(255), allowNull: false },
      message: { type: TEXT, allowNull: false },
      channel: {
        type: ENUM('sms', 'email', 'in_app'),
        allowNull: false,
        defaultValue: 'in_app',
      },
      status: {
        type: ENUM('pending', 'sent', 'failed', 'read'),
        allowNull: false,
        defaultValue: 'pending',
      },
      metadata: { type: JSON, allowNull: true },
      sent_at: { type: DATE, allowNull: true },
      read_at: { type: DATE, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    await queryInterface.addIndex('notifications', ['user_id'], { name: 'notifications_user_id_idx' });
    await queryInterface.addIndex('notifications', ['type'], { name: 'notifications_type_idx' });
    await queryInterface.addIndex('notifications', ['status'], { name: 'notifications_status_idx' });
    await queryInterface.addIndex('notifications', ['channel'], { name: 'notifications_channel_idx' });
    await queryInterface.addIndex('notifications', ['user_id', 'status'], {
      name: 'notifications_user_id_status_idx',
    });
    await queryInterface.addIndex('notifications', ['created_at'], { name: 'notifications_created_at_idx' });

    // ─────────────────────────────────────────────
    // 21. AUDIT LOGS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('audit_logs', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      user_id: { type: CHAR(36), allowNull: true },
      staff_id: { type: CHAR(36), allowNull: true },
      action: { type: STRING(100), allowNull: false },
      entity_type: { type: STRING(100), allowNull: true },
      entity_id: { type: CHAR(36), allowNull: true },
      ip_address: { type: STRING(45), allowNull: true },
      user_agent: { type: STRING(500), allowNull: true },
      old_values: { type: JSON, allowNull: true },
      new_values: { type: JSON, allowNull: true },
      metadata: { type: JSON, allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    await queryInterface.addIndex('audit_logs', ['user_id'], { name: 'audit_logs_user_id_idx' });
    await queryInterface.addIndex('audit_logs', ['staff_id'], { name: 'audit_logs_staff_id_idx' });
    await queryInterface.addIndex('audit_logs', ['action'], { name: 'audit_logs_action_idx' });
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], {
      name: 'audit_logs_entity_type_entity_id_idx',
    });
    await queryInterface.addIndex('audit_logs', ['created_at'], { name: 'audit_logs_created_at_idx' });

    // ─────────────────────────────────────────────
    // 22. REFRESH TOKENS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('refresh_tokens', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      user_id: { type: CHAR(36), allowNull: false },
      family_id: { type: CHAR(36), allowNull: false },
      token_hash: { type: STRING(64), allowNull: false, unique: true },
      expires_at: { type: DATE, allowNull: false },
      revoked_at: { type: DATE, allowNull: true },
      replaced_by: { type: CHAR(36), allowNull: true },
      ip_address: { type: STRING(45), allowNull: true },
      user_agent: { type: STRING(512), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    await queryInterface.addIndex('refresh_tokens', ['family_id'], { name: 'refresh_tokens_family_id_idx' });
    await queryInterface.addIndex('refresh_tokens', ['user_id'], { name: 'refresh_tokens_user_id_idx' });
    await queryInterface.addIndex('refresh_tokens', ['expires_at'], { name: 'refresh_tokens_expires_at_idx' });

    // ─────────────────────────────────────────────
    // 23. SYSTEM SETTINGS
    // ─────────────────────────────────────────────
    await queryInterface.createTable('system_settings', {
      id: { type: CHAR(36), allowNull: false, primaryKey: true },
      setting_key: { type: STRING(100), allowNull: false, unique: true },
      setting_value: { type: JSON, allowNull: false },
      description: { type: STRING(255), allowNull: true },
      updated_by_staff_id: { type: CHAR(36), allowNull: true },
      created_at: { type: DATE, allowNull: false, defaultValue: NOW },
      updated_at: { type: DATE, allowNull: false, defaultValue: NOW },
    });

    // ─────────────────────────────────────────────
    // FOREIGN KEY CONSTRAINTS
    // ─────────────────────────────────────────────
    await queryInterface.sequelize.query(`
      ALTER TABLE users
        ADD CONSTRAINT users_role_id_fk
          FOREIGN KEY (role_id) REFERENCES roles (id)
          ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE asset_owners
        ADD CONSTRAINT asset_owners_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE staff
        ADD CONSTRAINT staff_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT staff_role_id_fk
          FOREIGN KEY (role_id) REFERENCES roles (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT fk_staff_created_by_staff_id
          FOREIGN KEY (created_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE kyc_verifications
        ADD CONSTRAINT kyc_verifications_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT fk_kyc_verifications_reviewed_by_staff_id
          FOREIGN KEY (reviewed_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE assets
        ADD CONSTRAINT assets_asset_owner_id_fk
          FOREIGN KEY (asset_owner_id) REFERENCES asset_owners (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT fk_assets_reviewed_by_staff_id
          FOREIGN KEY (reviewed_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE evaluations
        ADD CONSTRAINT evaluations_asset_id_fk
          FOREIGN KEY (asset_id) REFERENCES assets (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT fk_evaluations_evaluated_by_staff_id
          FOREIGN KEY (evaluated_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE lots
        ADD CONSTRAINT lots_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE auction_assets
        ADD CONSTRAINT auction_assets_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT auction_assets_asset_id_fk
          FOREIGN KEY (asset_id) REFERENCES assets (id)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        ADD CONSTRAINT fk_auction_assets_lot_id
          FOREIGN KEY (lot_id) REFERENCES lots (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE auctions
        ADD CONSTRAINT auctions_asset_id_fk
          FOREIGN KEY (asset_id) REFERENCES assets (id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT fk_auctions_created_by_staff_id
          FOREIGN KEY (created_by_staff_id) REFERENCES staff (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT auctions_owner_id_fk
          FOREIGN KEY (owner_id) REFERENCES users (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE auction_documents
        ADD CONSTRAINT auction_documents_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT fk_auction_documents_uploaded_by_staff_id
          FOREIGN KEY (uploaded_by_staff_id) REFERENCES staff (id)
          ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE bids
        ADD CONSTRAINT bids_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT bids_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT bids_auction_asset_id_fk
          FOREIGN KEY (auction_asset_id) REFERENCES auction_assets (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE bid_drafts
        ADD CONSTRAINT bid_drafts_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT bid_drafts_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT bid_drafts_auction_asset_id_fk
          FOREIGN KEY (auction_asset_id) REFERENCES auction_assets (id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT bid_drafts_cpo_id_fk
          FOREIGN KEY (cpo_id) REFERENCES cpos (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE cpos
        ADD CONSTRAINT cpos_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT cpos_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT fk_cpos_reviewed_by_staff_id
          FOREIGN KEY (reviewed_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT cpos_refund_processed_by_staff_id_fk
          FOREIGN KEY (refund_processed_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE cpo_payments
        ADD CONSTRAINT cpo_payments_cpo_id_fk
          FOREIGN KEY (cpo_id) REFERENCES cpos (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT cpo_payments_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT cpo_payments_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT cpo_payments_verified_by_staff_id_fk
          FOREIGN KEY (verified_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE payments
        ADD CONSTRAINT payments_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT payments_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT fk_payments_verified_by_staff_id
          FOREIGN KEY (verified_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE cpo_payments
        ADD CONSTRAINT cpo_payments_cpo_id_fk
          FOREIGN KEY (cpo_id) REFERENCES cpos (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT cpo_payments_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT cpo_payments_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT cpo_payments_verified_by_staff_id_fk
          FOREIGN KEY (verified_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE winners
        ADD CONSTRAINT winners_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT winners_bid_id_fk
          FOREIGN KEY (bid_id) REFERENCES bids (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT winners_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT fk_winners_selected_by_staff_id
          FOREIGN KEY (selected_by_staff_id) REFERENCES staff (id)
          ON UPDATE CASCADE,
        ADD CONSTRAINT winners_auction_asset_id_fk
          FOREIGN KEY (auction_asset_id) REFERENCES auction_assets (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE organization_auctions
        ADD CONSTRAINT org_auctions_org_user_id_fk
          FOREIGN KEY (organization_user_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT org_auctions_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT org_auctions_linked_by_staff_id_fk
          FOREIGN KEY (linked_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE auction_share_links
        ADD CONSTRAINT asl_auction_id_fk
          FOREIGN KEY (auction_id) REFERENCES auctions (id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT asl_created_by_staff_id_fk
          FOREIGN KEY (created_by_staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE notifications
        ADD CONSTRAINT notifications_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE audit_logs
        ADD CONSTRAINT audit_logs_user_id_fk
          FOREIGN KEY (user_id) REFERENCES users (id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT audit_logs_staff_id_fk
          FOREIGN KEY (staff_id) REFERENCES staff (id)
          ON DELETE SET NULL ON UPDATE CASCADE
    `);

    // ─────────────────────────────────────────────
    // SEED DATA
    // ─────────────────────────────────────────────
    const now = new Date();

    await queryInterface.bulkInsert(
      'roles',
      ROLE_SEEDS.map((role) => ({
        id: role.id,
        name: role.name,
        code: role.code,
        description: JSON.stringify(role.description),
        is_active: role.is_active,
        created_at: now,
        updated_at: now,
      })),
    );

    await queryInterface.bulkInsert('users', [
      {
        id: SUPER_ADMIN_USER_ID,
        role_id: ROLE_IDS.super_admin,
        user_type: 'individual',
        mobile_number: '+251900000000',
        email: 'admin@enderass.com',
        password: SUPER_ADMIN_PASSWORD_HASH,
        national_id_number: null,
        tin_number: null,
        first_name: 'System',
        last_name: 'Administrator',
        organization_name: null,
        preferred_language: 'en',
        is_mobile_verified: 1,
        is_email_verified: 1,
        status: 'active',
        last_login_at: null,
        failed_login_attempts: 0,
        display_password: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);

    await queryInterface.bulkInsert('staff', [
      {
        id: SUPER_ADMIN_STAFF_ID,
        user_id: SUPER_ADMIN_USER_ID,
        role_id: ROLE_IDS.super_admin,
        employee_id: null,
        department: 'Administration',
        is_active: 1,
        activated_at: now,
        deactivated_at: null,
        created_by_staff_id: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);

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
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    const tables = [
      'auction_share_links',
      'organization_auctions',
      'cpo_payments',
      'bid_drafts',
      'lots',
      'system_settings',
      'refresh_tokens',
      'audit_logs',
      'notifications',
      'winners',
      'cpo_payments',
      'payments',
      'cpos',
      'bid_drafts',
      'bids',
      'auction_documents',
      'auction_assets',
      'lots',
      'auctions',
      'evaluations',
      'assets',
      'kyc_verifications',
      'staff',
      'asset_owners',
      'users',
      'roles',
    ];

    for (const table of tables) {
      await queryInterface.dropTable(table).catch(() => {});
    }

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  },
};
