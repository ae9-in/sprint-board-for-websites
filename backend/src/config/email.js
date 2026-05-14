import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(to, subject, html) {
  const from = process.env.EMAIL_FROM || 'noreply@sprintboard.com';

  await transporter.sendMail({
    from,
    to,
    subject,
    html
  });
}

export default transporter;