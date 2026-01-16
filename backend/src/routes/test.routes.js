import express from "express";
import { sendMail } from "../utils/sendEmail.js";

const router = express.Router();

router.get("/test-mail", async (req, res) => {
  try {
    await sendMail({
      to: "aparichitapadhee@gmail.com",
      subject: "SwasthyaConnect Test Email",
      html: "<h2>Email system is working ✅</h2>",
    });

    res.json({ success: true, message: "Test email sent" });
  } catch (err) {
    console.error("TEST MAIL ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
