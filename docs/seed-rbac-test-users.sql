-- =============================================================================
-- Enderas Auction — RBAC Test User Seed (phpMyAdmin / MariaDB)
-- Database : enderass_auction
-- Schema   : docs/enderass_auction.sql
--
-- Test credentials after running:
--   Admin  : mobile 0912345678  | password pass1 | role super_admin (staff)
--   Bidder : mobile 0987654321  | password pass2 | role bidder (users only)
--
-- Safe to re-run: removes prior rows for these mobiles, then upserts.
-- =============================================================================

USE `enderass_auction`;

START TRANSACTION;

-- -----------------------------------------------------------------------------
-- Fixed UUIDs (stable across re-runs)
-- -----------------------------------------------------------------------------
SET @admin_user_id   = 'a1000001-0001-4001-8001-000000000001';
SET @bidder_user_id  = 'a1000002-0002-4002-8002-000000000002';
SET @admin_staff_id  = 'a2000001-0001-4001-8001-000000000001';

-- Existing seeded role IDs from roles table
SET @role_super_admin = '5a214d89-26a2-470b-a22c-2a4820dff6e8';
SET @role_bidder      = '3f64293e-93eb-4bc0-8839-5dadbfb12a5a';

-- Pre-computed bcrypt hashes (pass1 / pass2) — bcrypt cost factor 10
SET @admin_password_hash  = '$2b$10$Xy2Sr3Ly3Z9EqQhgzNUhxuyh4/5extqkMTV9ucr/dCodm03ouM7H.';
SET @bidder_password_hash = '$2b$10$oaCUDR4UH8rluu7hGoS4fOizvEIErPsfgw09mUeWBvk9MvlhKGDcW';

-- Mobile numbers (local + international forms used by the API normalizer)
SET @admin_mobile_local  = '0912345678';
SET @admin_mobile_intl   = '+251912345678';
SET @bidder_mobile_local = '0987654321';
SET @bidder_mobile_intl  = '+251987654321';

-- -----------------------------------------------------------------------------
-- 1) Cleanup — remove prior test rows (staff first due to FK on users)
-- -----------------------------------------------------------------------------
DELETE FROM `staff`
WHERE `user_id` IN (
  SELECT `id` FROM (
    SELECT `id`
    FROM `users`
    WHERE `mobile_number` IN (
      @admin_mobile_local,
      @admin_mobile_intl,
      @bidder_mobile_local,
      @bidder_mobile_intl
    )
  ) AS `u_cleanup`
);

DELETE FROM `refresh_tokens`
WHERE `user_id` IN (
  SELECT `id` FROM (
    SELECT `id`
    FROM `users`
    WHERE `mobile_number` IN (
      @admin_mobile_local,
      @admin_mobile_intl,
      @bidder_mobile_local,
      @bidder_mobile_intl
    )
  ) AS `u_rt_cleanup`
);

DELETE FROM `users`
WHERE `mobile_number` IN (
  @admin_mobile_local,
  @admin_mobile_intl,
  @bidder_mobile_local,
  @bidder_mobile_intl
);

-- -----------------------------------------------------------------------------
-- 2) Admin staff user — users + staff (super_admin via COALESCE staff.role_id)
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
  @admin_user_id,
  @role_super_admin,
  'individual',
  @admin_mobile_local,
  'system.admin.test@enderass.local',
  @admin_password_hash,
  'System',
  'Admin',
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
  `role_id`              = VALUES(`role_id`),
  `user_type`            = VALUES(`user_type`),
  `email`                = VALUES(`email`),
  `password`             = VALUES(`password`),
  `first_name`           = VALUES(`first_name`),
  `last_name`            = VALUES(`last_name`),
  `preferred_language`   = VALUES(`preferred_language`),
  `is_mobile_verified`   = VALUES(`is_mobile_verified`),
  `is_email_verified`    = VALUES(`is_email_verified`),
  `status`               = VALUES(`status`),
  `failed_login_attempts`= 0,
  `updated_at`           = NOW(),
  `deleted_at`           = NULL;

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
  @admin_staff_id,
  @admin_user_id,
  @role_super_admin,
  'EMP-TEST-ADMIN-001',
  'Administration',
  1,
  NOW(),
  NULL,
  NULL,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  `user_id`             = VALUES(`user_id`),
  `role_id`             = VALUES(`role_id`),
  `employee_id`         = VALUES(`employee_id`),
  `department`          = VALUES(`department`),
  `is_active`           = 1,
  `activated_at`        = VALUES(`activated_at`),
  `deactivated_at`      = NULL,
  `updated_at`          = NOW(),
  `deleted_at`          = NULL;

-- -----------------------------------------------------------------------------
-- 3) Bidder user — users only (no staff row; role_id = bidder)
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
  @bidder_user_id,
  @role_bidder,
  'individual',
  @bidder_mobile_local,
  'test.bidder@enderass.local',
  @bidder_password_hash,
  'Test',
  'Bidder',
  'en',
  1,
  0,
  'active',
  0,
  NOW(),
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  `role_id`              = VALUES(`role_id`),
  `user_type`            = VALUES(`user_type`),
  `email`                = VALUES(`email`),
  `password`             = VALUES(`password`),
  `first_name`           = VALUES(`first_name`),
  `last_name`            = VALUES(`last_name`),
  `preferred_language`   = VALUES(`preferred_language`),
  `is_mobile_verified`   = VALUES(`is_mobile_verified`),
  `is_email_verified`    = VALUES(`is_email_verified`),
  `status`               = VALUES(`status`),
  `failed_login_attempts`= 0,
  `updated_at`           = NOW(),
  `deleted_at`           = NULL;

COMMIT;

-- -----------------------------------------------------------------------------
-- 4) Verification snapshot
-- -----------------------------------------------------------------------------
SELECT
  u.id AS user_id,
  u.mobile_number,
  u.first_name,
  u.last_name,
  u.status,
  u.user_type,
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
WHERE u.mobile_number IN (@admin_mobile_local, @bidder_mobile_local)
  AND u.deleted_at IS NULL
ORDER BY u.mobile_number;
