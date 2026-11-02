
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

const express = require("express");



const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { verifyEmailConnection } = require("./utils/sendEmail");
const connectionDB = require("./config/db");

// Routes
const authRoutes = require("./routes/auth/authRoutes");
const vendorRoutes = require("./routes/vendor/vendorRoutes");
const volunteerRoutes = require("./routes/volunteer/VolunteerRoutes");
const impactRoutes = require("./routes/stat/impactRoutes");
const adminRoute = require("./routes/admin/adminRoute");
const cartRoutes = require("./routes/cart/cartRoutes");
const campaignRoutes = require("./routes/campaign/campaignRoutes");
const orderRoutes = require("./routes/order/orderRoutes");
const contactRoute = require("./routes/contact/contactRoute");
const chatbotRoutes = require("./routes/chatbot/chatbotRoutes");
const {phonePeWebhook} = require("./controllers/donate/phonePeWebhookController")
const donationRoutes = require("./routes/donate/donationRoutes");
const blogRoutes = require("./routes/blog/BlogRoutes");
const monthlyDonation = require("./routes/monthly/monthlyRoutes");

const app = express();

// Trust Render proxy
app.set("trust proxy", 1);

// ========================================
// SECURITY
// ========================================

app.use(helmet());

// ========================================
// CORS
// ========================================

const allowedOrigins = [
  "http://localhost:5173",
  "https://o-health-positive-2.onrender.com",
  "https://o-health-positive-x3ej-seven.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Idempotency-Key",
    ],
  })
);

// ========================================
// PHONEPE WEBHOOK
app.post(
  "/api/donations/phonepe-webhook",
  express.raw({
    type: "application/json",
    limit: "100kb",
  }),
  phonePeWebhook
);

// ========================================
// BODY PARSERS
// ========================================

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(cookieParser());

// ========================================
// RATE LIMITING
// ========================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// ========================================
// DEBUG CONFIGURATION
// ========================================

console.log("Gemini API key loaded:", Boolean(process.env.GEMINI_API_KEY));

console.log("SMTP credentials check:", {
  emailExists: Boolean(process.env.SMTP_EMAIL?.trim()),
  passwordExists: Boolean(process.env.SMTP_APP_PASSWORD?.trim()),
});

// Do not log PhonePe secrets.

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "O Positive Health NGO Backend is running",
  });
});

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "O Positive Health API is running",
  });
});

// ========================================
// APPLICATION ROUTES
// ========================================

app.use("/api", monthlyDonation);

app.use("/api/contact", contactRoute);
app.use("/api/admin", adminRoute);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.use("/api/donations", donationRoutes);

app.use("/api/blogs", blogRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api", impactRoutes);

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("Global server error:", err.message);

  return res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ========================================
// SERVER START
// ========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectionDB();

    await verifyEmailConnection();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
