-- =============================================================================
-- HOTFIX: Correct operational staff passwords (pass1)
--
-- Root cause: seed used an invalid bcrypt string that does not verify against
-- plaintext "pass1". Admin (0912345678) works because its hash is valid.
--
-- Run once in phpMyAdmin, then retry login for 0922222222 / pass1.
-- =============================================================================

USE `enderass_auction`;

UPDATE `users`
SET
  `password` = '$2b$10$Xy2Sr3Ly3Z9EqQhgzNUhxuyh4/5extqkMTV9ucr/dCodm03ouM7H.',
  `failed_login_attempts` = 0,
  `updated_at` = NOW()
WHERE `mobile_number` IN ('0922222222', '0933333333', '0944444444', '0955555555')
  AND `deleted_at` IS NULL;

SELECT
  `mobile_number`,
  `first_name`,
  `last_name`,
  `status`,
  LEFT(`password`, 7) AS bcrypt_prefix,
  CHAR_LENGTH(`password`) AS hash_length
FROM `users`
WHERE `mobile_number` IN ('0922222222', '0933333333', '0944444444', '0955555555')
  AND `deleted_at` IS NULL
ORDER BY `mobile_number`;
