import { Router } from 'express';
import {
  authenticate,
  authorize,
  attachDataScope,
  MODULES,
  ACTIONS,
} from '../core/authorization/index.js';
import { createResourceHandlers } from '../utils/resource-handlers.util.js';
import { sendSuccess } from '../utils/response.util.js';
import { authorizationPermissionService } from '../core/authorization/permission.service.js';
import { kycController } from '../controllers/kyc.controller.js';
import { auctionController } from '../controllers/auction.controller.js';
import { requireKYCVerified } from '../middleware/kyc.middleware.js';
import fileUploadRoutes from './fileUpload.routes.js';

const v1Router = Router();

// File upload routes
v1Router.use('/files', fileUploadRoutes);

function mountResource(router, basePath, moduleName, resourceName, options = {}) {
  const handlers = createResourceHandlers(resourceName, moduleName);
  const kycGate = options.requireKycOnCreate ? [requireKYCVerified] : [];

  router.get(
    basePath,
    authenticate,
    attachDataScope(moduleName),
    authorize({ module: moduleName, action: ACTIONS.READ }),
    handlers.list,
  );

  router.get(
    `${basePath}/:id`,
    authenticate,
    attachDataScope(moduleName),
    authorize({ module: moduleName, action: ACTIONS.READ }),
    handlers.getById,
  );

  router.post(
    basePath,
    authenticate,
    attachDataScope(moduleName),
    authorize({ module: moduleName, action: ACTIONS.CREATE }),
    ...kycGate,
    handlers.create,
  );

  router.put(
    `${basePath}/:id`,
    authenticate,
    attachDataScope(moduleName),
    authorize({ module: moduleName, action: ACTIONS.UPDATE }),
    handlers.update,
  );

  router.delete(
    `${basePath}/:id`,
    authenticate,
    attachDataScope(moduleName),
    authorize({ module: moduleName, action: ACTIONS.DELETE }),
    handlers.remove,
  );
}

// Users
mountResource(v1Router, '/users', MODULES.USERS, 'users');

// KYC — user-facing routes (must be registered before /kyc/:id)
v1Router.post(
  '/kyc',
  authenticate,
  authorize({ module: MODULES.KYC, action: ACTIONS.CREATE }),
  kycController.submitKYC,
);
v1Router.get(
  '/kyc/my',
  authenticate,
  authorize({ module: MODULES.KYC, action: ACTIONS.READ }),
  kycController.getMyKYC,
);
v1Router.post(
  '/kyc/resubmit',
  authenticate,
  authorize({ module: MODULES.KYC, action: ACTIONS.UPDATE }),
  kycController.resubmitKYC,
);

// KYC — staff review routes
v1Router.get(
  '/kyc',
  authenticate,
  attachDataScope(MODULES.KYC),
  authorize({ module: MODULES.KYC, action: ACTIONS.READ }),
  kycController.listKYCs,
);
v1Router.get(
  '/kyc/:id',
  authenticate,
  attachDataScope(MODULES.KYC),
  authorize({ module: MODULES.KYC, action: ACTIONS.READ }),
  kycController.getKYCById,
);
v1Router.get(
  '/kyc/:id/audit',
  authenticate,
  attachDataScope(MODULES.KYC),
  authorize({ module: MODULES.KYC, action: ACTIONS.READ }),
  kycController.getKYCAuditTrail,
);
v1Router.post(
  '/kyc/:id/mark-under-review',
  authenticate,
  authorize({ module: MODULES.KYC, action: ACTIONS.UPDATE }),
  kycController.markKYCUnderReview,
);
v1Router.post(
  '/kyc/:id/approve',
  authenticate,
  authorize({ module: MODULES.KYC, action: ACTIONS.APPROVE }),
  kycController.approveKYC,
);
v1Router.post(
  '/kyc/:id/reject',
  authenticate,
  authorize({ module: MODULES.KYC, action: ACTIONS.REJECT }),
  kycController.rejectKYC,
);

// Assets
const assets = createResourceHandlers('assets', MODULES.ASSETS);
mountResource(v1Router, '/assets', MODULES.ASSETS, 'assets', { requireKycOnCreate: true });
v1Router.post('/assets/:id/approve', authenticate, authorize({ module: MODULES.ASSETS, action: ACTIONS.APPROVE }), assets.approve);
v1Router.post('/assets/:id/reject', authenticate, authorize({ module: MODULES.ASSETS, action: ACTIONS.REJECT }), assets.reject);

// Evaluations
const evaluations = createResourceHandlers('evaluations', MODULES.EVALUATIONS);
mountResource(v1Router, '/evaluations', MODULES.EVALUATIONS, 'evaluations');
v1Router.post('/evaluations/:id/approve', authenticate, authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.APPROVE }), evaluations.approve);
v1Router.post('/evaluations/:id/reject', authenticate, authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.REJECT }), evaluations.reject);

// Auctions
v1Router.get(
  '/auctions',
  authenticate,
  attachDataScope(MODULES.AUCTIONS),
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.READ }),
  auctionController.listAuctions,
);
v1Router.get(
  '/auctions/:id',
  authenticate,
  attachDataScope(MODULES.AUCTIONS),
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.READ }),
  auctionController.getAuctionById,
);
v1Router.post(
  '/auctions',
  authenticate,
  attachDataScope(MODULES.AUCTIONS),
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.CREATE }),
  auctionController.createAuction,
);
v1Router.put(
  '/auctions/:id',
  authenticate,
  attachDataScope(MODULES.AUCTIONS),
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.UPDATE }),
  auctionController.updateAuction,
);
v1Router.delete(
  '/auctions/:id',
  authenticate,
  attachDataScope(MODULES.AUCTIONS),
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.DELETE }),
  auctionController.deleteAuction,
);
v1Router.post(
  '/auctions/:id/publish',
  authenticate,
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.PUBLISH }),
  auctionController.publishAuction,
);
v1Router.post(
  '/auctions/:id/suspend',
  authenticate,
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.UPDATE }),
  auctionController.suspendAuction,
);
v1Router.post(
  '/auctions/:id/reactivate',
  authenticate,
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.UPDATE }),
  auctionController.reactivateAuction,
);
v1Router.post(
  '/auctions/:id/close',
  authenticate,
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.CLOSE }),
  auctionController.closeAuction,
);

// Documents
mountResource(v1Router, '/documents', MODULES.DOCUMENTS, 'documents', { requireKycOnCreate: true });

// Payments
const payments = createResourceHandlers('payments', MODULES.PAYMENTS);
mountResource(v1Router, '/payments', MODULES.PAYMENTS, 'payments', { requireKycOnCreate: true });
v1Router.post('/payments/:id/approve', authenticate, authorize({ module: MODULES.PAYMENTS, action: ACTIONS.APPROVE }), payments.approve);
v1Router.post('/payments/:id/reject', authenticate, authorize({ module: MODULES.PAYMENTS, action: ACTIONS.REJECT }), payments.reject);

// CPO
const cpo = createResourceHandlers('cpo', MODULES.CPO);
mountResource(v1Router, '/cpo', MODULES.CPO, 'cpo', { requireKycOnCreate: true });
v1Router.post('/cpo/:id/approve', authenticate, authorize({ module: MODULES.CPO, action: ACTIONS.APPROVE }), cpo.approve);
v1Router.post('/cpo/:id/reject', authenticate, authorize({ module: MODULES.CPO, action: ACTIONS.REJECT }), cpo.reject);

// Bids
const bids = createResourceHandlers('bids', MODULES.BIDS);
v1Router.get('/bids/my', authenticate, attachDataScope(MODULES.BIDS), authorize({ module: MODULES.BIDS, action: ACTIONS.READ }), bids.list);
v1Router.get('/bids/auction/:auctionId', authenticate, attachDataScope(MODULES.BIDS), authorize({ module: MODULES.BIDS, action: ACTIONS.READ }), bids.list);
v1Router.get('/bids', authenticate, attachDataScope(MODULES.BIDS), authorize({ module: MODULES.BIDS, action: ACTIONS.READ }), bids.list);
v1Router.post(
  '/bids',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.CREATE }),
  requireKYCVerified,
  bids.create,
);

// Winners
mountResource(v1Router, '/winners', MODULES.WINNERS, 'winners', { requireKycOnCreate: true });

// Notifications
mountResource(v1Router, '/notifications', MODULES.NOTIFICATIONS, 'notifications');

// Dashboard
v1Router.get(
  '/dashboard',
  authenticate,
  authorize({ module: MODULES.DASHBOARD, action: ACTIONS.READ }),
  (req, res) => sendSuccess(res, { metrics: {}, roleCode: req.user?.roleCode }),
);

v1Router.get(
  '/dashboard/reports',
  authenticate,
  authorize({ module: MODULES.DASHBOARD, action: ACTIONS.READ }),
  (req, res) => sendSuccess(res, { reports: [] }),
);

v1Router.get(
  '/dashboard/reports/export',
  authenticate,
  authorize({ module: MODULES.DASHBOARD, action: ACTIONS.EXPORT }),
  (req, res) => sendSuccess(res, { exportUrl: null }),
);

// Staff & roles
mountResource(v1Router, '/staff', MODULES.STAFF, 'staff');
mountResource(v1Router, '/roles', MODULES.ROLES, 'roles');

// Settings
v1Router.get(
  '/settings',
  authenticate,
  authorize({ module: MODULES.SETTINGS, action: ACTIONS.READ }),
  (req, res) => sendSuccess(res, { settings: {} }),
);
v1Router.put(
  '/settings',
  authenticate,
  authorize({ module: MODULES.SETTINGS, action: ACTIONS.UPDATE }),
  (req, res) => sendSuccess(res, { updated: true }),
);

// Session introspection
v1Router.get('/auth/me', authenticate, async (req, res) => {
  const principal = await authorizationPermissionService.resolvePrincipal(req.user.id);
  return sendSuccess(res, {
    id: principal.userId,
    roleId: principal.effectiveRoleId,
    roleCode: principal.role.code,
    userType: principal.userType,
    staffId: principal.staffId,
    status: principal.userStatus,
    permissions: {
      wildcard: principal.wildcard,
      modules: principal.modules,
      actions: principal.actions,
      routes: principal.routes,
    },
    identity: {
      displayName: principal.displayName,
      mobileNumber: principal.mobileNumber,
      email: principal.email,
      isStaff: principal.isStaff,
    },
  });
});

// Navigation manifest for dynamic sidebar (permission-filtered on client too)
v1Router.get('/auth/navigation', authenticate, async (req, res) => {
  const { PAGE_ACCESS_REGISTRY } = await import('../core/authorization/access-map.js');
  const { policyEngine } = await import('../core/authorization/policy.engine.js');
  const principal = await authorizationPermissionService.resolvePrincipal(req.user.id);
  const context = authorizationPermissionService.buildPermissionContext(principal);

  const items = PAGE_ACCESS_REGISTRY.filter((page) =>
    policyEngine.hasPermission(context, page.module, page.action),
  );

  return sendSuccess(res, { items, roleCode: principal.role.code });
});

export default v1Router;
