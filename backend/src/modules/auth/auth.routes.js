import { Router } from 'express';
import { login, register, verifyOTP, resendOTP } from './auth.controller.js';
import {
  validateLoginBody,
  validateRegistrationBody,
  validateOTPBody,
  validateResendOTPBody,
} from './auth.validation.js';

const authRouter = Router();

authRouter.post('/login', validateLoginBody, login);
authRouter.post('/register', validateRegistrationBody, register);
authRouter.post('/verify-otp', validateOTPBody, verifyOTP);
authRouter.post('/resend-otp', validateResendOTPBody, resendOTP);

export default authRouter;
