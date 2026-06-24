/**
 * Standard API success envelope.
 * @param {import('express').Response} res
 * @param {unknown} data
 * @param {number} [statusCode]
 */
export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Standard API error envelope.
 * @param {import('express').Response} res
 * @param {{ statusCode?: number, code?: string, message?: string, error?: unknown }} payload
 */
export function sendError(res, payload) {
  return res.status(payload.statusCode || 500).json({
    success: false,
    code: payload.code || 'INTERNAL_ERROR',
    message: payload.message || 'An unexpected error occurred',
    ...(payload.error ? { error: payload.error } : {}),
  });
}

export default {
  sendSuccess,
  sendError,
};
