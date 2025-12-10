const User = require("../models/User");
const { sendWelcomeEmail } = require("../utils/emailService");

exports.getProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
  res.json({
    uid: req.user.firebaseUid,
    email: req.user.email,
    displayName: req.user.displayName,
    role: req.user.role,
    sellerStatus: req.user.sellerStatus,
    sellerProfile: req.user.sellerProfile,
    createdAt: req.user.createdAt,
  });
};

// Register user with role and seller info
exports.register = async (req, res) => {
  try {
    const { firebaseUid, email, displayName, role, sellerProfile } = req.body;

    if (!firebaseUid || !email) {
      return res
        .status(400)
        .json({ message: "Firebase UID and email are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid });

    if (existingUser) {
      // If user exists but doesn't have seller profile and they're registering as seller, update it
      if (
        role === "seller" &&
        existingUser.sellerStatus === "none" &&
        sellerProfile
      ) {
        existingUser.sellerStatus = "pending";
        existingUser.sellerProfile = {
          shopName: sellerProfile.shopName || "",
          phone: sellerProfile.phone || "",
          description: sellerProfile.description || "",
        };
        await existingUser.save();
        return res.json({
          message: "Seller application submitted",
          user: {
            _id: existingUser._id,
            email: existingUser.email,
            displayName: existingUser.displayName,
            role: existingUser.role,
            sellerStatus: existingUser.sellerStatus,
          },
        });
      }
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate role
    const validRole = role === "seller" ? "buyer" : role; // Start as buyer even if seller selected
    const sellerStatus = role === "seller" ? "pending" : "none";

    // Create user
    const userData = {
      firebaseUid,
      email,
      displayName: displayName || "",
      role: validRole,
      sellerStatus,
    };

    // If seller registration, add seller profile
    if (role === "seller" && sellerProfile) {
      userData.sellerProfile = {
        shopName: sellerProfile.shopName || "",
        phone: sellerProfile.phone || "",
        description: sellerProfile.description || "",
      };
    }

    const user = await User.create(userData);

    // Send welcome email (don't wait for it to complete)
    sendWelcomeEmail(user).catch((err) => {
      console.error("Failed to send welcome email:", err);
      // Don't fail registration if email fails
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        sellerStatus: user.sellerStatus,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists" });
    }
    return res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};
