import { Op, fn, col } from 'sequelize';
import { Auction } from '../models/auction.model.js';
import { Payment } from '../models/payment.model.js';
import { KYCVerification } from '../models/kyc.model.js';
import { Asset } from '../models/asset.model.js';
import { dashboardService } from './dashboard.service.js';

const REPORT_DEFINITIONS = Object.freeze([
  {
    id: 'auction_summary',
    title: 'Auction Summary',
    description: 'Auction counts by status and total reserve value',
  },
  {
    id: 'payment_summary',
    title: 'Payment Summary',
    description: 'Payment totals by status and method',
  },
  {
    id: 'kyc_summary',
    title: 'KYC Summary',
    description: 'KYC approval counts and status breakdown',
  },
  {
    id: 'asset_pipeline',
    title: 'Asset Pipeline',
    description: 'Asset counts per workflow status',
  },
]);

function buildDateRangeWhere(dateFrom, dateTo, column = 'created_at') {
  if (!dateFrom && !dateTo) return {};
  const range = {};
  if (dateFrom) range[Op.gte] = new Date(dateFrom);
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    range[Op.lte] = end;
  }
  return { [column]: range };
}

async function generateAuctionSummaryReport({ dateFrom, dateTo } = {}) {
  const where = { deleted_at: null, ...buildDateRangeWhere(dateFrom, dateTo) };
  const rows = await Auction.findAll({
    where,
    attributes: ['status', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('reserve_price')), 'totalReserve']],
    group: ['status'],
    raw: true,
  });

  return {
    reportType: 'auction_summary',
    rows: rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
      totalReserve: Number(row.totalReserve) || 0,
    })),
  };
}

async function generatePaymentSummaryReport({ dateFrom, dateTo } = {}) {
  const where = { deleted_at: null, ...buildDateRangeWhere(dateFrom, dateTo) };
  const rows = await Payment.findAll({
    where,
    attributes: [
      'status',
      'payment_method',
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('amount')), 'totalAmount'],
    ],
    group: ['status', 'payment_method'],
    raw: true,
  });

  return {
    reportType: 'payment_summary',
    rows: rows.map((row) => ({
      status: row.status,
      paymentMethod: row.payment_method,
      count: Number(row.count),
      totalAmount: Number(row.totalAmount) || 0,
    })),
  };
}

async function generateKycSummaryReport({ dateFrom, dateTo } = {}) {
  const where = { deleted_at: null, ...buildDateRangeWhere(dateFrom, dateTo) };
  const rows = await KYCVerification.findAll({
    where,
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  return {
    reportType: 'kyc_summary',
    rows: rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    })),
  };
}

async function generateAssetPipelineReport({ dateFrom, dateTo } = {}) {
  const where = { deleted_at: null, ...buildDateRangeWhere(dateFrom, dateTo) };
  const rows = await Asset.findAll({
    where,
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status'],
    raw: true,
  });

  return {
    reportType: 'asset_pipeline',
    rows: rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    })),
  };
}

function rowsToCsv(report) {
  if (!report.rows?.length) {
    return 'No data\n';
  }

  const headers = Object.keys(report.rows[0]);
  const lines = [headers.join(',')];
  report.rows.forEach((row) => {
    lines.push(headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
  });
  return `${lines.join('\n')}\n`;
}

export async function listReports({ dateFrom, dateTo, reportType } = {}) {
  const summaries = await Promise.all(
    REPORT_DEFINITIONS.map(async (def) => {
      let summary = null;
      if (!reportType || reportType === def.id) {
        if (def.id === 'auction_summary') {
          summary = await generateAuctionSummaryReport({ dateFrom, dateTo });
        } else if (def.id === 'payment_summary') {
          summary = await generatePaymentSummaryReport({ dateFrom, dateTo });
        } else if (def.id === 'kyc_summary') {
          summary = await generateKycSummaryReport({ dateFrom, dateTo });
        } else if (def.id === 'asset_pipeline') {
          summary = await generateAssetPipelineReport({ dateFrom, dateTo });
        }
      }
      return {
        ...def,
        summary: summary?.rows ?? null,
      };
    }),
  );

  return {
    reports: summaries,
    dashboardSnapshot: await dashboardService.getGlobalMetrics(),
    filters: { dateFrom: dateFrom ?? null, dateTo: dateTo ?? null, reportType: reportType ?? null },
  };
}

export async function exportReport(reportType, format = 'csv', filters = {}) {
  const generators = {
    auction_summary: generateAuctionSummaryReport,
    payment_summary: generatePaymentSummaryReport,
    kyc_summary: generateKycSummaryReport,
    asset_pipeline: generateAssetPipelineReport,
  };

  const generator = generators[reportType];
  if (!generator) {
    return { error: 'UNKNOWN_REPORT_TYPE', buffer: null, filename: null };
  }

  const report = await generator(filters);
  const normalizedFormat = String(format).toLowerCase();

  if (normalizedFormat === 'csv') {
    const csv = rowsToCsv(report);
    const buffer = Buffer.from(csv, 'utf8');
    return {
      buffer,
      filename: `${reportType}_${Date.now()}.csv`,
      contentType: 'text/csv',
      report,
    };
  }

  return {
    buffer: Buffer.from(JSON.stringify(report, null, 2), 'utf8'),
    filename: `${reportType}_${Date.now()}.json`,
    contentType: 'application/json',
    report,
  };
}

export const reportService = Object.freeze({
  listReports,
  exportReport,
});

export default reportService;
