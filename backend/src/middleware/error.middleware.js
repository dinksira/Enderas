import { AppError } from '../utils/error.util.js';
import { sendError } from '../utils/response.util.js';

export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return res.status(err.statusCode).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: res.__('auth.invalid_credentials'),
      });
    }

    return sendError(res, {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
    });
  }

  if (err?.name === 'ValidationError') {
    return sendError(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: err.message,
    });
  }

  if (err?.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large'
      : err.message;
    return sendError(res, {
      statusCode: 400,
      code: 'UPLOAD_ERROR',
      message,
    });
  }

  if (err?.message === 'Invalid file type') {
    return sendError(res, {
      statusCode: 400,
      code: 'INVALID_FILE_TYPE',
      message: 'File type not allowed. Use JPEG, PNG, GIF, or PDF.',
    });
  }

  if (err?.name === 'SequelizeUniqueConstraintError') {
    const field = err?.errors?.[0]?.path;
    const duplicateMessages = {
      email: 'Email address already registered',
      mobile_number: 'Mobile number already registered',
      employee_id: 'Employee ID already in use',
    };
    const duplicateCodes = {
      email: 'DUPLICATE_EMAIL',
      mobile_number: 'DUPLICATE_MOBILE',
      employee_id: 'DUPLICATE_EMPLOYEE_ID',
    };

    return sendError(res, {
      statusCode: 400,
      code: field ? (duplicateCodes[field] || 'DUPLICATE_ENTRY') : 'DUPLICATE_ENTRY',
      message: duplicateMessages[field] || 'A record with this value already exists',
    });
  }

  console.error('[error]', err);

  return sendError(res, {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: res.__('generic.server_error'),
  });
}

export default errorMiddleware;
