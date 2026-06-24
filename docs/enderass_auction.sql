-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 18, 2026 at 11:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `enderass_auction`
--

-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `asset_owner_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `asset_type` enum('vehicle','land','building','machinery','other') NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `ownership_document_type` enum('vehicle_registration_book','title_deed','ownership_certificate','purchase_documents','other') DEFAULT NULL,
  `ownership_document_url` varchar(500) DEFAULT NULL,
  `additional_document_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additional_document_urls`)),
  `status` enum('pending_review','approved','rejected','under_evaluation','evaluated','in_auction','sold') NOT NULL DEFAULT 'pending_review',
  `reviewed_by_staff_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `asset_owners`
--

CREATE TABLE `asset_owners` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `country` varchar(100) NOT NULL DEFAULT 'Ethiopia',
  `postal_code` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auctions`
--

CREATE TABLE `auctions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `asset_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_by_staff_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `reserve_price` decimal(18,2) NOT NULL,
  `document_price` decimal(18,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) NOT NULL DEFAULT 'ETB',
  `status` enum('draft','pending_approval','published','suspended','closed','cancelled') NOT NULL DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auction_documents`
--

CREATE TABLE `auction_documents` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `auction_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `uploaded_by_staff_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `file_url` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_size` int(10) UNSIGNED DEFAULT NULL,
  `mime_type` varchar(100) NOT NULL DEFAULT 'application/pdf',
  `download_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `staff_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `staff_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `old_values`, `new_values`, `metadata`, `created_at`) VALUES
('0d26156b-f727-4aba-af0a-0cd92198f3aa', NULL, NULL, 'JOB_NOTIFICATION_COMPLETED', 'Job', NULL, NULL, NULL, NULL, NULL, '{\"usersScanned\":1,\"sent\":0,\"failed\":0}', '2026-06-17 14:30:00'),
('345c334e-c19b-477f-a127-28a02ded9b4e', NULL, NULL, 'JOB_AUCTION_CLOSER_COMPLETED', 'Job', NULL, NULL, NULL, NULL, NULL, '{\"scanned\":0,\"closed\":0,\"winnersSelected\":0,\"failures\":0}', '2026-06-17 14:30:00'),
('a3c5e465-64b0-4144-a4f6-90c9eb861dd3', NULL, NULL, 'JOB_NOTIFICATION_COMPLETED', 'Job', NULL, NULL, NULL, NULL, NULL, '{\"usersScanned\":1,\"sent\":0,\"failed\":0}', '2026-06-17 14:28:00'),
('ce56366d-e22b-47aa-a38f-04614f4a5f60', NULL, NULL, 'JOB_PAYMENT_SYNC_COMPLETED', 'Job', NULL, NULL, NULL, NULL, NULL, '{\"scanned\":0,\"synchronized\":0,\"failed\":0}', '2026-06-17 14:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `bids`
--

CREATE TABLE `bids` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `auction_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'ETB',
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_valid` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('submitted','invalid','winning','lost') NOT NULL DEFAULT 'submitted',
  `invalid_reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cpos`
--

CREATE TABLE `cpos` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `auction_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `document_url` varchar(500) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by_staff_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `evaluations`
--

CREATE TABLE `evaluations` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `asset_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `evaluated_by_staff_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `valuation_amount` decimal(18,2) DEFAULT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'ETB',
  `reserve_price_recommendation` decimal(18,2) DEFAULT NULL,
  `photo_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photo_urls`)),
  `report_url` varchar(500) DEFAULT NULL,
  `recommendation` enum('approved','rejected') DEFAULT NULL,
  `status` enum('scheduled','in_progress','completed','approved','rejected') NOT NULL DEFAULT 'scheduled',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kyc_verifications`
--

CREATE TABLE `kyc_verifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `document_type` enum('national_id','passport','driving_license','trade_license','tin_certificate','business_registration','other') NOT NULL,
  `document_number` varchar(100) DEFAULT NULL,
  `document_front_url` varchar(500) DEFAULT NULL,
  `document_back_url` varchar(500) DEFAULT NULL,
  `trade_license_url` varchar(500) DEFAULT NULL,
  `tin_certificate_url` varchar(500) DEFAULT NULL,
  `business_registration_url` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by_staff_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `review_notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type` enum('registration','kyc_approved','kyc_rejected','asset_approved','asset_rejected','payment_approved','payment_rejected','cpo_approved','cpo_rejected','auction_published','winner_announcement','general') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `channel` enum('sms','email','in_app') NOT NULL DEFAULT 'in_app',
  `status` enum('pending','sent','failed','read') NOT NULL DEFAULT 'pending',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `sent_at` datetime DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `auction_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'ETB',
  `payment_method` enum('addis_pay','manual') NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `transaction_reference` varchar(255) DEFAULT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `verified_by_staff_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `gateway_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gateway_response`)),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `code`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('3f64293e-93eb-4bc0-8839-5dadbfb12a5a', 'Bidder', 'bidder', '{\"summary\":\"Participates in auctions, submits KYC, and requests auctions by submitting owned assets.\",\"permissions\":{\"modules\":[\"bids\",\"payments\",\"cpo\",\"notifications\",\"kyc\",\"assets\"],\"actions\":[\"create\",\"read\",\"update\"],\"routes\":[\"POST /api/v1/bids\",\"GET /api/v1/bids/my\",\"POST /api/v1/payments\",\"GET /api/v1/payments\",\"POST /api/v1/cpo\",\"GET /api/v1/notifications\",\"POST /api/v1/kyc\",\"GET /api/v1/kyc/my\",\"POST /api/v1/kyc/resubmit\",\"POST /api/v1/assets\",\"GET /api/v1/assets/my\",\"GET /api/v1/assets/:id\",\"PUT /api/v1/assets/:id\"]},\"permissionVersion\":3}', 1, '2026-06-17 14:27:23', '2026-06-17 07:27:24'),
('5137cd9c-7fb4-456f-9665-f82727ddc065', 'Asset Owner', 'asset_owner', '{\"summary\":\"Registers and manages owned assets for auction.\",\"permissions\":{\"modules\":[\"assets\",\"payments\"],\"actions\":[\"create\",\"read\",\"update\"],\"routes\":[\"POST /api/v1/assets\",\"GET /api/v1/assets\",\"PUT /api/v1/assets/:id\",\"DELETE /api/v1/assets/:id\",\"POST /api/v1/payments\",\"GET /api/v1/payments\"]},\"permissionVersion\":1}', 1, '2026-06-17 14:27:23', '2026-06-17 07:27:24'),
('5a214d89-26a2-470b-a22c-2a4820dff6e8', 'Super Administrator', 'super_admin', '{\"summary\":\"Full system access including staff management and all modules.\",\"permissions\":{\"modules\":[\"*\"],\"actions\":[\"create\",\"read\",\"update\",\"delete\",\"approve\",\"reject\",\"publish\",\"close\",\"export\"],\"routes\":[\"*\"]},\"permissionVersion\":1}', 1, '2026-06-17 14:27:23', '2026-06-17 07:27:24'),
('b5ba62e8-b8eb-4ffb-83f5-f02c398fd22c', 'Evaluation Officer', 'evaluation_officer', '{\"summary\":\"Creates and manages asset evaluations.\",\"permissions\":{\"modules\":[\"evaluations\",\"assets\",\"dashboard\"],\"actions\":[\"create\",\"read\",\"update\",\"delete\",\"approve\",\"reject\",\"publish\",\"close\"],\"routes\":[\"POST /api/v1/evaluations\",\"GET /api/v1/evaluations\",\"PUT /api/v1/evaluations/:id\",\"POST /api/v1/evaluations/:id/approve\",\"POST /api/v1/evaluations/:id/reject\",\"GET /api/v1/assets\",\"GET /api/v1/dashboard\"]},\"permissionVersion\":1}', 1, '2026-06-17 14:27:23', '2026-06-17 07:27:24'),
('bebdb975-949e-4193-beac-db07b7589967', 'Finance Officer', 'finance_officer', '{\"summary\":\"Verifies and manages payments and financial records.\",\"permissions\":{\"modules\":[\"payments\",\"dashboard\"],\"actions\":[\"read\",\"approve\",\"reject\",\"export\"],\"routes\":[\"GET /api/v1/payments\",\"POST /api/v1/payments/:id/approve\",\"POST /api/v1/payments/:id/reject\",\"GET /api/v1/dashboard\",\"GET /api/v1/dashboard/reports\",\"GET /api/v1/dashboard/reports/export\"]},\"permissionVersion\":1}', 1, '2026-06-17 14:27:23', '2026-06-17 07:27:24'),
('c29ccb62-0d88-4746-8051-80cd2fce91d9', 'Auction Manager', 'auction_manager', '{\"summary\":\"Manages auctions, asset reviews, documents, winners, and auction-related workflows.\",\"permissions\":{\"modules\":[\"auctions\",\"assets\",\"documents\",\"bids\",\"winners\",\"cpo\",\"dashboard\"],\"actions\":[\"create\",\"read\",\"update\",\"delete\",\"approve\",\"reject\",\"publish\",\"close\"],\"routes\":[\"GET /api/v1/auctions\",\"POST /api/v1/auctions\",\"PUT /api/v1/auctions/:id\",\"POST /api/v1/auctions/:id/publish\",\"POST /api/v1/auctions/:id/close\",\"GET /api/v1/assets\",\"POST /api/v1/assets/:id/approve\",\"POST /api/v1/assets/:id/reject\",\"GET /api/v1/documents\",\"POST /api/v1/documents\",\"GET /api/v1/bids/auction/:auctionId\",\"POST /api/v1/winners\",\"GET /api/v1/cpo\",\"POST /api/v1/cpo/:id/approve\",\"POST /api/v1/cpo/:id/reject\",\"GET /api/v1/dashboard\"]},\"permissionVersion\":1}', 1, '2026-06-17 14:27:23', '2026-06-17 07:27:24'),
('fbfe54b5-cb71-4c46-9543-61b5e87521ab', 'Customer Service Officer', 'customer_service_officer', '{\"summary\":\"Handles user support, KYC review, and customer-facing operations.\",\"permissions\":{\"modules\":[\"users\",\"kyc\",\"assets\",\"cpo\",\"dashboard\"],\"actions\":[\"read\",\"approve\",\"reject\",\"update\"],\"routes\":[\"GET /api/v1/users\",\"GET /api/v1/users/:id\",\"PUT /api/v1/users/:id\",\"GET /api/v1/kyc\",\"POST /api/v1/kyc/:id/approve\",\"POST /api/v1/kyc/:id/reject\",\"GET /api/v1/assets\",\"POST /api/v1/assets/:id/approve\",\"POST /api/v1/assets/:id/reject\",\"GET /api/v1/cpo\",\"POST /api/v1/cpo/:id/approve\",\"POST /api/v1/cpo/:id/reject\",\"GET /api/v1/dashboard\"]},\"permissionVersion\":1}', 1, '2026-06-17 14:27:23', '2026-06-17 07:27:24');

-- --------------------------------------------------------

--
-- Table structure for table `sequelize_migrations`
--

CREATE TABLE `sequelize_migrations` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `sequelize_migrations`
--

INSERT INTO `sequelize_migrations` (`name`) VALUES
('001_create_roles.js'),
('002_create_users.js'),
('003_create_kyc.js'),
('004_create_asset_owners.js'),
('005_create_assets.js'),
('006_create_evaluations.js'),
('007_create_auctions.js'),
('008_create_auction_documents.js'),
('009_create_payments.js'),
('010_create_cpos.js'),
('011_create_bids.js'),
('012_create_winners.js'),
('013_create_notifications.js'),
('014_create_staff.js'),
('015_create_audit_logs.js');

-- --------------------------------------------------------

--
-- Table structure for table `sequelize_seeders`
--

CREATE TABLE `sequelize_seeders` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `sequelize_seeders`
--

INSERT INTO `sequelize_seeders` (`name`) VALUES
('001_roles.seed.js'),
('002_super_admin.seed.js'),
('003_staff_permissions.seed.js');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `activated_at` datetime DEFAULT NULL,
  `deactivated_at` datetime DEFAULT NULL,
  `created_by_staff_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `user_id`, `role_id`, `employee_id`, `department`, `is_active`, `activated_at`, `deactivated_at`, `created_by_staff_id`, `created_at`, `updated_at`, `deleted_at`) VALUES
('29dd14ea-127d-4345-bf02-4ccd0e1ecb36', 'f6e697d1-dbe9-472e-abbb-648f410127cc', '5a214d89-26a2-470b-a22c-2a4820dff6e8', NULL, 'Administration', 1, '2026-06-17 14:27:23', NULL, NULL, '2026-06-17 14:27:23', '2026-06-17 14:27:23', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `role_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_type` enum('individual','organization') NOT NULL DEFAULT 'individual',
  `mobile_number` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `national_id_number` varchar(50) DEFAULT NULL,
  `tin_number` varchar(50) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `organization_name` varchar(255) DEFAULT NULL,
  `preferred_language` enum('en','am') NOT NULL DEFAULT 'en',
  `is_mobile_verified` tinyint(1) NOT NULL DEFAULT 0,
  `is_email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('pending','active','suspended','deactivated') NOT NULL DEFAULT 'pending',
  `last_login_at` datetime DEFAULT NULL,
  `failed_login_attempts` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `user_type`, `mobile_number`, `email`, `password`, `national_id_number`, `tin_number`, `first_name`, `last_name`, `organization_name`, `preferred_language`, `is_mobile_verified`, `is_email_verified`, `status`, `last_login_at`, `failed_login_attempts`, `created_at`, `updated_at`, `deleted_at`) VALUES
('f6e697d1-dbe9-472e-abbb-648f410127cc', '5a214d89-26a2-470b-a22c-2a4820dff6e8', 'individual', '+251900000000', 'admin@enderass.com', '$2b$12$KqPopy9eLE1v4IycnsYdm.Z45lFLY9wGQWOXY6xmjl89m7zgBVBKa', NULL, NULL, 'System', 'Administrator', NULL, 'en', 1, 1, 'active', NULL, 0, '2026-06-17 14:27:23', '2026-06-17 14:27:23', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `winners`
--

CREATE TABLE `winners` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `auction_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `bid_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `selected_by_staff_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `selected_at` datetime NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending_confirmation','confirmed','declined','replaced') NOT NULL DEFAULT 'pending_confirmation',
  `decline_reason` text DEFAULT NULL,
  `notification_sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `assets_asset_owner_id_idx` (`asset_owner_id`),
  ADD KEY `assets_status_idx` (`status`),
  ADD KEY `assets_asset_type_idx` (`asset_type`),
  ADD KEY `assets_reviewed_by_staff_id_idx` (`reviewed_by_staff_id`);

--
-- Indexes for table `asset_owners`
--
ALTER TABLE `asset_owners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `asset_owners_user_id_unique` (`user_id`),
  ADD KEY `asset_owners_status_idx` (`status`);

--
-- Indexes for table `auctions`
--
ALTER TABLE `auctions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `asset_id` (`asset_id`),
  ADD UNIQUE KEY `auctions_asset_id_unique` (`asset_id`),
  ADD KEY `auctions_created_by_staff_id_idx` (`created_by_staff_id`),
  ADD KEY `auctions_status_idx` (`status`),
  ADD KEY `auctions_start_date_idx` (`start_date`),
  ADD KEY `auctions_end_date_idx` (`end_date`),
  ADD KEY `auctions_status_end_date_idx` (`status`,`end_date`);

--
-- Indexes for table `auction_documents`
--
ALTER TABLE `auction_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `auction_documents_auction_id_idx` (`auction_id`),
  ADD KEY `auction_documents_uploaded_by_staff_id_idx` (`uploaded_by_staff_id`),
  ADD KEY `auction_documents_is_active_idx` (`is_active`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_user_id_idx` (`user_id`),
  ADD KEY `audit_logs_staff_id_idx` (`staff_id`),
  ADD KEY `audit_logs_action_idx` (`action`),
  ADD KEY `audit_logs_entity_type_entity_id_idx` (`entity_type`,`entity_id`),
  ADD KEY `audit_logs_created_at_idx` (`created_at`);

--
-- Indexes for table `bids`
--
ALTER TABLE `bids`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_bidder_per_auction` (`auction_id`,`user_id`),
  ADD KEY `bids_auction_id_idx` (`auction_id`),
  ADD KEY `bids_user_id_idx` (`user_id`),
  ADD KEY `bids_submitted_at_idx` (`submitted_at`),
  ADD KEY `bids_auction_id_amount_idx` (`auction_id`,`amount`),
  ADD KEY `bids_is_valid_idx` (`is_valid`);

--
-- Indexes for table `cpos`
--
ALTER TABLE `cpos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cpos_user_id_idx` (`user_id`),
  ADD KEY `cpos_auction_id_idx` (`auction_id`),
  ADD KEY `cpos_status_idx` (`status`),
  ADD KEY `cpos_reviewed_by_staff_id_idx` (`reviewed_by_staff_id`),
  ADD KEY `cpos_user_id_auction_id_idx` (`user_id`,`auction_id`);

--
-- Indexes for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `asset_id` (`asset_id`),
  ADD UNIQUE KEY `evaluations_asset_id_unique` (`asset_id`),
  ADD KEY `evaluations_evaluated_by_staff_id_idx` (`evaluated_by_staff_id`),
  ADD KEY `evaluations_status_idx` (`status`);

--
-- Indexes for table `kyc_verifications`
--
ALTER TABLE `kyc_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kyc_verifications_user_id_idx` (`user_id`),
  ADD KEY `kyc_verifications_status_idx` (`status`),
  ADD KEY `kyc_verifications_reviewed_by_staff_id_idx` (`reviewed_by_staff_id`),
  ADD KEY `kyc_verifications_user_id_status_idx` (`user_id`,`status`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_idx` (`user_id`),
  ADD KEY `notifications_type_idx` (`type`),
  ADD KEY `notifications_status_idx` (`status`),
  ADD KEY `notifications_channel_idx` (`channel`),
  ADD KEY `notifications_user_id_status_idx` (`user_id`,`status`),
  ADD KEY `notifications_created_at_idx` (`created_at`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_reference` (`transaction_reference`),
  ADD UNIQUE KEY `payments_transaction_reference_unique` (`transaction_reference`),
  ADD KEY `payments_user_id_idx` (`user_id`),
  ADD KEY `payments_auction_id_idx` (`auction_id`),
  ADD KEY `payments_status_idx` (`status`),
  ADD KEY `payments_payment_method_idx` (`payment_method`),
  ADD KEY `payments_verified_by_staff_id_idx` (`verified_by_staff_id`),
  ADD KEY `payments_user_id_auction_id_idx` (`user_id`,`auction_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `roles_code_unique` (`code`),
  ADD UNIQUE KEY `roles_name_unique` (`name`),
  ADD KEY `roles_is_active_idx` (`is_active`);

--
-- Indexes for table `sequelize_migrations`
--
ALTER TABLE `sequelize_migrations`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `sequelize_seeders`
--
ALTER TABLE `sequelize_seeders`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `staff_user_id_unique` (`user_id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD UNIQUE KEY `staff_employee_id_unique` (`employee_id`),
  ADD KEY `staff_role_id_idx` (`role_id`),
  ADD KEY `staff_is_active_idx` (`is_active`),
  ADD KEY `staff_created_by_staff_id_idx` (`created_by_staff_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mobile_number` (`mobile_number`),
  ADD UNIQUE KEY `users_mobile_number_unique` (`mobile_number`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `national_id_number` (`national_id_number`),
  ADD UNIQUE KEY `tin_number` (`tin_number`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_national_id_number_unique` (`national_id_number`),
  ADD UNIQUE KEY `users_tin_number_unique` (`tin_number`),
  ADD KEY `users_role_id_idx` (`role_id`),
  ADD KEY `users_status_idx` (`status`),
  ADD KEY `users_user_type_idx` (`user_type`);

--
-- Indexes for table `winners`
--
ALTER TABLE `winners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auction_id` (`auction_id`),
  ADD UNIQUE KEY `bid_id` (`bid_id`),
  ADD UNIQUE KEY `winners_auction_id_unique` (`auction_id`),
  ADD UNIQUE KEY `winners_bid_id_unique` (`bid_id`),
  ADD KEY `winners_user_id_idx` (`user_id`),
  ADD KEY `winners_selected_by_staff_id_idx` (`selected_by_staff_id`),
  ADD KEY `winners_status_idx` (`status`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assets`
--
ALTER TABLE `assets`
  ADD CONSTRAINT `assets_ibfk_1` FOREIGN KEY (`asset_owner_id`) REFERENCES `asset_owners` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_assets_reviewed_by_staff_id` FOREIGN KEY (`reviewed_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `asset_owners`
--
ALTER TABLE `asset_owners`
  ADD CONSTRAINT `asset_owners_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `auctions`
--
ALTER TABLE `auctions`
  ADD CONSTRAINT `auctions_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_auctions_created_by_staff_id` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `auction_documents`
--
ALTER TABLE `auction_documents`
  ADD CONSTRAINT `auction_documents_ibfk_1` FOREIGN KEY (`auction_id`) REFERENCES `auctions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_auction_documents_uploaded_by_staff_id` FOREIGN KEY (`uploaded_by_staff_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `bids`
--
ALTER TABLE `bids`
  ADD CONSTRAINT `bids_ibfk_1` FOREIGN KEY (`auction_id`) REFERENCES `auctions` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `bids_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `cpos`
--
ALTER TABLE `cpos`
  ADD CONSTRAINT `cpos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `cpos_ibfk_2` FOREIGN KEY (`auction_id`) REFERENCES `auctions` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cpos_reviewed_by_staff_id` FOREIGN KEY (`reviewed_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `evaluations`
--
ALTER TABLE `evaluations`
  ADD CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_evaluations_evaluated_by_staff_id` FOREIGN KEY (`evaluated_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `kyc_verifications`
--
ALTER TABLE `kyc_verifications`
  ADD CONSTRAINT `fk_kyc_verifications_reviewed_by_staff_id` FOREIGN KEY (`reviewed_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `kyc_verifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_verified_by_staff_id` FOREIGN KEY (`verified_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`auction_id`) REFERENCES `auctions` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `fk_staff_created_by_staff_id` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `staff_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `winners`
--
ALTER TABLE `winners`
  ADD CONSTRAINT `fk_winners_selected_by_staff_id` FOREIGN KEY (`selected_by_staff_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `winners_ibfk_1` FOREIGN KEY (`auction_id`) REFERENCES `auctions` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `winners_ibfk_2` FOREIGN KEY (`bid_id`) REFERENCES `bids` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `winners_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
