export const OPERATIONAL_STAFF = Object.freeze([
  Object.freeze({
    id: 'a1000003-0003-4003-8003-000000000003',
    staffId: 'a2000003-0003-4003-8003-000000000003',
    mobileNumber: '0922222222',
    password: 'pass1',
    firstName: 'Test',
    lastName: 'Auction Manager',
    email: 'auction.manager.test@enderass.local',
    employeeId: 'EMP-MGR-02',
    department: 'Operations & Campaigns',
    roleCode: 'auction_manager',
  }),
  Object.freeze({
    id: 'a1000004-0004-4004-8004-000000000004',
    staffId: 'a2000004-0004-4004-8004-000000000004',
    mobileNumber: '0933333333',
    password: 'pass1',
    firstName: 'Test',
    lastName: 'Evaluation Officer',
    email: 'evaluation.officer.test@enderass.local',
    employeeId: 'EMP-EVAL-03',
    department: 'Asset Appraisals & Inspection',
    roleCode: 'evaluation_officer',
  }),
  Object.freeze({
    id: 'a1000005-0005-4005-8005-000000000005',
    staffId: 'a2000005-0005-4005-8005-000000000005',
    mobileNumber: '0944444444',
    password: 'pass1',
    firstName: 'Test',
    lastName: 'Finance Officer',
    email: 'finance.officer.test@enderass.local',
    employeeId: 'EMP-FIN-04',
    department: 'Corporate Finance & Settlement',
    roleCode: 'finance_officer',
  }),
  Object.freeze({
    id: 'a1000006-0006-4006-8006-000000000006',
    staffId: 'a2000006-0006-4006-8006-000000000006',
    mobileNumber: '0955555555',
    password: 'pass1',
    firstName: 'Test',
    lastName: 'Customer Service',
    email: 'customer.service.test@enderass.local',
    employeeId: 'EMP-CS-05',
    department: 'Client Support & Verification',
    roleCode: 'customer_service_officer',
  }),
]);

export const OPERATIONAL_STAFF_MOBILES = Object.freeze(
  OPERATIONAL_STAFF.map((user) => user.mobileNumber),
);

export const OPERATIONAL_STAFF_USER_IDS = Object.freeze(
  OPERATIONAL_STAFF.map((user) => user.id),
);

export const OPERATIONAL_STAFF_STAFF_IDS = Object.freeze(
  OPERATIONAL_STAFF.map((user) => user.staffId),
);
