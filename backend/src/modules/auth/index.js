export { authService, aggregateIdentity, loginWithCredentials, completeLogin, refreshSession, register, verifyOTP, resendOTP } from './auth.service.js';
export { login, refreshSession as refreshAuthSession, register, verifyOTP, resendOTP } from './auth.controller.js';
export { default as authRouter } from './auth.routes.js';
export { default } from './auth.service.js';
