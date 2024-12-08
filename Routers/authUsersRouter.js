import { registerUser, loginUser, deleteAccount } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authentication.js"; // Import the verifyToken middleware
import express from "express";
const authRouter = express.Router();

// Public routes
authRouter.post("/api/registerUser", registerUser);
authRouter.post("/api/loginUser", loginUser);
authRouter.delete("/api/deleteAccount", deleteAccount);

authRouter.get("/api/protectedRoute", verifyToken, (req, res) => {
let  userInfo;
  res.status(200)
  res.json({
    success: true,
    message: "You have accessed a protected route.",
    userInfo:req.user // Contains user data from decoded token
  });
});


authRouter.post('/clear-cookies', (req, res) => {
  // Clear the cookie by specifying the cookie name and other options
  res.clearCookie('auth_token', {
    httpOnly: true, // Ensures the cookie is not accessible via JavaScript
    secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent only over HTTPS in production
    sameSite: 'Strict', // Adds security to prevent cross-site request forgery (CSRF)
  });

  // Send a success response to the client
res.status(200).json({success:true, message: 'Cookies cleared' });

});





// authRouter.get("/api/protectedRoute", validatoken, (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "You have accessed a protected route!",
//     user: req.user, // Contains the user data decoded from the token
//   });
// });

export { authRouter };
