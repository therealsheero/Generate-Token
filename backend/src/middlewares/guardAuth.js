module.exports = function guardAuth(req, res, next) {
  const token = req.headers["x-guard-token"];

  if (token !== "GUARD_TOKEN") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  next();
};
