exports.getProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
  res.json({
    uid: req.user.firebaseUid,
    email: req.user.email,
    displayName: req.user.displayName,
    role: req.user.role,
    createdAt: req.user.createdAt,
  });
};





