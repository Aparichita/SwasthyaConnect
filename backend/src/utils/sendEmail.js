import nodemailer from "nodemailer";

export const sendMail = async (toOrOptions, subject, text) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS missing in .env");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify connection with Gmail (VERY IMPORTANT)
  await transporter.verify();
  console.log("✅ Gmail transporter verified");

  let mailOptions;

  if (typeof toOrOptions === "object" && toOrOptions !== null) {
    mailOptions = {
      from: `"SwasthyaConnect" <${process.env.EMAIL_USER}>`,
      ...toOrOptions,
    };
  } else {
    mailOptions = {
      from: `"SwasthyaConnect" <${process.env.EMAIL_USER}>`,
      to: toOrOptions,
      subject,
      text,
    };
  }

  const info = await transporter.sendMail(mailOptions);

  console.log("✅ EMAIL SENT");
  console.log("➡️ To:", mailOptions.to);
  console.log("📨 Message ID:", info.messageId);

  return info;
};

export const sendEmail = sendMail;
