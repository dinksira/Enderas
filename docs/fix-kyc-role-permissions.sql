-- =============================================================================
-- Fix KYC Role Permissions
-- Adds kyc module to bidder and asset_owner roles so users can submit KYC
-- =============================================================================

USE `enderass_auction`;

START TRANSACTION;

-- Update bidder role to include kyc module
UPDATE `roles` 
SET `description` = '{
  "summary":"Participates in auctions by submitting bids and related payments, and submits KYC.",
  "permissions":{
    "modules":["bids","payments","cpo","notifications","kyc"],
    "actions":["create","read","update"],
    "routes":["POST /api/v1/bids","GET /api/v1/bids/my","POST /api/v1/payments","GET /api/v1/payments","POST /api/v1/cpo","GET /api/v1/notifications","POST /api/v1/kyc","GET /api/v1/kyc/my","POST /api/v1/kyc/resubmit"]
  },
  "permissionVersion":2
}',
`updated_at` = NOW()
WHERE `code` = 'bidder';

-- Update asset_owner role to include kyc module
UPDATE `roles` 
SET `description` = '{
  "summary":"Registers and manages owned assets for auction, and submits KYC.",
  "permissions":{
    "modules":["assets","payments","kyc"],
    "actions":["create","read","update"],
    "routes":["POST /api/v1/assets","GET /api/v1/assets","PUT /api/v1/assets/:id","DELETE /api/v1/assets/:id","POST /api/v1/payments","GET /api/v1/payments","POST /api/v1/kyc","GET /api/v1/kyc/my","POST /api/v1/kyc/resubmit"]
  },
  "permissionVersion":2
}',
`updated_at` = NOW()
WHERE `code` = 'asset_owner';

-- Verify the fix
SELECT `id`, `name`, `code`, `description` FROM `roles` WHERE `code` IN ('bidder','asset_owner','customer_service_officer');

COMMIT;

-- =============================================================================
-- IMPORTANT: After running this SQL:
-- 1. Restart your backend server to clear all L1 caches
-- 2. Log out and log back in from the frontend to get fresh permissions
-- 3. If using Redis, flush Redis cache (optional but recommended)
-- =============================================================================
