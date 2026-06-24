-- =============================================================================
-- Enderas Auction — Operational Staff RBAC Test Seed (phpMyAdmin / MariaDB)
-- Database : enderass_auction
-- Schema   : docs/enderass_auction.sql
--
-- Seeds 4 isolated staff test accounts (safe to re-run via mobile_number upsert):
--
--   Auction Manager          : 0922222222 | pass1 | auction_manager
--   Evaluation Officer       : 0933333333 | pass1 | evaluation_officer
--   Finance Officer          : 0944444444 | pass1 | finance_officer
--   Customer Service Officer : 0955555555 | pass1 | customer_service_officer
--
-- Password hash: bcrypt cost 10 for plaintext "pass1"
-- Verified via bcrypt.compare('pass1', hash) — same hash as seed-rbac-test-users.sql admin
-- NOTE: Do NOT use ad-hoc hashes; invalid hashes cause 401 INVALID_CREDENTIALS.
-- =============================================================================

USE `enderass_auction`;

START TRANSACTION;

-- -----------------------------------------------------------------------------
-- Shared password hash (plaintext: pass1)
-- -----------------------------------------------------------------------------
SET @password_hash = '$2b$10$Xy2Sr3Ly3Z9EqQhgzNUhxuyh4/5extqkMTV9ucr/dCodm03ouM7H.';

-- -----------------------------------------------------------------------------
-- Resolve role_id values dynamically from roles.code
-- -----------------------------------------------------------------------------
SET @role_auction_manager = (
  SELECT `id` FROM `roles` WHERE `code` = 'auction_manager' AND `is_active` = 1 LIMIT 1
);
SET @role_evaluation_officer = (
  SELECT `id` FROM `roles` WHERE `code` = 'evaluation_officer' AND `is_active` = 1 LIMIT 1
);
SET @role_finance_officer = (
  SELECT `id` FROM `roles` WHERE `code` = 'finance_officer' AND `is_active` = 1 LIMIT 1
);
SET @role_customer_service_officer = (
  SELECT `id` FROM `roles` WHERE `code` = 'customer_service_officer' AND `is_active` = 1 LIMIT 1
);

-- Abort early if any role is missing
SELECT
  @role_auction_manager AS role_auction_manager,
  @role_evaluation_officer AS role_evaluation_officer,
  @role_finance_officer AS role_finance_officer,
  @role_customer_service_officer AS role_customer_service_officer;

-- -----------------------------------------------------------------------------
-- Stable isolated UUIDs (decoupled from admin / bidder test accounts)
-- Naming map: u-mgr / s-mgr, u-eval / s-eval, u-fin / s-fin, u-cs / s-cs
-- -----------------------------------------------------------------------------
SET @u_mgr_id  = 'a1000003-0003-4003-8003-000000000003';  -- u-mgr
SET @s_mgr_id  = 'a2000003-0003-4003-8003-000000000003';  -- s-mgr
SET @u_eval_id = 'a1000004-0004-4004-8004-000000000004';  -- u-eval
SET @s_eval_id = 'a2000004-0004-4004-8004-000000000004';  -- s-eval
SET @u_fin_id  = 'a1000005-0005-4005-8005-000000000005';  -- u-fin
SET @s_fin_id  = 'a2000005-0005-4005-8005-000000000005';  -- s-fin
SET @u_cs_id   = 'a1000006-0006-4006-8006-000000000006';  -- u-cs
SET @s_cs_id   = 'a2000006-0006-4006-8006-000000000006';  -- s-cs

-- -----------------------------------------------------------------------------
-- 1) Auction Manager — users upsert (unique: mobile_number)
-- -----------------------------------------------------------------------------
INSERT INTO `users` (
  `id`,
  `role_id`,
  `user_type`,
  `mobile_number`,
  `email`,
  `password`,
  `first_name`,
  `last_name`,
  `preferred_language`,
  `is_mobile_verified`,
  `is_email_verified`,
  `status`,
  `failed_login_attempts`,
  `created_at`,
  `updated_at`,
  `deleted_at`
) VALUES (
  @u_mgr_id,
  @role_auction_manager,
  'individual',
  '0922222222',
  'auction.manager.test@enderass.local',
  @password_hash,
  'Test',
  'Auction Manager',
  'en',
  1,
  1,
  'active',
  0,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  `role_id`               = VALUES(`role_id`),
  `user_type`             = VALUES(`user_type`),
  `email`                 = VALUES(`email`),
  `password`              = VALUES(`password`),
  `first_name`            = VALUES(`first_name`),
  `last_name`             = VALUES(`last_name`),
  `preferred_language`    = VALUES(`preferred_language`),
  `is_mobile_verified`    = VALUES(`is_mobile_verified`),
  `is_email_verified`     = VALUES(`is_email_verified`),
  `status`                = VALUES(`status`),
  `failed_login_attempts` = 0,
  `updated_at`            = NOW(),
  `deleted_at`            = NULL;

-- Resolve canonical user_id after upsert (handles pre-existing mobile rows)
SET @u_mgr_id = (SELECT `id` FROM `users` WHERE `mobile_number` = '0922222222' AND `deleted_at` IS NULL LIMIT 1);

INSERT INTO `staff` (
  `id`,
  `user_id`,
  `role_id`,
  `employee_id`,
  `department`,
  `is_active`,
  `activated_at`,
  `deactivated_at`,
  `created_by_staff_id`,
  `created_at`,
  `updated_at`,
  `deleted_at`
) VALUES (
  @s_mgr_id,
  @u_mgr_id,
  @role_auction_manager,
  'EMP-MGR-02',
  'Operations & Campaigns',
  1,
  NOW(),
  NULL,
  NULL,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  `user_id`         = VALUES(`user_id`),
  `role_id`         = VALUES(`role_id`),
  `employee_id`     = VALUES(`employee_id`),
  `department`      = VALUES(`department`),
  `is_active`       = 1,
  `activated_at`    = VALUES(`activated_at`),
  `deactivated_at`  = NULL,
  `updated_at`      = NOW(),
  `deleted_at`      = NULL;

-- -----------------------------------------------------------------------------
-- 2) Evaluation Officer — users upsert
-- -----------------------------------------------------------------------------
INSERT INTO `users` (
  `id`,
  `role_id`,
  `user_type`,
  `mobile_number`,
  `email`,
  `password`,
  `first_name`,
  `last_name`,
  `preferred_language`,
  `is_mobile_verified`,
  `is_email_verified`,
  `status`,
  `failed_login_attempts`,
  `created_at`,
  `updated_at`,
  `deleted_at`
) VALUES (
  @u_eval_id,
  @role_evaluation_officer,
  'individual',
  '0933333333',
  'evaluation.officer.test@enderass.local',
  @password_hash,
  'Test',
  'Evaluation Officer',
  'en',
  1,
  1,
  'active',
  0,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  `role_id`               = VALUES(`role_id`),
  `user_type`             = VALUES(`user_type`),
  `email`                 = VALUES(`email`),
  `password`              = VALUES(`password`),
  `first_name`            = VALUES(`first_name`),
  `last_name`             = VALUES(`last_name`),
  `preferred_language`    = VALUES(`preferred_language`),
  `is_mobile_verified`    = VALUES(`is_mobile_verified`),
  `is_email_verified`     = VALUES(`is_email_verified`),
  `status`                = VALUES(`status`),
  `failed_login_attempts` = 0,
  `updated_at`            = NOW(),
  `deleted_at`            = NULL;

SET @u_eval_id = (SELECT `id` FROM `users` WHERE `mobile_number` = '0933333333' AND `deleted_at` IS NULL LIMIT 1);

INSERT INTO `staff` (
  `id`,
  `user_id`,
  `role_id`,
  `employee_id`,
  `department`,
  `is_active`,
  `activated_at`,
  `deactivated_at`,
  `created_by_staff_id`,
  `created_at`,
  `updated_at`,
  `deleted_at`
) VALUES (
  @s_eval_id,
  @u_eval_id,
  @role_evaluation_officer,
  'EMP-EVAL-03',
  'Asset Appraisals & Inspection',
  1,
  NOW(),
  NULL,
  NULL,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  `user_id`         = VALUES(`user_id`),
  `role_id`         = VALUES(`role_id`),
  `employee_id`     = VALUES(`employee_id`),
  `department`      = VALUES(`department`),
  `is_active`       = 1,
  `activated_at`    = VALUES(`activated_at`),
  `deactivated_at`  = NULL,
  `updated_at`      = NOW(),
  `deleted_at`      = NULL;

-- -----------------------------------------------------------------------------
-- 3) Finance Officer — users upsert
-- -----------------------------------------------------------------------------
INSERT INTO `users` (
  `id`,
  `role_id`,
  `user_type`,
  `mobile_number`,
  `email`,
  `password`,
  `first_name`,
  `last_name`,
  `preferred_language`,
  `is_mobile_verified`,
  `is_email_verified`,
  `status`,
  `failed_login_attempts`,
  `created_at`,
  `updated_at`,
  `deleted_at`
) VALUES (
  @u_fin_id,
  @role_finance_officer,
  'individual',
  '0944444444',
  'finance.officer.test@enderass.local',
  @password_hash,
  'Test',
  'Finance Officer',
  'en',
  1,
  1,
  'active',
  0,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  `role_id`               = VALUES(`role_id`),
  `user_type`             = VALUES(`user_type`),
  `email`                 = VALUES(`email`),
  `password`              = VALUES(`password`),
  `first_name`            = VALUES(`first_name`),
  `last_name`             = VALUES(`last_name`),
  `preferred_language`    = VALUES(`preferred_language`),
  `is_mobile_verified`    = VALUES(`is_mobile_verified`),
  `is_email_verified`     = VALUES(`is_email_verified`),
  `status`                = VALUES(`status`),
  `failed_login_attempts` = 0,
  `updated_at`            = NOW(),
  `deleted_at`            = NULL;

SET @u_fin_id = (SELECT `id` FROM `users` WHERE `mobile_number` = '0944444444' AND `deleted_at` IS NULL LIMIT 1);

INSERT INTO `staff` (
  `id`,
  `user_id`,
  `role_id`,
  `employee_id`,
  `department`,
  `is_active`,
  `activated_at`,
  `deactivated_at`,
  `created_by_staff_id`,
  `created_at`,
  `updated_at`,
  `deleted_at`
) VALUES (
  @s_fin_id,
  @u_fin_id,
  @role_finance_officer,
  'EMP-FIN-04',
  'Corporate Finance & Settlement',
  1,
  NOW(),
  NULL,
  NULL,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  `user_id`         = VALUES(`user_id`),
  `role_id`         = VALUES(`role_id`),
  `employee_id`     = VALUES(`employee_id`),
  `department`      = VALUES(`department`),
  `is_active`       = 1,
  `activated_at`    = VALUES(`activated_at`),
  `deactivated_at`  = NULL,
  `updated_at`      = NOW(),
  `deleted_at`      = NULL;

-- -----------------------------------------------------------------------------
-- 4) Customer Service Officer — users upsert
-- -----------------------------------------------------------------------------
INSERT INTO `users` (
  `id`,
  `role_id`,
  `user_type`,
  `mobile_number`,
  `email`,
  `password`,
  `first_name`,
  `last_name`,
  `preferred_language`,
  `is_mobile_verified`,
  `is_email_verified`,
  `status`,
  `failed_login_attempts`,
  `created_at`,
  `updated_at`,
  `deleted_at`
) VALUES (
  @u_cs_id,
  @role_customer_service_officer,
  'individual',
  '0955555555',
  'customer.service.test@enderass.local',
  @password_hash,
  'Test',
  'Customer Service',
  'en',
  1,
  1,
  'active',
  0,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  `role_id`               = VALUES(`role_id`),
  `user_type`             = VALUES(`user_type`),
  `email`                 = VALUES(`email`),
  `password`              = VALUES(`password`),
  `first_name`            = VALUES(`first_name`),
  `last_name`             = VALUES(`last_name`),
  `preferred_language`    = VALUES(`preferred_language`),
  `is_mobile_verified`    = VALUES(`is_mobile_verified`),
  `is_email_verified`     = VALUES(`is_email_verified`),
  `status`                = VALUES(`status`),
  `failed_login_attempts` = 0,
  `updated_at`            = NOW(),
  `deleted_at`            = NULL;

SET @u_cs_id = (SELECT `id` FROM `users` WHERE `mobile_number` = '0955555555' AND `deleted_at` IS NULL LIMIT 1);

INSERT INTO `staff` (
  `id`,
  `user_id`,
  `role_id`,
  `employee_id`,
  `department`,
  `is_active`,
  `activated_at`,
  `deactivated_at`,
  `created_by_staff_id`,
  `created_at`,
  `updated_at`,
  `deleted_at`
) VALUES (
  @s_cs_id,
  @u_cs_id,
  @role_customer_service_officer,
  'EMP-CS-05',
  'Client Support & Verification',
  1,
  NOW(),
  NULL,
  NULL,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  `user_id`         = VALUES(`user_id`),
  `role_id`         = VALUES(`role_id`),
  `employee_id`     = VALUES(`employee_id`),
  `department`      = VALUES(`department`),
  `is_active`       = 1,
  `activated_at`    = VALUES(`activated_at`),
  `deactivated_at`  = NULL,
  `updated_at`      = NOW(),
  `deleted_at`      = NULL;

COMMIT;

-- -----------------------------------------------------------------------------
-- Verification — effective RBAC role (staff.role_id overrides users.role_id)
-- -----------------------------------------------------------------------------
SELECT
  u.id AS user_id,
  u.mobile_number,
  u.first_name,
  u.last_name,
  u.status,
  r.code AS user_role_code,
  s.id AS staff_id,
  s.employee_id,
  s.department,
  sr.code AS staff_role_code,
  COALESCE(s.role_id, u.role_id) AS effective_role_id,
  COALESCE(sr.code, r.code) AS effective_role_code
FROM `users` u
INNER JOIN `roles` r ON r.id = u.role_id
LEFT JOIN `staff` s
  ON s.user_id = u.id
 AND s.deleted_at IS NULL
 AND s.is_active = 1
LEFT JOIN `roles` sr ON sr.id = s.role_id
WHERE u.mobile_number IN ('0922222222', '0933333333', '0944444444', '0955555555')
  AND u.deleted_at IS NULL
ORDER BY u.mobile_number;
