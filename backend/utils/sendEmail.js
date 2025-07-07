const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Issue Tracker" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log('Email sent to:', to);
  } catch (err) {
    console.error(' Failed to send email:', err);
  }
};

module.exports = sendEmail;
