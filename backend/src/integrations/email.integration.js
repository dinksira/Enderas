import { env } from '../config/env.config.js';

/**
 * Email integration layer.
 *
 * Currently logs to console. To use a real provider (SMTP, SendGrid, Mailgun, etc.),
 * replace the `send` function implementation below and add the corresponding
 * npm package + env vars.
 */

const FROM_ADDRESS = optionalEnv('EMAIL_FROM', 'noreply@enderas.et');
const FROM_NAME = optionalEnv('EMAIL_FROM_NAME', 'Enderas Auction System');

function optionalEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

/**
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body
 * @returns {Promise<{ messageId: string, accepted: string[] }>}
 */
export async function sendEmail({ to, subject, text, html }) {
  if (env.isProduction) {
    // TODO: Replace with real provider integration
    // e.g. nodemailer, SendGrid API, Mailgun API, etc.
  }

  console.log('[EMAIL]', {
    from: `${FROM_NAME} <${FROM_ADDRESS}>`,
    to,
    subject,
    text: text?.slice(0, 200),
    html: html ? `${html.slice(0, 100)}...` : undefined,
  });

  return {
    messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    accepted: [to],
  };
}

export async function sendShareLinkEmail({ to, organizationName, auctionTitle, trackUrl, password }) {
  const subject = `You have been granted access to track auction "${auctionTitle}"`;

  let text = `Hello ${organizationName},\n\n`;
  text += `You have been granted access to track the auction "${auctionTitle}".\n\n`;
  text += `Click the link below to view the tracking dashboard:\n${trackUrl}\n\n`;
  if (password) {
    text += `Your access password: ${password}\n\n`;
  }
  text += `This link is for tracking purposes only. No bidding or purchasing actions can be performed.\n`;
  text += `\nPowered by Enderas Auction System`;

  let html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #0a0f1e;">Auction Tracking Access</h2>
      <p>Hello <strong>${organizationName}</strong>,</p>
      <p>You have been granted access to track the auction <strong>"${auctionTitle}"</strong>.</p>
      <p>
        <a href="${trackUrl}"
           style="display: inline-block; padding: 12px 28px; background: #0a0f1e; color: #fff;
                  text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0;">
          View Auction Tracking Dashboard
        </a>
      </p>`;

  if (password) {
    html += `<p>Your access password: <strong>${password}</strong></p>`;
  }

  html += `
      <p style="color: #6c757d; font-size: 13px;">This link is for tracking purposes only. No bidding or purchasing actions can be performed.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">Powered by Enderas Auction System</p>
    </div>`;

  return sendEmail({ to, subject, text, html });
}

export default { sendEmail, sendShareLinkEmail };
