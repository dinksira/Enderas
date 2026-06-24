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

  console.error('[error]', err);

  return sendError(res, {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: res.__('generic.server_error'),
  });
}

export default errorMiddleware;
