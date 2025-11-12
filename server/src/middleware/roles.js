module.exports.requireRole = function requireRole(requiredRole) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
    if (req.user.role !== requiredRole)
      return res.status(403).json({ message: `${requiredRole} only` });
    next();
  };
};

module.exports.requireAnyRole = function requireAnyRole(roles) {
  return function (req, res, next) {
    if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
    if (!roles.includes(req.user.role))
      return res
        .status(403)
        .json({ message: `Requires one of: ${roles.join(", ")}` });
    next();
  };
};

module.exports.requireApprovedSeller = function requireApprovedSeller(
  req,
  res,
  next
) {
  if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
  if (req.user.role !== "seller" || req.user.sellerStatus !== "approved") {
    return res.status(403).json({ message: "Approved seller only" });
  }
  next();
};






