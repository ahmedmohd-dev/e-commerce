require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const brandRoutes = require("./routes/brand.routes");
const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");
const sellerRoutes = require("./routes/seller.routes");
const adminUtilRoutes = require("./routes/admin.util.routes");
const receiptRoutes = require("./routes/receipt.routes");
const reviewRoutes = require("./routes/review.routes");
const contactRoutes = require("./routes/contact.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();
app.set("trust proxy", 1);

// CORS: support multiple origins via comma-separated env
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.CLIENT_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

connectDB();

// routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/_util", adminUtilRoutes);
app.use("/api/receipt", receiptRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/notifications", notificationRoutes);
// end routes

app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

module.exports = app;
