import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendMail = async (to: string, subject: string, html: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP credentials not set. Mocking email send:');
    console.log(`[To: ${to}] [Subject: ${subject}]\n${html}\n`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'KymiraAI'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// ─── Email Templates ──────────────────────────────────────────────────────────

export const sendVerificationOtp = async (to: string, otp: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaeb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eaeaeb;">
        <span style="font-size: 32px;">🤖</span>
        <h1 style="color: #111; margin: 10px 0 0 0; font-size: 20px;">KymiraAI</h1>
      </div>
      <h2 style="color: #333;">Verify your email address</h2>
      <p style="color: #555; line-height: 1.5;">Thank you for registering! Please use the following One-Time Password (OTP) to complete your registration. This code will expire in 15 minutes.</p>
      <div style="background-color: #f4f4f5; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email.</p>
    </div>
  `;
  await sendMail(to, 'KymiraAI - Email Verification', html);
};

export const sendPasswordResetOtp = async (to: string, otp: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaeb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eaeaeb;">
        <span style="font-size: 32px;">🤖</span>
        <h1 style="color: #111; margin: 10px 0 0 0; font-size: 20px;">KymiraAI</h1>
      </div>
      <h2 style="color: #333;">Reset Your Password</h2>
      <p style="color: #555; line-height: 1.5;">We received a request to reset your password. Use the OTP below to proceed. This code expires in 15 minutes.</p>
      <div style="background-color: #f4f4f5; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email or secure your account.</p>
    </div>
  `;
  await sendMail(to, 'KymiraAI - Password Reset', html);
};

export const sendProfilePasswordChangeOtp = async (to: string, otp: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaeb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eaeaeb;">
        <span style="font-size: 32px;">🤖</span>
        <h1 style="color: #111; margin: 10px 0 0 0; font-size: 20px;">KymiraAI</h1>
      </div>
      <h2 style="color: #333;">Change Your Password</h2>
      <p style="color: #555; line-height: 1.5;">You requested to change your password from your account settings. Use the OTP below to confirm this change. This code expires in 15 minutes.</p>
      <div style="background-color: #f4f4f5; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 30px;">If you did not request this, please ensure your account is secure.</p>
    </div>
  `;
  await sendMail(to, 'KymiraAI - Confirm Password Change', html);
};

export const sendLoginAlert = async (to: string, device: string, location: string, ip: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaeb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eaeaeb;">
        <span style="font-size: 32px;">🤖</span>
        <h1 style="color: #111; margin: 10px 0 0 0; font-size: 20px;">KymiraAI</h1>
      </div>
      <h2 style="color: #333;">New Login Alert</h2>
      <p style="color: #555; line-height: 1.5;">We noticed a new login to your account from an unrecognized device or location.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 5px 0;"><strong>Device/Browser:</strong> ${device}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
        <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ip}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toUTCString()}</p>
      </div>

      <p style="color: #555; line-height: 1.5;">If this was you, you can ignore this email. If you don't recognize this activity, please log in and change your password immediately.</p>
    </div>
  `;
  await sendMail(to, 'KymiraAI - Security Alert: New Login', html);
};

export const sendPasswordChangedAlert = async (to: string, device: string, location: string, ip: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaeb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eaeaeb;">
        <span style="font-size: 32px;">🤖</span>
        <h1 style="color: #111; margin: 10px 0 0 0; font-size: 20px;">KymiraAI</h1>
      </div>
      <h2 style="color: #333;">Password Changed</h2>
      <p style="color: #555; line-height: 1.5;">The password for your KymiraAI account was just changed.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <p style="margin: 5px 0;"><strong>Device/Browser:</strong> ${device}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
        <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ip}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toUTCString()}</p>
      </div>

      <p style="color: #555; line-height: 1.5;">If you did not perform this action, please contact support immediately to secure your account.</p>
    </div>
  `;
  await sendMail(to, 'KymiraAI - Security Alert: Password Changed', html);
};

export const sendDeleteAccountOtp = async (to: string, otp: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaeb; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #eaeaeb;">
        <span style="font-size: 32px;">🤖</span>
        <h1 style="color: #111; margin: 10px 0 0 0; font-size: 20px;">KymiraAI</h1>
      </div>
      <h2 style="color: #f43f5e;">Account Deletion Request</h2>
      <p style="color: #555; line-height: 1.5;">We received a request to permanently delete your KymiraAI account. <strong>This action is irreversible and will delete all your conversations and data.</strong></p>
      <p style="color: #555; line-height: 1.5;">Use the OTP below to confirm account deletion. This code expires in 15 minutes.</p>
      <div style="background-color: #fff1f2; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0; border: 1px solid #ffe4e6;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #e11d48;">${otp}</span>
      </div>
      <p style="color: #888; font-size: 12px; margin-top: 30px;">If you did not request this, please change your password immediately as your account may be compromised.</p>
    </div>
  `;
  await sendMail(to, 'KymiraAI - Account Deletion OTP', html);
};
