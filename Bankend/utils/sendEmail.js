
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE).toLowerCase() !== "false",

  auth: {
    user: process.env.SMTP_EMAIL?.trim(),
    pass: process.env.SMTP_APP_PASSWORD?.replace(/\s/g, ""),
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

// Debug SMTP configuration without exposing the password
console.log("Nodemailer auth check:", {
  host: transporter.options.host,
  port: transporter.options.port,
  authConfigured: Boolean(transporter.options.auth),
  usernamePresent: Boolean(transporter.options.auth?.user),
  passwordPresent: Boolean(transporter.options.auth?.pass),
});

async function sendEmail({ to, subject, text }) {
  try {
    if (!process.env.SMTP_EMAIL?.trim()) {
      throw new Error("SMTP_EMAIL is missing in .env");
    }

    if (!process.env.SMTP_APP_PASSWORD?.trim()) {
      throw new Error("SMTP_APP_PASSWORD is missing in .env");
    }

    if (!to) {
      throw new Error("Email recipient is missing");
    }

    const info = await transporter.sendMail({
      from: {
        name: "O Positive Health",
        address: process.env.SMTP_EMAIL.trim(),
      },
      to,
      subject,
      text,
    });

    console.log("Email sent successfully:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return info;
  } catch (error) {
    console.error("EMAIL SENDING FAILED:", {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    });

    throw error;
  }
}

async function verifyEmailConnection() {
  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("SMTP connection failed:", {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    });
    return false;
  }
}

module.exports = sendEmail;
module.exports.verifyEmailConnection = verifyEmailConnection;
