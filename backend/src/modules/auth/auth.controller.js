import {
  loginWithCredentials,
  completeLogin,
  refreshSession as refreshAuthSession,
  register as registerUser,
  verifyOTP as verifyUserOTP,
  resendOTP as resendUserOTP,
  requestPasswordReset,
  resetPasswordWithOtp,
  verifyPasswordResetOtpCode,
  updateMe as updateMeService,
  changePassword as changePasswordService,
  updateAvatar as updateAvatarService,
} from './auth.service.js';
import { sendSuccess } from '../../utils/response.util.js';
import { InvalidCredentialsError, AppError, UnauthorizedError } from '../../utils/error.util.js';
import { logLogin } from '../../services/audit.service.js';
import { userService } from '../../services/user.service.js';
import { authorizationPermissionService } from '../../core/authorization/permission.service.js';

export async function login(req, res, next) {
  const mobileNumber = req.body?.mobile_number ?? req.body?.phoneNumber;
  const password = req.body?.password;

  try {
    if (!mobileNumber || !password) {
      throw new InvalidCredentialsError();
    }

    const { userId, requiresVerification, mobileNumber: verifiedMobile } =
      await loginWithCredentials(mobileNumber, password);

    // Correct credentials on an unverified account: re-issue the OTP and route
    // the client to the verification screen instead of failing the sign-in.
    if (requiresVerification) {
      const targetMobile = verifiedMobile ?? mobileNumber;
      const otpInfo = await resendUserOTP(targetMobile);

      return sendSuccess(res, {
        requiresOTPVerification: true,
        mobileNumber: targetMobile,
        otpExpiresIn: otpInfo.otpExpiresIn,
        otpExpiresAt: otpInfo.otpExpiresAt,
        ...(otpInfo.devOtp ? { devOtp: otpInfo.devOtp } : {}),
        message: 'Please verify your phone number to finish signing in.',
      });
    }

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

export async function refreshSession(req, res, next) {
  try {
    const session = await refreshAuthSession(req.body.refreshToken, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
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
    return next(error);
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

function serializeAuthMe(principal) {
  return {
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
      moduleActions: principal.moduleActions ?? {},
    },
    identity: {
      displayName: principal.displayName,
      mobileNumber: principal.mobileNumber,
      email: principal.email,
      firstName: principal.firstName ?? null,
      lastName: principal.lastName ?? null,
      organizationName: principal.organizationName ?? null,
      profilePicture: principal.profilePicture ?? null,
      avatarUrl: principal.avatarUrl ?? null,
      preferredLanguage: principal.preferredLanguage ?? null,
      isStaff: principal.isStaff,
    },
  };
}

export async function getMe(req, res, next) {
  try {
    const principal = await authorizationPermissionService.resolvePrincipal(req.user.id);
    return sendSuccess(res, serializeAuthMe(principal));
  } catch (error) {
    return next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const profile = await userService.updateMyProfile(req.user.id, {
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      organizationName: req.body.organizationName,
      preferredLanguage: req.body.preferredLanguage,
      profilePicture: req.body.profilePicture ?? req.body.profile_picture,
    });

    await authorizationPermissionService.invalidateUserPermissions(req.user.id);
    const principal = await authorizationPermissionService.resolvePrincipal(req.user.id);

    return sendSuccess(res, {
      ...serializeAuthMe(principal),
      profile,
    });
  } catch (error) {
    return next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new UnauthorizedError());
    }

    const { currentPassword, newPassword } = req.body;
    const result = await changePasswordService(userId, currentPassword, newPassword);
    return sendSuccess(res, { ...result, message: 'Password changed successfully. Please log in again.' });
  } catch (error) {
    return next(error);
  }
}

export async function updateAvatar(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new UnauthorizedError());
    }

    const result = await updateAvatarService(userId, req.file);
    return sendSuccess(res, result);
  } catch (error) {
    return next(error);
  }
}
  } catch (error) {
    return next(error);
  }
}

export const authController = Object.freeze({
  login,
  refreshSession,
  register,
  verifyOTP,
  resendOTP,
  forgotPassword,
  resetPassword,
  verifyResetOtp,
  getMe,
  updateMe,
  changePassword,
  updateAvatar,
});

export default authController;
