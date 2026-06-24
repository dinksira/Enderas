-- =============================================================================
-- Grant asset submission (auction request) to bidder role
-- All registered users (individual + organization) use the bidder role and can
-- submit assets for auction after KYC approval.
-- =============================================================================

USE `enderass_auction`;

START TRANSACTION;

UPDATE `roles`
SET `description` = '{
  "summary":"Participates in auctions, submits KYC, and requests auctions by submitting owned assets.",
  "permissions":{
    "modules":["bids","payments","cpo","notifications","kyc","assets"],
    "actions":["create","read","update"],
    "routes":[
      "POST /api/v1/bids","GET /api/v1/bids/my",
      "POST /api/v1/payments","GET /api/v1/payments",
      "POST /api/v1/cpo","GET /api/v1/notifications",
      "POST /api/v1/kyc","GET /api/v1/kyc/my","POST /api/v1/kyc/resubmit",
      "POST /api/v1/assets","GET /api/v1/assets/my","GET /api/v1/assets/:id","PUT /api/v1/assets/:id"
    ]
  },
  "permissionVersion":3
}',
`updated_at` = NOW()
WHERE `code` = 'bidder';

SELECT `id`, `name`, `code`, `description` FROM `roles` WHERE `code` = 'bidder';

COMMIT;

-- After running:
-- 1. Restart the backend (clears permission cache)
-- 2. Log out and log back in on the frontend
