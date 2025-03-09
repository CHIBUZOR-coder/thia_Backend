import bcrypt, { compare } from "bcrypt";
import client from "../db.js";
import { generateToken } from "../middlewares/generateToken.js";
//create/register new user
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid"; // <-- Add semicolon here

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

    //create new user
    const newUser = await client.query(
      "INSERT INTO userr  ( email, firstName, lastName, phone, address,  password,  address2, city, postal_code, country ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
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
      ]
    );

    const userData = newUser.rows[0];
    delete userData.password; // Remove the password from the response
    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: userData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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

