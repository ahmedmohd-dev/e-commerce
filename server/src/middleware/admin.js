module.exports = function isAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  next();
};











