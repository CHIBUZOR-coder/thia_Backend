import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
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
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

export { verifyToken };



