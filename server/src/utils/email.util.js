const nodemailer = require('nodemailer');

// ── Create reusable SMTP transporter ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,    // your Gmail address
    pass: process.env.SMTP_PASS,    // Gmail App Password (not your regular password)
  },
});

/**
 * Send a project invitation email with a magic link.
 */
const sendInviteEmail = async ({ to, inviterName, projectName, inviteUrl }) => {
  const mailOptions = {
    from: `"Flōw" <${process.env.SMTP_USER}>`,
    to,
    subject: `${inviterName} invited you to "${projectName}" on Flōw`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            body { font-family: -apple-system, sans-serif; background: #F8F8F8; margin: 0; padding: 0; }
            .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #E8E8E8; }
            .header { background: #3B9BE8; padding: 40px 40px 32px; }
            .logo-text { font-size: 22px; font-weight: 800; color: #fff; }
            .hero-text { color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 8px; line-height: 1.3; }
            .hero-sub { color: rgba(255,255,255,0.7); font-size: 15px; margin: 0; }
            .body { padding: 36px 40px; }
            .info-box { background: #F8F8F8; border-radius: 14px; padding: 18px 22px; margin-bottom: 28px; }
            .info-label { font-size: 11px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; }
            .info-value { font-size: 18px; font-weight: 700; color: #0D0D0D; margin-top: 4px; }
            .btn { display: block; background: #0D0D0D; color: #ffffff; text-decoration: none; padding: 16px 28px; border-radius: 50px; font-weight: 700; font-size: 14px; text-align: center; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 24px; }
            .footer-note { font-size: 12px; color: #9CA3AF; text-align: center; margin-top: 24px; line-height: 1.6; }
            .divider { border: none; border-top: 1px solid #E8E8E8; margin: 28px 0; }
            .expire-note { font-size: 13px; color: #9CA3AF; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-text">⚡ Flōw</div>
              <p class="hero-text">You've been invited!</p>
              <p class="hero-sub">${inviterName} wants you to join their workspace.</p>
            </div>
            <div class="body">
              <div class="info-box">
                <div class="info-label">Project</div>
                <div class="info-value">📁 ${projectName}</div>
              </div>
              <p style="color:#374151; font-size:15px; margin: 0 0 24px; line-height:1.6;">
                <strong>${inviterName}</strong> has invited you to collaborate on <strong>${projectName}</strong>.
                Click the button below to accept and join the team.
              </p>
              <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
              <hr class="divider" />
              <p class="expire-note">⏰ This invite link expires in <strong>7 days</strong>.</p>
              <p class="footer-note">
                If you didn't expect this, you can safely ignore this email.<br/>
                <a href="${inviteUrl}" style="color:#3B9BE8;">${inviteUrl}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Sent]', info.messageId, '→', to);
    return info;
  } catch (error) {
    console.error('[SMTP Error]', error.message);
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
};

/**
 * Verify the SMTP connection on startup (optional health check).
 */
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('[SMTP] Connected — ready to send emails');
  } catch (err) {
    console.warn('[SMTP] Connection failed:', err.message);
    console.warn('[SMTP] Check your SMTP_USER and SMTP_PASS in .env');
  }
};

module.exports = { sendInviteEmail, verifyEmailConnection };
