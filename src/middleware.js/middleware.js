const authenticate = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      success: false,
      message: "Authorization token is missing. Please log in first.",
    });
  }
  next();
};

module.exports = { authenticate };
