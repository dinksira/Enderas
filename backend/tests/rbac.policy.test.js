import test from 'node:test';
import assert from 'node:assert/strict';
import { policyEngine } from '../src/core/authorization/policy.engine.js';

const bidderContext = {
  roleCode: 'bidder',
  wildcard: false,
  modules: ['bids', 'payments', 'cpo', 'notifications'],
  actions: ['create', 'read', 'update'],
  routes: ['POST /api/v1/bids'],
};

const superAdminContext = {
  roleCode: 'super_admin',
  wildcard: true,
  modules: ['*'],
  actions: ['create', 'read', 'update', 'delete'],
  routes: ['*'],
};

test('policyEngine denies bidder from auctions create', () => {
  assert.equal(policyEngine.canCreate(bidderContext, 'auctions'), false);
});

test('policyEngine allows bidder bids read', () => {
  assert.equal(policyEngine.canRead(bidderContext, 'bids'), true);
});

test('policyEngine allows super admin wildcard', () => {
  assert.equal(policyEngine.canDelete(superAdminContext, 'users'), true);
  assert.equal(policyEngine.isWildcardPrincipal(superAdminContext), true);
});

test('policyEngine route signature check', () => {
  assert.equal(
    policyEngine.canAccessRouteSignature(bidderContext, 'POST /api/v1/bids'),
    true,
  );
  assert.equal(
    policyEngine.canAccessRouteSignature(bidderContext, 'POST /api/v1/auctions'),
    false,
  );
});
