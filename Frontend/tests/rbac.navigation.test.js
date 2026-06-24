import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNavigation } from '../src/config/navigation.config.js';

test('bidder navigation excludes staff and roles', () => {
  const permissions = {
    roleCode: 'bidder',
    wildcard: false,
    modules: ['bids', 'payments', 'cpo', 'notifications', 'kyc', 'assets'],
    actions: ['create', 'read', 'update'],
    routes: [],
  };

  const nav = resolveNavigation(permissions);
  const ids = nav.map((item) => item.id);

  assert.ok(ids.includes('browse-auctions'));
  assert.ok(ids.includes('my-bids'));
  assert.ok(ids.includes('submit-asset'));
  assert.ok(ids.includes('my-assets'));
  assert.ok(!ids.includes('bids'));
  assert.ok(!ids.includes('staff'));
  assert.ok(!ids.includes('roles'));
});

test('super admin navigation includes admin pages', () => {
  const permissions = {
    roleCode: 'super_admin',
    wildcard: true,
    modules: ['*'],
    actions: ['*'],
    routes: ['*'],
  };

  const nav = resolveNavigation(permissions);
  const ids = nav.map((item) => item.id);

  assert.ok(ids.includes('staff'));
  assert.ok(ids.includes('roles'));
  assert.ok(ids.includes('settings'));
});
