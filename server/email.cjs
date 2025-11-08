const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

console.log('Nodemailer transporter configured.');
console.log(`GMAIL_USER loaded: ${process.env.GMAIL_USER ? 'Yes' : 'No'}`);
console.log(`GMAIL_APP_PASSWORD loaded: ${process.env.GMAIL_APP_PASSWORD ? 'Yes' : 'No'}`);

console.log('transporter:', transporter);

async function sendPasswordResetEmail(to, token) {
  const resetLink = `http://localhost:5173/reset-password?token=${token}`;
  const info = await transporter.sendMail({
    from: '"Shree Medicare HMS" <noreply@hms.com>',
    to: to,
    subject: "Password Reset Request",
    text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetLink}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`,
    html: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p><p>Please click on the following link, or paste this into your browser to complete the process:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`,
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

async function sendVerificationEmail(to, token) {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const info = await transporter.sendMail({
    from: '"Shree Medicare HMS" <noreply@hms.com>',
    to: to,
    subject: "Verify Your Email Address",
    text: `Welcome to Shree Medicare! Please verify your email address by clicking the following link:\n\n${verificationLink}\n\nIf you did not create an account, please ignore this email.`,
    html: `<p>Welcome to Shree Medicare!</p><p>Please verify your email address by clicking the following link:</p><p><a href="${verificationLink}">${verificationLink}</a></p><p>If you did not create an account, please ignore this email.</p>`,
  });

  console.log("Verification email sent: %s", info.messageId);
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
