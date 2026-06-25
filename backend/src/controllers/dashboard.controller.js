import { sendSuccess } from '../utils/response.util.js';
import { dashboardService } from '../services/dashboard.service.js';
import { reportService } from '../services/report.service.js';

export async function getMetrics(req, res, next) {
  try {
    const roleCode = req.user?.roleCode || 'bidder';
    const result = await dashboardService.getMetricsForRole(roleCode);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function listReports(req, res, next) {
  try {
    const { dateFrom, dateTo, reportType } = req.query;
    const result = await reportService.listReports({ dateFrom, dateTo, reportType });
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function exportReport(req, res, next) {
  try {
    const { reportType, format, dateFrom, dateTo } = req.query;
    if (!reportType) {
      return res.status(400).json({
        success: false,
        code: 'REPORT_TYPE_REQUIRED',
        message: 'reportType query parameter is required',
      });
    }

    const result = await reportService.exportReport(reportType, format || 'csv', { dateFrom, dateTo });

    if (result.error) {
      return res.status(400).json({
        success: false,
        code: result.error,
        message: 'Unknown report type',
      });
    }

    if (req.query.download === 'false') {
      return sendSuccess(res, {
        filename: result.filename,
        contentType: result.contentType,
        report: result.report,
      });
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  } catch (error) {
    return next(error);
  }
}

export const dashboardController = Object.freeze({
  getMetrics,
  listReports,
  exportReport,
});

export default dashboardController;
