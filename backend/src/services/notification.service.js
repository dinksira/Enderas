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

/**
 * @param {string} userId
 */
export async function sendAssetApproved(userId) {
  console.info('[notification.service] Asset approved notification queued for user:', userId);
  return { queued: true, userId, type: 'asset_approved' };
}

/**
 * @param {string} userId
 * @param {string} rejectionReason
 */
export async function sendAssetRejected(userId, rejectionReason) {
  console.info('[notification.service] Asset rejected notification queued for user:', userId, rejectionReason);
  return { queued: true, userId, type: 'asset_rejected' };
}

export const notificationService = Object.freeze({
  sendKYCSubmitted,
  sendKYCApproved,
  sendKYCRejected,
  sendAssetApproved,
  sendAssetRejected,
});

export default notificationService;
