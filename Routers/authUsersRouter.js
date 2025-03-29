import {
  registerUser,
  loginUser,
  deleteAccount,
  verifyEmail
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authentication.js"; // Import the verifyToken middleware
import express from "express";
const authRouter = express.Router();
import uploads from "../middlewares/uploads.js";

// Public routes
authRouter.post("/api/registerUser", uploads.single("image"), registerUser);
authRouter.post("/api/loginUser", loginUser);
authRouter.delete("/api/deleteAccount", deleteAccount);
authRouter.post("/verifyEmail", verifyEmail);

authRouter.get("/api/protectedRoute", verifyToken, (req, res) => {
  let userInfo;
  res.status(200);
  res.json({
    success: true,
    message: "You have accessed a protected route.",
    userInfo: req.user, // Contains user data from decoded token
  });
});

authRouter.post("/clear-cookies", (req, res) => {
  // Clear the cookie by specifying the cookie name and other options
  res.clearCookie("auth_token", {
    httpOnly: true, // Ensures the cookie is not accessible via JavaScript
    secure: process.env.NODE_ENV === "production", // Ensures the cookie is sent only over HTTPS in production
    sameSite: "Strict", // Adds security to prevent cross-site request forgery (CSRF)
  });

  // Send a success response to the client
  res.status(200).json({ success: true, message: "Cookies cleared" });
});

// authRouter.get("/api/protectedRoute", validatoken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "You have accessed a protected route!",
//     user: req.user, // Contains the user data decoded from the token
//   });
// });

export { authRouter };
