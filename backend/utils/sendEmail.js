const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",

  connectionTimeout: 10000, // 10 sec
  greetingTimeout: 10000,
  socketTimeout: 10000,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {

  await transporter.sendMail({
    from: `"PetRonaq 🐾" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });

};

module.exports = sendEmail;