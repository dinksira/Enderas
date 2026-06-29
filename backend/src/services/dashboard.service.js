import { Op, fn, col } from 'sequelize';
import { User } from '../models/user.model.js';
import { KYCVerification } from '../models/kyc.model.js';
import { Asset } from '../models/asset.model.js';
import { Evaluation } from '../models/evaluation.model.js';
import { Auction } from '../models/auction.model.js';
import { Bid } from '../models/bid.model.js';
import { Payment } from '../models/payment.model.js';
import { Cpo } from '../models/cpo.model.js';
import { Winner } from '../models/winner.model.js';
import { normalizeEndUserRoleCode } from '../constants/end-user-role.constants.js';

const BIDDER_METRIC_KEYS = Object.freeze(['bids', 'payments', 'cpo', 'assets']);

const ROLE_METRIC_KEYS = Object.freeze({
  super_admin: ['users', 'kyc', 'assets', 'evaluations', 'auctions', 'bids', 'payments', 'cpo', 'winners'],
  evaluation_officer: ['assets', 'evaluations'],
  finance_officer: ['payments', 'cpo'],
  auction_manager: ['auctions', 'bids', 'winners', 'cpo'],
  customer_service_officer: ['users', 'kyc', 'assets', 'cpo'],
  bidder: BIDDER_METRIC_KEYS,
});

async function countUsersByStatus() {
  const rows = await User.findAll({
    where: { deleted_at: null },
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  const counts = { total: 0, active: 0, pending: 0, kyc_pending: 0, kyc_under_review: 0, kyc_rejected: 0, suspended: 0 };
  rows.forEach((row) => {
    const n = Number(row.count);
    counts.total += n;
    if (counts[row.status] !== undefined) {
      counts[row.status] = n;
    }
  });
  return counts;
}

async function countKycByTab() {
  const [all, pending, underReview, approved, rejected] = await Promise.all([
    KYCVerification.count(),
    KYCVerification.count({ where: { status: 'pending', under_review_at: null } }),
    KYCVerification.count({ where: { status: 'pending', under_review_at: { [Op.ne]: null } } }),
    KYCVerification.count({ where: { status: 'approved' } }),
    KYCVerification.count({ where: { status: 'rejected' } }),
  ]);
  return { all, pending, under_review: underReview, approved, rejected };
}

async function countAssetsByStatus() {
  const rows = await Asset.findAll({
    where: { deleted_at: null },
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  const counts = {
    pending_review: 0,
    approved: 0,
    rejected: 0,
    under_evaluation: 0,
    evaluated: 0,
    in_auction: 0,
    sold: 0,
    total: 0,
  };

  rows.forEach((row) => {
    const n = Number(row.count);
    counts.total += n;
    if (counts[row.status] !== undefined) {
      counts[row.status] = n;
    }
  });
  return counts;
}

async function countEvaluationsByStatus() {
  const rows = await Evaluation.findAll({
    where: { deleted_at: null },
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  const counts = { scheduled: 0, in_progress: 0, completed: 0, approved: 0, rejected: 0, total: 0 };
  rows.forEach((row) => {
    const n = Number(row.count);
    counts.total += n;
    if (counts[row.status] !== undefined) {
      counts[row.status] = n;
    }
  });
  return counts;
}

async function countAuctionsByStatus() {
  const rows = await Auction.findAll({
    where: { deleted_at: null },
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  const counts = {
    draft: 0,
    pending_approval: 0,
    published: 0,
    suspended: 0,
    closed: 0,
    cancelled: 0,
    total: 0,
  };

  rows.forEach((row) => {
    const n = Number(row.count);
    counts.total += n;
    if (counts[row.status] !== undefined) {
      counts[row.status] = n;
    }
  });

  return {
    ...counts,
    active: counts.published,
    pending: counts.draft + counts.pending_approval,
  };
}

async function countBidsToday() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [today, total] = await Promise.all([
    Bid.count({ where: { submitted_at: { [Op.gte]: startOfDay } } }),
    Bid.count(),
  ]);

  return { today, total };
}

async function countPaymentsPending() {
  const [pending, approved, rejected, total] = await Promise.all([
    Payment.count({ where: { status: 'pending', deleted_at: null } }),
    Payment.count({ where: { status: 'approved', deleted_at: null } }),
    Payment.count({ where: { status: 'rejected', deleted_at: null } }),
    Payment.count({ where: { deleted_at: null } }),
  ]);
  return { pending, approved, rejected, total };
}

async function countCposPending() {
  const [pending, approved, rejected, total] = await Promise.all([
    Cpo.count({ where: { status: 'pending', deleted_at: null } }),
    Cpo.count({ where: { status: 'approved', deleted_at: null } }),
    Cpo.count({ where: { status: 'rejected', deleted_at: null } }),
    Cpo.count({ where: { deleted_at: null } }),
  ]);
  return { pending, approved, rejected, total };
}

async function countWinnersPending() {
  const [pendingConfirmation, confirmed, declined, total] = await Promise.all([
    Winner.count({ where: { status: 'pending_confirmation', deleted_at: null } }),
    Winner.count({ where: { status: 'confirmed', deleted_at: null } }),
    Winner.count({ where: { status: 'declined', deleted_at: null } }),
    Winner.count({ where: { deleted_at: null } }),
  ]);
  return { pending_confirmation: pendingConfirmation, confirmed, declined, total };
}

async function getGlobalMetrics() {
  const [users, kyc, assets, evaluations, auctions, bids, payments, cpo, winners] = await Promise.all([
    countUsersByStatus(),
    countKycByTab(),
    countAssetsByStatus(),
    countEvaluationsByStatus(),
    countAuctionsByStatus(),
    countBidsToday(),
    countPaymentsPending(),
    countCposPending(),
    countWinnersPending(),
  ]);

  return { users, kyc, assets, evaluations, auctions, bids, payments, cpo, winners };
}

function serializeMetricsBundle(counts, roleCode) {
  const normalizedRoleCode = normalizeEndUserRoleCode(roleCode);
  const allowed = ROLE_METRIC_KEYS[normalizedRoleCode] || ROLE_METRIC_KEYS.bidder;
  const metrics = {};

  allowed.forEach((key) => {
    if (counts[key]) {
      metrics[key] = counts[key];
    }
  });

  return metrics;
}

export async function getMetricsForRole(roleCode) {
  const allCounts = await getGlobalMetrics();
  return {
    roleCode,
    metrics: serializeMetricsBundle(allCounts, roleCode),
    generatedAt: new Date().toISOString(),
  };
}

export const dashboardService = Object.freeze({
  getMetricsForRole,
  getGlobalMetrics,
  countUsersByStatus,
  countKycByTab,
  countAssetsByStatus,
  countEvaluationsByStatus,
  countAuctionsByStatus,
  countBidsToday,
  countPaymentsPending,
  countCposPending,
  countWinnersPending,
});

export default dashboardService;
