-- =============================================================================
-- Consolidate legacy asset_owner RBAC role into bidder
-- Safe to re-run: only affects users still on asset_owner role
-- The asset_owners table (asset profile) is NOT modified.
-- =============================================================================

USE `enderass_auction`;

START TRANSACTION;

SET @bidder_role_id = (
  SELECT `id` FROM `roles` WHERE `code` = 'bidder' LIMIT 1
);

SET @asset_owner_role_id = (
  SELECT `id` FROM `roles` WHERE `code` = 'asset_owner' LIMIT 1
);

UPDATE `users`
SET `role_id` = @bidder_role_id, `updated_at` = NOW()
WHERE @bidder_role_id IS NOT NULL
  AND @asset_owner_role_id IS NOT NULL
  AND `role_id` = @asset_owner_role_id;

UPDATE `roles`
SET `is_active` = 0, `updated_at` = NOW()
WHERE `code` = 'asset_owner';

SELECT `code`, `is_active`, (
  SELECT COUNT(*) FROM `users` WHERE `role_id` = `roles`.`id` AND `deleted_at` IS NULL
) AS user_count
FROM `roles`
WHERE `code` IN ('bidder', 'asset_owner');

COMMIT;

-- After running: restart backend, have affected users log out and back in.
