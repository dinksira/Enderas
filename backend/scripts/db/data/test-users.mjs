export const TEST_USERS = Object.freeze({
  admin: Object.freeze({
    id: 'a1000001-0001-4001-8001-000000000001',
    staffId: 'a2000001-0001-4001-8001-000000000001',
    mobileNumber: '0912345678',
    password: 'pass1',
    firstName: 'System',
    lastName: 'Admin',
    email: 'system.admin.test@enderass.local',
    employeeId: 'EMP-TEST-ADMIN-001',
    department: 'Executive Management',
    roleCode: 'super_admin',
  }),
  owner: Object.freeze({
    id: 'a1000002-0002-4002-8002-000000000002',
    mobileNumber: '0987654321',
    password: 'pass2',
    firstName: 'Test',
    lastName: 'Owner',
    email: 'test.owner@enderass.local',
    roleCode: 'bidder',
  }),
  bidder: Object.freeze({
    id: 'a1000007-0007-4007-8007-000000000007',
    mobileNumber: '0998765432',
    password: 'pass3',
    firstName: 'Test',
    lastName: 'Bidder',
    email: 'test.bidder@enderass.local',
    roleCode: 'bidder',
  }),
});

export const TEST_USER_MOBILES = Object.freeze(
  Object.values(TEST_USERS).map((user) => user.mobileNumber),
);

export const TEST_USER_IDS = Object.freeze(
  Object.values(TEST_USERS).map((user) => user.id),
);

export const TEST_STAFF_IDS = Object.freeze([TEST_USERS.admin.staffId]);
