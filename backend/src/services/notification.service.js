/**
 * Notification delivery — KYC events.
 * SMS/email/in-app integrations are wired when external providers are configured.
 */

/**
 * @param {string} userId
 */
export async function sendKYCSubmitted(userId) {
  console.info('[notification.service] KYC submitted notification queued for user:', userId);
  return { queued: true, userId, type: 'kyc_submitted' };
}

/**
 * @param {string} userId
 */
export async function sendKYCApproved(userId) {
  console.info('[notification.service] KYC approved notification queued for user:', userId);
  return { queued: true, userId, type: 'kyc_approved' };
}

/**
 * @param {string} userId
 * @param {string} rejectionReason
 */
export async function sendKYCRejected(userId, rejectionReason) {
  console.info('[notification.service] KYC rejected notification queued for user:', userId, rejectionReason);
  return { queued: true, userId, type: 'kyc_rejected' };
}

export const notificationService = Object.freeze({
  sendKYCSubmitted,
  sendKYCApproved,
  sendKYCRejected,
});

export default notificationService;
