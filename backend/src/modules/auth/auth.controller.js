import {
  loginWithCredentials,
  completeLogin,
  register as registerUser,
  verifyOTP as verifyUserOTP,
  resendOTP as resendUserOTP,
} from './auth.service.js';
import { sendSuccess } from '../../utils/response.util.js';
import { InvalidCredentialsError, AppError } from '../../utils/error.util.js';
import { logLogin } from '../../services/audit.service.js';

export async function login(req, res, next) {
  const mobileNumber = req.body?.mobile_number ?? req.body?.phoneNumber;
  const password = req.body?.password;

  try {
    if (!mobileNumber || !password) {
      throw new InvalidCredentialsError();
    }

    const userId = await loginWithCredentials(mobileNumber, password);

    const session = await completeLogin(userId, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    await logLogin(req, userId, {
      roleCode: session.authz?.roleCode,
      isStaff: session.identity?.isStaff,
    });

    return sendSuccess(res, {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      session: session.session,
      identity: session.identity,
      authz: session.authz,
      user: session.user,
    });
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      return next(error);
    }

    if (error instanceof AppError && error.statusCode < 500) {
      return next(error);
    }

    console.error('[Login Crash Error]:', error);

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: res.__('generic.server_error'),
    });
  }
}

export async function register(req, res, next) {
  try {
    const {
      firstName,
      lastName,
      mobileNumber,
      email,
      password,
      userType = 'individual',
      organizationName,
    } = req.body;

    const result = await registerUser({
      firstName,
      lastName,
      mobileNumber,
      email,
      password,
      userType,
      organizationName,
    });

    return sendSuccess(res, {
      ...result,
      message: 'Registration successful. Please verify your phone number.',
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyOTP(req, res, next) {
  try {
    const mobileNumber = req.body.mobileNumber ?? req.body.mobile_number;
    const { otp } = req.body;

    const result = await verifyUserOTP(mobileNumber, otp);

    await logLogin(req, result.identity?.userId || result.user?.id, {
      roleCode: result.authz?.roleCode,
      isStaff: result.identity?.isStaff,
      action: 'otp_verified_login',
    });

    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}

export async function resendOTP(req, res, next) {
  try {
    const mobileNumber = req.body.mobileNumber ?? req.body.mobile_number;

    const result = await resendUserOTP(mobileNumber);

    return sendSuccess(res, { ...result, message: 'OTP resent successfully' });
  } catch (error) {
    return next(error);
  }
}

export const authController = Object.freeze({
  login,
  register,
  verifyOTP,
  resendOTP,
});

export default authController;
