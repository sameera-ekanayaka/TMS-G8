// backend/services/emailService.js
// Email service using Azure Communication Services Email SDK
//
// ACS Email works with the following env vars:
//   ACS_CONNECTION_STRING = <CONNECTION_STRING>
//   EMAIL_FROM            = <DoNotReply@<yourdomain>.azurecomm.net>
//   EMAIL_ENABLED         = true   (set to false to silently skip email in dev)

const { EmailClient } = require("@azure/communication-email");

const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== "false";

// ─── Create client (lazy — only if EMAIL_ENABLED) ───────────────────────
let emailClient = null;

const getEmailClient = () => {
  if (!emailClient && EMAIL_ENABLED) {
    if (!process.env.ACS_CONNECTION_STRING) {
      console.error("ACS_CONNECTION_STRING is missing in environment variables.");
      return null;
    }
    emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING);
  }
  return emailClient;
};

// ─── sendOnboardingEmail ──────────────────────────────────────────────────────
// Called by userController when admin creates a new user.
// Sends the user their temporary password so they can log in.
const sendOnboardingEmail = async ({ to, name, email, tempPassword, role }) => {
  if (!EMAIL_ENABLED) {
    console.log(`[EmailService] EMAIL_ENABLED=false — skipping email to ${to}`);
    return { skipped: true };
  }

  const client = getEmailClient();
  if (!client) {
    console.warn("[EmailService] No email client configured — check ACS_CONNECTION_STRING");
    return { skipped: true };
  }

  const subject = "Welcome to TaskHub — Your Account Details";
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      
      <!-- Header -->
      <div style="background: #1a1f26; padding: 32px 40px; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 500; letter-spacing: -0.5px;">
          ✓ TaskHub
        </h1>
      </div>

      <!-- Body -->
      <div style="padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1a1f26; font-size: 20px; font-weight: 500; margin: 0 0 8px;">
          Welcome, ${name}!
        </h2>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 28px; line-height: 1.6;">
          Your account has been created. Below are your login credentials.
        </p>

        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px 24px; margin-bottom: 28px;">
          <p style="margin: 0 0 10px; font-size: 13px; color: #374151;">
            <strong style="color: #1a1f26;">Email:</strong>&nbsp;&nbsp;${email}
          </p>
          <p style="margin: 0 0 10px; font-size: 13px; color: #374151;">
            <strong style="color: #1a1f26;">Temporary Password:</strong>&nbsp;&nbsp;
            <code style="background: #e5e7eb; padding: 3px 8px; border-radius: 4px; font-size: 13px; letter-spacing: 0.5px;">${tempPassword}</code>
          </p>
          <p style="margin: 0; font-size: 13px; color: #374151;">
            <strong style="color: #1a1f26;">Role:</strong>&nbsp;&nbsp;${role}
          </p>
        </div>

        <p style="color: #dc2626; font-size: 13px; margin: 0 0 24px;">
          ⚠️ You will be required to change your password on first login.
        </p>

        <a href="${process.env.CLIENT_URL}/login"
            style="display: inline-block; background: #1a1f26; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Sign In to TaskHub
        </a>

        <p style="margin-top: 32px; color: #9ca3af; font-size: 12px; line-height: 1.5;">
          If you did not expect this email, please ignore it or contact your administrator.<br>
          This is an automated message — please do not reply.
        </p>
      </div>

    </div>
  `;

  // ACS senderAddress must be a bare verified address — not an RFC-5322
  // "Display Name <addr>" string. Extract the address from any <…> wrapper and
  // trim stray whitespace/newlines (e.g. a trailing newline from a secret value).
  const rawSender = process.env.EMAIL_FROM || "DoNotReply@c858cc8f-5d2a-4984-8fb5-f512aefb38e4.azurecomm.net";
  const senderMatch = rawSender.match(/<([^>]+)>/);
  const senderAddress = (senderMatch ? senderMatch[1] : rawSender).trim();

  const emailMessage = {
    senderAddress: senderAddress,
    content: {
      subject: subject,
      plainText: "Your TaskHub account has been created. Please sign in.",
      html: html,
    },
    recipients: {
      to: [{ address: to }],
    },
  };

  try {
    const poller = await client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();
    console.log(`[EmailService] Onboarding email sent to ${to} — messageId: ${result.id}`);
    return result;
  } catch (err) {
    // Log but do not throw — a failed email should not break user creation
    console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
    return { error: err.message };
  }
};

module.exports = { sendOnboardingEmail };