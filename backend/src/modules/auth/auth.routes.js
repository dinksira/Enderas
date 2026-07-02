import { Router } from 'express';
import { login, register, verifyOTP, resendOTP, forgotPassword, resetPassword, verifyResetOtp } from './auth.controller.js';
import {
  validateLoginBody,
  validateRegistrationBody,
  validateOTPBody,
  validateResendOTPBody,
  validateForgotPasswordBody,
  validateResetPasswordBody,
  validateVerifyResetOtpBody,
} from './auth.validation.js';

const authRouter = Router();

authRouter.post('/login', validateLoginBody, login);
authRouter.post('/register', validateRegistrationBody, register);
authRouter.post('/verify-otp', validateOTPBody, verifyOTP);
authRouter.post('/resend-otp', validateResendOTPBody, resendOTP);
authRouter.post('/forgot-password', validateForgotPasswordBody, forgotPassword);
authRouter.post('/verify-reset-otp', validateVerifyResetOtpBody, verifyResetOtp);
authRouter.post('/reset-password', validateResetPasswordBody, resetPassword);

export default authRouter;
