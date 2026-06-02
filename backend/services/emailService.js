// backend/services/emailService.js
// Nodemailer service — sends onboarding email when admin creates a new user
// Member 1 (Sameera)

const nodemailer = require("nodemailer");

// ─── Create reusable transporter ─────────────────────────────
// Reads SMTP credentials from .env — never hardcoded
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,       // smtp.gmail.com
  port: parseInt(process.env.EMAIL_PORT), // 587
  secure: false,                      // false for port 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,     // Gmail App Password (not your real password)
  },
});

// ─── sendOnboardingEmail ──────────────────────────────────────
// Called by userController when admin creates a new user
// Sends the user their temporary password so they can log in
const sendOnboardingEmail = async ({ to, name, email, tempPassword, role }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: "Welcome to the Task Management System — Your Account Details",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to TMS, ${name}!</h2>
        <p>Your account has been created by an administrator.</p>

        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>
          <p><strong>Role:</strong> ${role}</p>
        </div>

        <p style="color: #dc2626;">
          ⚠️ You will be required to change your password on first login.
        </p>

        <a href="${process.env.CLIENT_URL}/login"
           style="display:inline-block;background:#2563eb;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:10px;">
          Log In Now
        </a>

        <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">
          If you did not expect this email, please ignore it or contact your administrator.
        </p>
      </div>
    `,
  };

  // Send and return info (useful for logging)
  const info = await transporter.sendMail(mailOptions);
  console.log(`Onboarding email sent to ${to}: ${info.messageId}`);
  return info;
};

module.exports = { sendOnboardingEmail };