import { Router } from 'express';
import {
  authenticate,
  optionalAuthenticate,
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
import { assetController } from '../controllers/asset.controller.js';
import { userController } from '../controllers/user.controller.js';
import { staffController } from '../controllers/staff.controller.js';
import { organizationController } from '../controllers/organization.controller.js';
import { organizationAuctionController } from '../controllers/organization-auction.controller.js';
import { settingsController } from '../controllers/settings.controller.js';
import { auditController } from '../controllers/audit.controller.js';
import { roleController } from '../controllers/role.controller.js';
import { evaluationController } from '../controllers/evaluation.controller.js';
import { paymentController } from '../controllers/payment.controller.js';
import { cpoController } from '../controllers/cpo.controller.js';
import { bidController } from '../controllers/bid.controller.js';
import { bidDraftController } from '../controllers/bid-draft.controller.js';
import { winnerController } from '../controllers/winner.controller.js';
import { notificationController } from '../controllers/notification.controller.js';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authController } from '../modules/auth/auth.controller.js';
import { validateUpdateProfileBody } from '../modules/auth/auth.validation.js';
import { shareLinkController } from '../controllers/share-link.controller.js';
import { requireKYCVerified } from '../middleware/kyc.middleware.js';
import { requireStaff } from '../middleware/staff.middleware.js';
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
v1Router.get(
  '/users',
  authenticate,
  attachDataScope(MODULES.USERS),
  authorize({ module: MODULES.USERS, action: ACTIONS.READ }),
  userController.listUsers,
);
v1Router.get(
  '/users/:id',
  authenticate,
  attachDataScope(MODULES.USERS),
  authorize({ module: MODULES.USERS, action: ACTIONS.READ }),
  userController.getUserById,
);
v1Router.post(
  '/users',
  authenticate,
  attachDataScope(MODULES.USERS),
  authorize({ module: MODULES.USERS, action: ACTIONS.CREATE }),
  requireStaff,
  userController.createUser,
);
v1Router.put(
  '/users/:id',
  authenticate,
  attachDataScope(MODULES.USERS),
  authorize({ module: MODULES.USERS, action: ACTIONS.UPDATE }),
  requireStaff,
  userController.updateUser,
);
v1Router.post(
  '/users/:id/status',
  authenticate,
  attachDataScope(MODULES.USERS),
  authorize({ module: MODULES.USERS, action: ACTIONS.UPDATE }),
  requireStaff,
  userController.updateUserStatus,
);
v1Router.delete(
  '/users/:id',
  authenticate,
  attachDataScope(MODULES.USERS),
  authorize({ module: MODULES.USERS, action: ACTIONS.DELETE }),
  requireStaff,
  userController.deleteUser,
);

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
v1Router.get(
  '/assets/my',
  authenticate,
  authorize({ module: MODULES.ASSETS, action: ACTIONS.READ }),
  assetController.listMyAssets,
);
v1Router.get(
  '/assets',
  authenticate,
  attachDataScope(MODULES.ASSETS),
  authorize({ module: MODULES.ASSETS, action: ACTIONS.READ }),
  assetController.listAssets,
);
v1Router.get(
  '/assets/:id',
  authenticate,
  attachDataScope(MODULES.ASSETS),
  authorize({ module: MODULES.ASSETS, action: ACTIONS.READ }),
  assetController.getAssetById,
);
v1Router.post(
  '/assets/batch',
  authenticate,
  attachDataScope(MODULES.ASSETS),
  authorize({ module: MODULES.ASSETS, action: ACTIONS.CREATE }),
  requireKYCVerified,
  assetController.createAssetsBatch,
);
v1Router.post(
  '/assets',
  authenticate,
  attachDataScope(MODULES.ASSETS),
  authorize({ module: MODULES.ASSETS, action: ACTIONS.CREATE }),
  requireKYCVerified,
  assetController.createAsset,
);
v1Router.put(
  '/assets/:id',
  authenticate,
  attachDataScope(MODULES.ASSETS),
  authorize({ module: MODULES.ASSETS, action: ACTIONS.UPDATE }),
  assetController.updateAsset,
);
v1Router.post(
  '/assets/:id/approve',
  authenticate,
  authorize({ module: MODULES.ASSETS, action: ACTIONS.APPROVE }),
  assetController.approveAsset,
);
v1Router.post(
  '/assets/:id/reject',
  authenticate,
  authorize({ module: MODULES.ASSETS, action: ACTIONS.REJECT }),
  assetController.rejectAsset,
);
v1Router.post(
  '/assets/staff-create',
  authenticate,
  attachDataScope(MODULES.ASSETS),
  authorize({ module: MODULES.ASSETS, action: ACTIONS.CREATE }),
  requireStaff,
  assetController.staffCreateAsset,
);

// Evaluations
v1Router.get(
  '/evaluations/eligible-assets',
  authenticate,
  attachDataScope(MODULES.EVALUATIONS),
  authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.READ }),
  evaluationController.listEligibleAssets,
);
v1Router.get(
  '/evaluations',
  authenticate,
  attachDataScope(MODULES.EVALUATIONS),
  authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.READ }),
  evaluationController.listEvaluations,
);
v1Router.get(
  '/evaluations/:id',
  authenticate,
  attachDataScope(MODULES.EVALUATIONS),
  authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.READ }),
  evaluationController.getEvaluationById,
);
v1Router.post(
  '/evaluations',
  authenticate,
  attachDataScope(MODULES.EVALUATIONS),
  authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.CREATE }),
  requireStaff,
  evaluationController.scheduleEvaluation,
);
v1Router.put(
  '/evaluations/:id',
  authenticate,
  attachDataScope(MODULES.EVALUATIONS),
  authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.UPDATE }),
  requireStaff,
  evaluationController.updateEvaluation,
);
v1Router.post(
  '/evaluations/:id/start',
  authenticate,
  attachDataScope(MODULES.EVALUATIONS),
  authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.UPDATE }),
  requireStaff,
  evaluationController.markInProgress,
);
v1Router.post(
  '/evaluations/:id/complete',
  authenticate,
  attachDataScope(MODULES.EVALUATIONS),
  authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.UPDATE }),
  requireStaff,
  evaluationController.completeEvaluation,
);
v1Router.post(
  '/evaluations/:id/approve',
  authenticate,
  attachDataScope(MODULES.EVALUATIONS),
  authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.APPROVE }),
  requireStaff,
  evaluationController.approveEvaluation,
);
v1Router.post(
  '/evaluations/:id/reject',
  authenticate,
  attachDataScope(MODULES.EVALUATIONS),
  authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.REJECT }),
  requireStaff,
  evaluationController.rejectEvaluation,
);
v1Router.post(
  '/evaluations/:id/reschedule',
  authenticate,
  attachDataScope(MODULES.EVALUATIONS),
  authorize({ module: MODULES.EVALUATIONS, action: ACTIONS.UPDATE }),
  requireStaff,
  evaluationController.rescheduleEvaluation,
);

// Auctions — public browse (optional auth for myParticipation)
v1Router.get(
  '/auctions/my-owned',
  authenticate,
  attachDataScope(MODULES.ASSETS),
  authorize({ module: MODULES.ASSETS, action: ACTIONS.READ }),
  auctionController.listOwnedAuctions,
);
v1Router.get(
  '/auctions/browse/:id/owner-overview',
  authenticate,
  attachDataScope(MODULES.ASSETS),
  authorize({ module: MODULES.ASSETS, action: ACTIONS.READ }),
  auctionController.getAuctionOwnerOverview,
);
v1Router.get(
  '/auctions/browse',
  optionalAuthenticate,
  auctionController.listBrowseAuctions,
);
v1Router.get(
  '/auctions/browse/:id/participation',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.READ }),
  auctionController.getAuctionParticipation,
);
v1Router.get(
  '/auctions/browse/:id/documents/:docIndex/stream',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.READ }),
  auctionController.streamAuctionDocument,
);
v1Router.get(
  '/auctions/browse/:id/bid-drafts',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.READ }),
  bidDraftController.listBidDraftsForAuction,
);
v1Router.get(
  '/auctions/browse/:id',
  optionalAuthenticate,
  auctionController.getBrowseAuctionById,
);
v1Router.get(
  '/auctions/eligible-assets',
  authenticate,
  attachDataScope(MODULES.AUCTIONS),
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.READ }),
  auctionController.listEligibleAssetsForAuction,
);
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

// Share links
v1Router.post(
  '/auctions/:auctionId/share-links',
  authenticate,
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.UPDATE }),
  shareLinkController.createShareLink,
);
v1Router.get(
  '/auctions/:auctionId/share-links',
  authenticate,
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.READ }),
  shareLinkController.listShareLinks,
);
v1Router.delete(
  '/share-links/:id',
  authenticate,
  authorize({ module: MODULES.AUCTIONS, action: ACTIONS.UPDATE }),
  shareLinkController.revokeShareLink,
);

// Documents
mountResource(v1Router, '/documents', MODULES.DOCUMENTS, 'documents', { requireKycOnCreate: true });

// Payments
v1Router.get(
  '/payments',
  authenticate,
  attachDataScope(MODULES.PAYMENTS),
  authorize({ module: MODULES.PAYMENTS, action: ACTIONS.READ }),
  paymentController.listPayments,
);
v1Router.get(
  '/payments/:id',
  authenticate,
  attachDataScope(MODULES.PAYMENTS),
  authorize({ module: MODULES.PAYMENTS, action: ACTIONS.READ }),
  paymentController.getPaymentById,
);
v1Router.post(
  '/payments',
  authenticate,
  attachDataScope(MODULES.PAYMENTS),
  authorize({ module: MODULES.PAYMENTS, action: ACTIONS.CREATE }),
  requireKYCVerified,
  paymentController.createPayment,
);
v1Router.post(
  '/payments/:id/approve',
  authenticate,
  authorize({ module: MODULES.PAYMENTS, action: ACTIONS.APPROVE }),
  requireStaff,
  paymentController.approvePayment,
);
v1Router.post(
  '/payments/:id/reject',
  authenticate,
  authorize({ module: MODULES.PAYMENTS, action: ACTIONS.REJECT }),
  requireStaff,
  paymentController.rejectPayment,
);

// CPO
v1Router.get(
  '/cpo',
  authenticate,
  attachDataScope(MODULES.CPO),
  authorize({ module: MODULES.CPO, action: ACTIONS.READ }),
  cpoController.listCpos,
);
v1Router.get(
  '/cpo/:id',
  authenticate,
  attachDataScope(MODULES.CPO),
  authorize({ module: MODULES.CPO, action: ACTIONS.READ }),
  cpoController.getCpoById,
);
v1Router.post(
  '/cpo',
  authenticate,
  attachDataScope(MODULES.CPO),
  authorize({ module: MODULES.CPO, action: ACTIONS.CREATE }),
  requireKYCVerified,
  cpoController.createCpo,
);
v1Router.post(
  '/cpo/:id/approve',
  authenticate,
  authorize({ module: MODULES.CPO, action: ACTIONS.APPROVE }),
  requireStaff,
  cpoController.approveCpo,
);
v1Router.post(
  '/cpo/:id/reject',
  authenticate,
  authorize({ module: MODULES.CPO, action: ACTIONS.REJECT }),
  requireStaff,
  cpoController.rejectCpo,
);
v1Router.post(
  '/cpo/:id/approve-deposit',
  authenticate,
  authorize({ module: MODULES.CPO, action: ACTIONS.APPROVE }),
  requireStaff,
  cpoController.approveDeposit,
);
v1Router.post(
  '/cpo/:id/process-refund',
  authenticate,
  authorize({ module: MODULES.CPO, action: ACTIONS.UPDATE }),
  requireStaff,
  cpoController.processRefund,
);

// Bids
v1Router.get(
  '/bids/my',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.READ }),
  bidController.listMyBids,
);
v1Router.get(
  '/bids/auction/:auctionId',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.READ }),
  bidController.listBidsForAuction,
);
v1Router.get(
  '/bids',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.READ }),
  bidController.listBids,
);
v1Router.get(
  '/bids/:id',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.READ }),
  bidController.getBidById,
);
v1Router.post(
  '/bids',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.CREATE }),
  requireKYCVerified,
  bidController.placeBid,
);
v1Router.post(
  '/bids/submit-with-cpo',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.CREATE }),
  requireKYCVerified,
  bidController.submitBidWithCpo,
);
v1Router.put(
  '/bid-drafts',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.CREATE }),
  requireKYCVerified,
  bidDraftController.upsertBidDraft,
);
v1Router.delete(
  '/bid-drafts/:id',
  authenticate,
  attachDataScope(MODULES.BIDS),
  authorize({ module: MODULES.BIDS, action: ACTIONS.UPDATE }),
  requireKYCVerified,
  bidDraftController.deleteBidDraft,
);

// Winners
v1Router.get(
  '/winners',
  authenticate,
  attachDataScope(MODULES.WINNERS),
  authorize({ module: MODULES.WINNERS, action: ACTIONS.READ }),
  requireStaff,
  winnerController.listWinners,
);
v1Router.get(
  '/winners/auction/:auctionId',
  authenticate,
  attachDataScope(MODULES.WINNERS),
  authorize({ module: MODULES.WINNERS, action: ACTIONS.READ }),
  requireStaff,
  winnerController.getWinnersForAuction,
);
v1Router.get(
  '/winners/auction/:auctionId/grouped',
  authenticate,
  attachDataScope(MODULES.WINNERS),
  authorize({ module: MODULES.WINNERS, action: ACTIONS.READ }),
  requireStaff,
  winnerController.getWinnersForAuctionGrouped,
);
v1Router.get(
  '/winners/:id',
  authenticate,
  attachDataScope(MODULES.WINNERS),
  authorize({ module: MODULES.WINNERS, action: ACTIONS.READ }),
  requireStaff,
  winnerController.getWinnerById,
);
v1Router.post(
  '/winners',
  authenticate,
  attachDataScope(MODULES.WINNERS),
  authorize({ module: MODULES.WINNERS, action: ACTIONS.CREATE }),
  requireStaff,
  winnerController.selectWinner,
);
v1Router.post(
  '/winners/:id/confirm',
  authenticate,
  attachDataScope(MODULES.WINNERS),
  authorize({ module: MODULES.WINNERS, action: ACTIONS.UPDATE }),
  requireStaff,
  winnerController.confirmWinner,
);
v1Router.post(
  '/winners/:id/decline',
  authenticate,
  attachDataScope(MODULES.WINNERS),
  authorize({ module: MODULES.WINNERS, action: ACTIONS.UPDATE }),
  requireStaff,
  winnerController.declineWinner,
);
v1Router.post(
  '/winners/:id/replace',
  authenticate,
  attachDataScope(MODULES.WINNERS),
  authorize({ module: MODULES.WINNERS, action: ACTIONS.UPDATE }),
  requireStaff,
  winnerController.replaceWinner,
);

// Notifications
v1Router.get(
  '/notifications/unread-count',
  authenticate,
  authorize({ module: MODULES.NOTIFICATIONS, action: ACTIONS.READ }),
  notificationController.getUnreadCount,
);
v1Router.post(
  '/notifications/read-all',
  authenticate,
  authorize({ module: MODULES.NOTIFICATIONS, action: ACTIONS.UPDATE }),
  notificationController.markAllRead,
);
v1Router.get(
  '/notifications',
  authenticate,
  attachDataScope(MODULES.NOTIFICATIONS),
  authorize({ module: MODULES.NOTIFICATIONS, action: ACTIONS.READ }),
  notificationController.listNotifications,
);
v1Router.get(
  '/notifications/:id',
  authenticate,
  attachDataScope(MODULES.NOTIFICATIONS),
  authorize({ module: MODULES.NOTIFICATIONS, action: ACTIONS.READ }),
  notificationController.getNotificationById,
);
v1Router.post(
  '/notifications/:id/read',
  authenticate,
  authorize({ module: MODULES.NOTIFICATIONS, action: ACTIONS.UPDATE }),
  notificationController.markAsRead,
);

// Dashboard
v1Router.get(
  '/dashboard',
  authenticate,
  authorize({ module: MODULES.DASHBOARD, action: ACTIONS.READ }),
  dashboardController.getMetrics,
);
v1Router.get(
  '/dashboard/reports',
  authenticate,
  authorize({ module: MODULES.DASHBOARD, action: ACTIONS.READ }),
  dashboardController.listReports,
);
v1Router.get(
  '/dashboard/reports/export',
  authenticate,
  authorize({ module: MODULES.DASHBOARD, action: ACTIONS.EXPORT }),
  dashboardController.exportReport,
);

// Staff & roles
v1Router.get(
  '/staff/assignable-roles',
  authenticate,
  attachDataScope(MODULES.STAFF),
  authorize({ module: MODULES.STAFF, action: ACTIONS.READ }),
  requireStaff,
  staffController.listAssignableRoles,
);
v1Router.get(
  '/staff',
  authenticate,
  attachDataScope(MODULES.STAFF),
  authorize({ module: MODULES.STAFF, action: ACTIONS.READ }),
  requireStaff,
  staffController.listStaff,
);
v1Router.get(
  '/staff/:id',
  authenticate,
  attachDataScope(MODULES.STAFF),
  authorize({ module: MODULES.STAFF, action: ACTIONS.READ }),
  requireStaff,
  staffController.getStaffById,
);
v1Router.post(
  '/staff',
  authenticate,
  attachDataScope(MODULES.STAFF),
  authorize({ module: MODULES.STAFF, action: ACTIONS.CREATE }),
  requireStaff,
  staffController.createStaff,
);
v1Router.put(
  '/staff/:id',
  authenticate,
  attachDataScope(MODULES.STAFF),
  authorize({ module: MODULES.STAFF, action: ACTIONS.UPDATE }),
  requireStaff,
  staffController.updateStaff,
);
v1Router.post(
  '/staff/:id/deactivate',
  authenticate,
  attachDataScope(MODULES.STAFF),
  authorize({ module: MODULES.STAFF, action: ACTIONS.UPDATE }),
  requireStaff,
  staffController.deactivateStaff,
);
v1Router.delete(
  '/staff/:id',
  authenticate,
  attachDataScope(MODULES.STAFF),
  authorize({ module: MODULES.STAFF, action: ACTIONS.DELETE }),
  requireStaff,
  staffController.deleteStaff,
);

// Organizations
v1Router.get(
  '/organizations',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.READ }),
  requireStaff,
  organizationController.listOrganizations,
);
v1Router.get(
  '/organizations/stats',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.READ }),
  requireStaff,
  organizationController.getOrgStats,
);
v1Router.get(
  '/organizations/portal',
  authenticate,
  (req, res, next) => {
    const userType = req.auth?.identity?.userType || req.user?.user_type;
    if (userType !== 'organization') {
      return res.status(403).json({ error: 'Only organizations can access the portal' });
    }
    return next();
  },
  organizationController.getPortal,
);
v1Router.get(
  '/organizations/portal/assets',
  authenticate,
  (req, res, next) => {
    const userType = req.auth?.identity?.userType || req.user?.user_type;
    if (userType !== 'organization') {
      return res.status(403).json({ error: 'Only organizations can access the portal' });
    }
    return next();
  },
  organizationController.getPortalAssets,
);
v1Router.get(
  '/organizations/:id/active-auctions',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.READ }),
  requireStaff,
  organizationController.getOrganizationActiveAuctions,
);

// Organization <-> Auction linking
v1Router.get(
  '/organizations/:id/auction-links',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.READ }),
  requireStaff,
  organizationAuctionController.listLinkedAuctions,
);
v1Router.get(
  '/organizations/:id/available-auctions',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.READ }),
  requireStaff,
  organizationAuctionController.getAvailableAuctions,
);
v1Router.post(
  '/organizations/:id/auction-links',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.UPDATE }),
  requireStaff,
  organizationAuctionController.linkAuction,
);
v1Router.delete(
  '/organizations/:id/auction-links/:auctionId',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.UPDATE }),
  requireStaff,
  organizationAuctionController.unlinkAuction,
);

v1Router.get(
  '/organizations/:id',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.READ }),
  requireStaff,
  organizationController.getOrganizationById,
);
v1Router.post(
  '/organizations',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.CREATE }),
  requireStaff,
  organizationController.createOrganization,
);
v1Router.put(
  '/organizations/:id',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.UPDATE }),
  requireStaff,
  organizationController.updateOrganization,
);
v1Router.delete(
  '/organizations/:id',
  authenticate,
  attachDataScope(MODULES.ORGANIZATIONS),
  authorize({ module: MODULES.ORGANIZATIONS, action: ACTIONS.DELETE }),
  requireStaff,
  organizationController.deleteOrganization,
);

const roles = createResourceHandlers('roles', MODULES.ROLES);
v1Router.get(
  '/roles',
  authenticate,
  attachDataScope(MODULES.ROLES),
  authorize({ module: MODULES.ROLES, action: ACTIONS.READ }),
  requireStaff,
  roles.list,
);
v1Router.get(
  '/roles/:id',
  authenticate,
  attachDataScope(MODULES.ROLES),
  authorize({ module: MODULES.ROLES, action: ACTIONS.READ }),
  requireStaff,
  roles.getById,
);
v1Router.put(
  '/roles/:id',
  authenticate,
  attachDataScope(MODULES.ROLES),
  authorize({ module: MODULES.ROLES, action: ACTIONS.UPDATE }),
  requireStaff,
  roleController.updateRolePermissions,
);

// Audit logs (entity route before :id)
v1Router.get(
  '/audit-logs/entity/:entityType/:entityId',
  authenticate,
  attachDataScope(MODULES.ROLES),
  authorize({ module: MODULES.ROLES, action: ACTIONS.READ }),
  requireStaff,
  auditController.listAuditLogsForEntity,
);
v1Router.get(
  '/audit-logs',
  authenticate,
  attachDataScope(MODULES.ROLES),
  authorize({ module: MODULES.ROLES, action: ACTIONS.READ }),
  requireStaff,
  auditController.listAuditLogs,
);
v1Router.get(
  '/audit-logs/:id',
  authenticate,
  attachDataScope(MODULES.ROLES),
  authorize({ module: MODULES.ROLES, action: ACTIONS.READ }),
  requireStaff,
  auditController.getAuditLogById,
);

// Settings
v1Router.get(
  '/settings',
  authenticate,
  authorize({ module: MODULES.SETTINGS, action: ACTIONS.READ }),
  requireStaff,
  settingsController.getSettings,
);
v1Router.put(
  '/settings',
  authenticate,
  authorize({ module: MODULES.SETTINGS, action: ACTIONS.UPDATE }),
  requireStaff,
  settingsController.updateSettings,
);

// Session introspection
v1Router.get('/auth/me', authenticate, authController.getMe);
v1Router.patch('/auth/me', authenticate, validateUpdateProfileBody, authController.updateMe);

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
