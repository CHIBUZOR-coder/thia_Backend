import jwt from "jsonwebtoken";

const verifyAdminToken = (req, res, next) => {
  console.log(req.cookies); // Add this line to debug
  const token = req.cookies.auth_token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided, authorization denied." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this route!",
      });
    }
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: error.message || "Invalid token." });
  }
};

export { verifyAdminToken };
