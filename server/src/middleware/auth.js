const { initFirebaseAdmin } = require("../config/firebase");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "No token" });
    const admin = initFirebaseAdmin();
    if (!admin) return res.status(500).json({ message: "Auth not configured" });
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebase = decoded;
    const user = await User.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        $setOnInsert: {
          email: decoded.email || "",
          displayName: decoded.name || "",
          role: "user",
        },
      },
      { new: true, upsert: true }
    );
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};





