import nodemailer from 'nodemailer';

// Email configuration using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  // Only attempt to send if credentials are provided
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not sent: SMTP credentials missing in environment.');
    console.log(`Subject: ${subject}`);
    console.log(`To: ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"SmartLeave" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

export const sendLoginNotification = async (email: string, fullName: string) => {
  const subject = 'Login Notification - SmartLeave';
  const text = `Hello ${fullName},\n\nYou have successfully logged into your SmartLeave account at ${new Date().toLocaleString()}.\n\nIf this wasn't you, please contact HR immediately.`;
  await sendEmail(email, subject, text);
};

export const sendLeaveStatusNotification = async (email: string, fullName: string, category: string, status: string) => {
  const subject = `Leave Request ${status} - SmartLeave`;
  const text = `Hello ${fullName},\n\nYour request for ${category} has been ${status.toLowerCase()}.\n\nPlease check your dashboard for more details.`;
  await sendEmail(email, subject, text);
};
