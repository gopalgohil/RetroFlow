import env from '../config/env.js';

/**
 * Brevo (Sendinblue) Transactional Email Service
 * Communicates via standard HTTPS REST API (Port 443) - 100% reliable on Render & Cloud platforms.
 */
class EmailService {
  /**
   * Sends transactional email
   * @param {Object} options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.htmlContent - HTML body content
   * @returns {Promise<Object>}
   */
  async sendEmail({ to, subject, htmlContent }) {
    const apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
    const senderEmail = env.BREVO_SENDER_EMAIL || 'support@retroflow.app';
    const senderName = env.BREVO_SENDER_NAME || 'RetroFlow';

    // Development fallback simulation if API key is not yet set
    if (!apiKey || apiKey === 'your_brevo_api_key_here') {
      console.warn('\n======================================================');
      console.warn('⚠️ [Brevo Simulation] BREVO_API_KEY is not configured in server/.env');
      console.warn(`📧 Intended recipient: ${to}`);
      console.warn(`📝 Subject: ${subject}`);
      console.warn('======================================================\n');
      return { success: true, simulated: true };
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Brevo Error Response]', data);
        throw new Error(data.message || 'Failed to dispatch email through Brevo');
      }

      console.log(`[Brevo] ✅ Email delivered to ${to} (MessageId: ${data.messageId})`);
      return { success: true, messageId: data.messageId };
    } catch (error) {
      console.error(`[Brevo Error] Delivery failure to ${to}:`, error.message);
      throw error;
    }
  }

  /**
   * Helper to wrap template contents in a robust mobile-first email layout
   */
  _wrapEmail({ title, bodyHtml }) {
    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title || 'RetroFlow'}</title>
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }

    /* Mobile media queries */
    @media only screen and (max-width: 600px) {
      .outer-td {
        padding: 12px 8px !important;
      }
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 12px !important;
      }
      .email-card-content {
        padding: 22px 16px !important;
      }
      .retro-card-padding {
        padding: 16px 14px !important;
      }
      .email-btn {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
        text-align: center !important;
        padding: 14px 16px !important;
        font-size: 15px !important;
      }
      .main-heading {
        font-size: 19px !important;
        line-height: 25px !important;
      }
      .session-heading {
        font-size: 16px !important;
        line-height: 22px !important;
      }
      .otp-code {
        font-size: 28px !important;
        letter-spacing: 6px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td align="center" class="outer-td" style="padding: 28px 12px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="520">
        <tr>
        <td align="center" valign="top" width="520">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <tr>
            <td class="email-card-content" style="padding: 30px 26px;">
              <!-- Logo Header -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 22px;">
                <tr>
                  <td style="background-color: #4f46e5; color: #ffffff; font-weight: 800; font-size: 13px; padding: 5px 9px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1;">
                    RF
                  </td>
                  <td style="padding-left: 8px; font-size: 19px; font-weight: 800; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.3px;">
                    RetroFlow
                  </td>
                  <td style="padding-left: 6px;">
                    <span style="display: inline-block; font-size: 10px; font-weight: 800; color: #4f46e5; background-color: #eef2ff; border: 1px solid #c7d2fe; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Workspace</span>
                  </td>
                </tr>
              </table>

              <!-- Main Dynamic Content -->
              ${bodyHtml}

              <!-- Common Footer -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px; border-top: 1px solid #f1f5f9;">
                <tr>
                  <td align="center" style="padding-top: 18px;">
                    <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      &copy; ${new Date().getFullYear()} RetroFlow Inc. Continuous Improvement for Modern Agile Teams.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Generates a modern responsive HTML template for OTP verification emails
   */
  getOtpTemplate(otpCode, recipientName = 'Agile Teammate') {
    const bodyHtml = `
      <h1 class="main-heading" style="font-size: 20px; line-height: 26px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
        Password Reset Verification
      </h1>
      <p style="font-size: 14px; line-height: 22px; color: #334155; margin: 0 0 12px 0;">
        Hello <strong>${recipientName}</strong>,
      </p>
      <p style="font-size: 14px; line-height: 22px; color: #334155; margin: 0 0 20px 0;">
        We received a request to reset your RetroFlow workspace password. Enter the 6-digit verification code below:
      </p>

      <!-- OTP Code Box -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #eef2ff; border: 2px dashed #6366f1; border-radius: 12px;">
        <tr>
          <td align="center" style="padding: 20px 12px;">
            <span class="otp-code" style="font-size: 34px; font-family: 'Courier New', monospace; font-weight: 800; letter-spacing: 8px; color: #4338ca; display: inline-block;">
              ${otpCode}
            </span>
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 16px 0 0 0;">
        ⏱ This code is valid for <strong>10 minutes</strong>. If you did not initiate this request, no action is needed — your account is safe.
      </p>
    `;
    return this._wrapEmail({ title: 'Password Reset - RetroFlow', bodyHtml });
  }

  /**
   * Generates a modern responsive HTML template for Signup Email Verification
   */
  getSignupVerificationTemplate(otpCode, recipientName = 'Agile Teammate') {
    const bodyHtml = `
      <h1 class="main-heading" style="font-size: 20px; line-height: 26px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0;">
        Verify Your Email Address
      </h1>
      <p style="font-size: 14px; line-height: 22px; color: #334155; margin: 0 0 12px 0;">
        Welcome to RetroFlow, <strong>${recipientName}</strong>! 🎉
      </p>
      <p style="font-size: 14px; line-height: 22px; color: #334155; margin: 0 0 20px 0;">
        To complete your account registration and activate your workspace, please enter this 6-digit verification code:
      </p>

      <!-- OTP Code Box -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #eef2ff; border: 2px dashed #6366f1; border-radius: 12px;">
        <tr>
          <td align="center" style="padding: 20px 12px;">
            <span class="otp-code" style="font-size: 34px; font-family: 'Courier New', monospace; font-weight: 800; letter-spacing: 8px; color: #4338ca; display: inline-block;">
              ${otpCode}
            </span>
          </td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 16px 0 0 0;">
        ⏱ This code is valid for <strong>10 minutes</strong>. Once verified, you will be able to log in to your account.
      </p>
    `;
    return this._wrapEmail({ title: 'Verify Your Email - RetroFlow', bodyHtml });
  }

  /**
   * Generates a modern responsive HTML template for Retrospective Invitations
   */
  getRetroInvitationTemplate({
    retroTitle,
    inviteUrl,
    senderName = 'Your Agile Facilitator',
    description = '',
    customMessage = '',
    topics = [],
    isMagicInvite = true,
    recipientEmail = '',
  }) {
    const topicPillsHtml =
      topics && topics.length > 0
        ? topics
            .map(
              (t) => `
          <span style="display: inline-block; background-color: ${t.color || '#4f46e5'}18; color: ${
                t.color || '#4f46e5'
              }; border: 1px solid ${t.color || '#4f46e5'}35; font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 6px; margin: 3px 4px 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space: nowrap;">
            ${t.title}
          </span>
        `
            )
            .join('')
        : '';

    const bodyHtml = `
      <div style="margin-bottom: 14px;">
        <span style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; background-color: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 6px;">
          ✨ 1-Click Magic Entry &bull; Zero Passwords
        </span>
      </div>
      <h1 class="main-heading" style="font-size: 21px; line-height: 27px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; letter-spacing: -0.4px;">
        You're invited to a Sprint Retrospective
      </h1>
      <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 18px 0;">
        <strong>${senderName}</strong> has invited you to collaborate in real-time. No sign-up or password required — just click the button below to join:
      </p>

      <!-- Retrospective Card Box -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8faff; border: 1px solid #e0e7ff; border-left: 4px solid #4f46e5; border-radius: 10px; margin-bottom: 20px;">
        <tr>
          <td class="retro-card-padding" style="padding: 16px 18px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #4f46e5; letter-spacing: 0.5px; margin-bottom: 4px;">
              &#9679; Interactive Agile Session
            </div>
            <div class="session-heading" style="font-size: 17px; line-height: 23px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">
              ${retroTitle}
            </div>
            ${
              description
                ? `<div style="font-size: 13px; line-height: 19px; color: #64748b; margin: 0 0 12px 0;">${description}</div>`
                : ''
            }
            ${
              topicPillsHtml
                ? `
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
                <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; letter-spacing: 0.5px;">Agenda Topics:</div>
                <div style="line-height: 26px;">
                  ${topicPillsHtml}
                </div>
              </div>
            `
                : ''
            }
          </td>
        </tr>
      </table>

      ${
        customMessage
          ? `
        <!-- Custom Message Box -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #f8fafc; border-left: 3px solid #6366f1; border-radius: 0 8px 8px 0;">
          <tr>
            <td style="padding: 12px 16px;">
              <p style="font-size: 13px; color: #334155; font-style: italic; margin: 0; line-height: 1.5;">
                "${customMessage}"
              </p>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; font-weight: 600;">— Note from ${senderName}</div>
            </td>
          </tr>
        </table>
      `
          : ''
      }

      <!-- Direct Mobile-Friendly CTA Button -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 22px 0 16px 0;">
        <tr>
          <td align="center">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 340px;">
              <tr>
                <td align="center" style="background-color: #4f46e5; border-radius: 10px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                  <a href="${inviteUrl}" target="_blank" class="email-btn" style="display: block; width: 100%; box-sizing: border-box; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 20px; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; line-height: 1.2;">
                    Join Live Retrospective Board &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Fallback Direct Link -->
      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0 0 16px 0; line-height: 1.5;">
        Or paste this link into your browser:<br />
        <a href="${inviteUrl}" style="color: #4f46e5; text-decoration: underline; word-break: break-all; font-weight: 500;">${inviteUrl}</a>
      </p>
    `;

    return this._wrapEmail({
      title: `Invitation: ${retroTitle} - RetroFlow`,
      bodyHtml,
    });
  }

  /**
   * Project Invitation Email Template
   */
  getProjectInvitationTemplate({
    projectName,
    projectKey,
    projectLead,
    role = 'Developer',
    inviteUrl,
    senderName,
    customMessage,
    recipientEmail,
  }) {
    const bodyHtml = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 52px; height: 52px; line-height: 52px; border-radius: 16px; background-color: #ede9fe; color: #6366f1; font-size: 20px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          ${projectKey || 'PRJ'}
        </div>
        <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 14px 0 6px 0; letter-spacing: -0.5px;">
          You've been invited to ${projectName}
        </h2>
        <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
          ${senderName || 'Your Project Lead'} invited you to join this agile initiative as a <strong>${role}</strong>.
        </p>
      </div>

      <!-- Project Metadata Card -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="retro-card-padding" style="margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
        <tr>
          <td>
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 4px;">Project Details</div>
            <div style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">${projectName} (${projectKey})</div>
            <div style="font-size: 12px; color: #64748b;">
              Project Lead: <strong style="color: #334155;">${projectLead || 'Designated Lead'}</strong> &bull; Assigned Role: <strong style="color: #4f46e5;">${role}</strong>
            </div>
          </td>
        </tr>
      </table>

      ${
        customMessage
          ? `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px; background-color: #f8fafc; border-left: 3px solid #6366f1; border-radius: 0 8px 8px 0;">
          <tr>
            <td style="padding: 12px 16px;">
              <p style="font-size: 13px; color: #334155; font-style: italic; margin: 0; line-height: 1.5;">
                "${customMessage}"
              </p>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; font-weight: 600;">— Note from ${senderName}</div>
            </td>
          </tr>
        </table>
      `
          : ''
      }

      <!-- Direct Mobile-Friendly CTA Button -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 16px 0;">
        <tr>
          <td align="center">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 340px;">
              <tr>
                <td align="center" style="background-color: #4f46e5; border-radius: 10px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                  <a href="${inviteUrl}" target="_blank" class="email-btn" style="display: block; width: 100%; box-sizing: border-box; background-color: #4f46e5; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 20px; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; line-height: 1.2;">
                    Open Project Dashboard &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Fallback Direct Link -->
      <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0 0 16px 0; line-height: 1.5;">
        Or copy and paste this link in your browser:<br />
        <a href="${inviteUrl}" style="color: #4f46e5; text-decoration: underline; word-break: break-all; font-weight: 500;">${inviteUrl}</a>
      </p>
    `;

    return this._wrapEmail({
      title: `Invitation: ${projectName} - RetroFlow`,
      bodyHtml,
    });
  }
}

export const emailService = new EmailService();
export default emailService;

