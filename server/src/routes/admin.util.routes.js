const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Temporary utility endpoint to promote a Firebase UID to admin
// Guarded by ADMIN_SECRET in .env
router.post("/make-admin", async (req, res) => {
  try {
    const provided = req.query.secret || req.headers["x-admin-secret"];
    const expected = process.env.ADMIN_SECRET;
    if (!expected || provided !== expected) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { uid } = req.body || {};
    if (!uid) return res.status(400).json({ message: "uid required" });
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { role: "admin" } },
      { new: true }
    );
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found. Login via client first." });
    return res.json({ message: "OK", user });
  } catch (e) {
    return res.status(500).json({ message: "Error", error: e.message });
  }
});

module.exports = router;



