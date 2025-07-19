const nodemailer = require('nodemailer');

async function sendMail(name, email, certificateUrl) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,      // Gmail address
      pass: process.env.EMAIL_PASS       // App password
    }
  });

  await transporter.sendMail({
    from: '"Certificate Team" <charanclguse@gmail.com>',
    to: email,
    subject: 'Your Certificate',
    html: `
      <p>Hi ${name},</p>
      <p>Congratulations! Your certificate is ready. You can download it from the link below:</p>
      <p><a href="${certificateUrl}" target="_blank">Download Certificate</a></p>
      <p>Best regards,<br/>Certificate Team</p>
    `
  });

  console.log(`Email sent to ${email}`);
}

module.exports = { sendMail };
