import {
  loginWithCredentials,
  completeLogin,
  register as registerUser,
  verifyOTP as verifyUserOTP,
  resendOTP as resendUserOTP,
  requestPasswordReset,
  resetPasswordWithOtp,
  verifyPasswordResetOtpCode,
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
      nationalIdNumber,
      nationalId,
      tinNumber,
    } = req.body;

    const result = await registerUser({
      firstName,
      lastName,
      mobileNumber,
      email,
      password,
      userType,
      organizationName,
      nationalIdNumber,
      nationalId,
      tinNumber,
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

export async function forgotPassword(req, res, next) {
  try {
    const mobileNumber = req.body.mobileNumber ?? req.body.mobile_number;
    const result = await requestPasswordReset(mobileNumber);

    return sendSuccess(res, {
      ...result,
      message: 'If an account exists for this number, a reset code has been sent.',
    });
  } catch (error) {
    return next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const mobileNumber = req.body.mobileNumber ?? req.body.mobile_number;
    const { otp, newPassword } = req.body;

    await resetPasswordWithOtp(mobileNumber, otp, newPassword);

    return sendSuccess(res, { message: 'Password reset successful. You can sign in with your new password.' });
  } catch (error) {
    return next(error);
  }
}

export async function verifyResetOtp(req, res, next) {
  try {
    const mobileNumber = req.body.mobileNumber ?? req.body.mobile_number;
    const { otp } = req.body;

    await verifyPasswordResetOtpCode(mobileNumber, otp);

    return sendSuccess(res, { valid: true });
  } catch (error) {
    return next(error);
  }
}

export const authController = Object.freeze({
  login,
  register,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
});

export default authController;
