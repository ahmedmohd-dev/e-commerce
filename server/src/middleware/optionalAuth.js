const { initFirebaseAdmin } = require("../config/firebase");
const User = require("../models/User");

module.exports = async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return next();
    }
    const admin = initFirebaseAdmin();
    if (!admin) {
      return next();
    }
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebase = decoded;
    const user = await User.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        $set: {
          email: decoded.email || "",
          displayName: decoded.name || decoded.displayName || "",
        },
        $setOnInsert: {
          role: "buyer",
          sellerStatus: "none",
        },
      },
      { new: true, upsert: true }
    );
    req.user = user;
    return next();
  } catch (err) {
    console.warn("optionalAuth: failed to decode token", err?.message || err);
    return next();
  }
};






























