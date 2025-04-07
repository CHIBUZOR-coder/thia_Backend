import bcrypt, { compare } from "bcrypt";
import client from "../db.js";
import {
  generateToken,
  ResetPasswordToken,
} from "../middlewares/generateToken.js";
//create/register new user
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid"; // <-- Add semicolon here
import { cloudinary } from "../config/cloudinary.js";
import jwt from "jsonwebtoken";
import { transporter } from "../config/email.js";

dotenv.config();

//register User
export const registerUser = async (req, res) => {
  //request body
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      address,
      address2,
      city,
      postal_code,
      country,
      role,
      password,
      confirmPassword,
    } = req.body;

    // Check if all required fields are provided
    if (
      !email ||
      !firstName ||
      !lastName ||
      !phone ||
      !address ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    let imageUrl;
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (req.file) {
      console.log("Starting image upload...");
      // console.log("File buffer:", req.file.buffer);

      try {
        // Use async/await to handle the image upload process
        imageUrl = await uploadImageToCloudinary(req.file.buffer);

        // After the upload completes, log the image URL
        console.log("Image URL after upload:", imageUrl);
      } catch (error) {
        console.error("Error during upload:", error);
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed" });
      }
    }

    //check if user already exist
    const user = await client.query("SELECT * FROM userr WHERE email = $1 ", [
      email,
    ]);
    if (user.rowCount > 0)
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }
    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    //confirm password
    if (password !== confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "Password does not match" });

    //crate a bycrypt salt
    const salt = await bcrypt.genSalt(10);

    // hash the password with the salt using bcrypt
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verifyEmailToken = jwt.sign({ email }, process.env.EMAIL_SECRET, {
      expiresIn: "1h",
    });

    //create new user
    const newUser = await client.query(
      "INSERT INTO userr  ( email, firstName, lastName, phone, address,  password,  address2, city, postal_code, country, image ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
      [
        email,
        firstName,
        lastName,
        phone,
        address,
        hashedPassword,
        address2,
        city,
        postal_code,
        country,
        imageUrl,
      ]
    );

    const verificationLink = `http://localhost:5173/verifyEmail?token=${verifyEmailToken}`;

    await sendVerificationEmail(email, verificationLink);

    const userData = newUser.rows[0];
    delete userData.password; // Remove the password from the response
    return res.status(201).json({
      success: true,
      message:
        "Registered successfully. Please check your email for verification..",
      user: userData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const uploadImageToCloudinary = async (fileBuffer) => {
  try {
    const uploadPromise = new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "thia_user_image" },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        )
        .end(fileBuffer);
    });

    const result = await uploadPromise;
    console.log("Upload successful:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Image upload failed");
  }
};

const sendVerificationEmail = async (email, verificationLink) => {
  const mailOptions = {
    from: {
      name: "THIA'S APAREAL",
      address: process.env.EMAIL_HOST_USER,
    },
    to: email,
    subject: "Email Verification",
    html: `
      <div style="width: 100%; height:600px; max-width: 600px; margin: auto; text-align: center;
      font-family: Arial, sans-serif; border-radius: 10px; overflow: hidden;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="height: 300px;">
          <tr>
            <td style="background: url('https://res.cloudinary.com/dtjgj2odu/image/upload/v1734469383/ThiaLogo_nop3yd.png') 
            no-repeat center center; background-size: cover;"></td>
          </tr>
        </table>
        <div style="padding: 20px; color:  #0B0F29;">
          <p style="font-size: 16px;">Click the button below to verify your email. This link is valid for 1 hour.</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #0B0F29; 
          border: 5px solid #0B0F29; color: #F20000; text-decoration: none; font-weight: bold; border-radius: 5px;"
          onmouseover="this.style.background='#FFF'; this.style.color='#0B0F29';"
          onmouseout="this.style.background='#0B0F29'; this.style.color='#F20000';">Verify Email</a>
          <p style="margin-top: 20px; font-size: 14px; color:  #0B0F29;">If you did not request this, please ignore this email.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.body;
  console.log("req.body:", req.body);

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Token and email are required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.EMAIL_SECRET); // Use your JWT secret key

    if (!decoded) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    // Extract email
    const { email } = decoded;

    // const user = await prisma.user.findUnique({
    //   where: { email },
    //   select: { id: true },
    // });

    const user = await client.query("SELECT * FROM userr WHERE email = $1", [
      email,
    ]);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Unable to find user" });
    }

    // Update user in database (set resetToken to true or handle verification logic)
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { status: true },
    // });

    // If verification is successful, send a success response
    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: decoded, // Optionally send decoded data
    });
  } catch (error) {
    console.error("Email verification error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Email verification failed" });
  }
};

//login users
export const loginUser = async (req, res) => {
  try {
    //Get user data or req body
    const { email, password } = req.body;
    //check if user exist
    const result = await client.query("SELECT * FROM userr WHERE email = $1", [
      email,
    ]);
    if (result.rowCount === 0)
      return res
        .status(400)
        .json({ success: false, message: "Invalid Credentials" });

    // Extract the user from rows
    const user = result.rows[0];
    console.log(result.rows[0]);

    //validate password
    const validatePassword = await bcrypt.compare(password, user.password);
    if (!validatePassword)
      return res
        .status(400)
        .json({ success: false, message: "Password is not correct" });

    // Clear existing cookies
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/", // Make sure the path matches where the cookie was originally set
    });

    //generate Token
    // const token = generateToken(user.id, user.role, user.email, user.firstName, user.lastName);

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      address: user.address || "No Address Provided",
      phone: user.phone || "No Phone Provided",
    });

    if (!token)
      return res.status(400).json({ success: false, message: "Invalid Token" });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("auth_token", token, {
      httpOnly: true, // Ensures the cookie cannot be accessed via JavaScript
      secure: process.env.NODE_ENV === "production", // Set to true only in production (requires HTTPS)
      expires: new Date(Date.now() + 7200000), // 2 hours expiration for the cookie
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // SameSite=None for cross-origin requests in production
    });

    res.status(200);
    res.json({
      success: true,
      message: "You are now logged in",
      role: user.role,
      userInfo: {
        fristName: user.firstname,
        lastname: user.lastname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while logging in. Please try again later.",
    });
  }
};

export const deleteAccount = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const userResult = await client.query(
      "SELECT * FROM userr WHERE email = $1",
      [email]
    );

    if (userResult.rowCount === 0) {
      // If the user does not exist, return 404
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = userResult.rows[0];

    // Validate the provided password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // Delete the user
    await client.query("DELETE FROM userr WHERE id = $1", [user.id]);

    // Respond with success message
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error.message);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while deleting the account. Please try again later.",
    });
  }
};

export const AccountRecovery = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await client.query("SELECT * FROM userr WHERE email = $1", [
      email,
    ]);
    console.log("email:", email);

    // console.log("user:", user);

    if (!user.rows[0]) {
      return res.status(404).json({
        success: false,
        message: "There is no user with the provided email!",
      });
    }

    // Generate a unique reset token
    // const resetToken = crypto.randomBytes(32).toString("hex");
    const resetToken = ResetPasswordToken(user);

    // await prisma.user.update({
    //   where: { email },
    //   data: {
    //     resetToken,
    //   },
    // });

    const resetLink = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_HOST_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
  <div style="width: 100%; padding:10px 0; max-width: 600px; margin: auto; text-align: center;
  font-family: Arial, sans-serif; border-radius: 10px; overflow: hidden;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="height: 300px;">
      <tr>
      <td style="text-align: center; padding: 20px;">
          <img src="https://res.cloudinary.com/dtjgj2odu/image/upload/v1734469383/ThiaLogo_nop3yd.png" 
          alt="Thia's Apparel Logo" width="120" height="120" 
          style="max-width: 100%; display: block; margin: auto; border-radius: 50%;">
        </td>
      </tr>
    </table>
    <div style="padding: 20px; color:  #0B0F29;">
     
      <p  style="display: inline-block; padding: 12px 24px; background: #F1ECEC; 
      border: 5px solid #0B0F29; color: #656363; text-decoration: none; font-weight: bold; border-radius: 5px;">
      Click the below link to reset your password.</p>

      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #0B0F29; 
      border: 5px solid #0B0F29; color: #F20000; text-decoration: none; font-weight: bold; border-radius: 5px;"
      onmouseover="this.style.background='#FFF'; this.style.color='#0B0F29';"
      onmouseout="this.style.background='#0B0F29'; this.style.color='#F20000';">Start Payment</a>
      
      <p style="font-size: 16px;">If you did not request this, please ignore this email.</p>
    </div>
  </div>
`,
    };
    await transporter.sendMail(mailOptions);
    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email!",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};
