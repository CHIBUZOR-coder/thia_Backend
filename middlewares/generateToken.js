import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET_KEY;
if (!SECRET_KEY) {
  throw new Error("JWT_SECRET_KEY is missing in environment variables");
}
// Secret key for signing the token
// Replace with an actual secure key

/**
 * Generates a new token.
 * @param {string|number} userId - The ID of the user.
 * @param {string} userRole - The role of the user.
 * @returns {string} - A signed JWT token.
 */

//The above is a description of my generateToken function

// function generateToken(userId, userRole) {
//   try {
//     // Payload data
//     const payload = {
//       id: userId,
//       role: userRole,

//     };

//     //checking for userId and userRole
//     if (!userId || !userRole) {
//       throw new Error("userId and userRole are required to generate a token");
//     }
//     // Token options
//     const options = {
//       expiresIn: "2h", // Token validity duration (e.g., 1 hour)
//     };

//     // Generate and return the token
//     return jwt.sign(payload, SECRET_KEY, options);
//   } catch (error) {
//     console.error("Error generating token:", error.message);
//     throw error; // Rethrow the error to ensure the calling code handles it
//   }
// }

function generateToken(user) {
  try {
    const {
      id,
      role,
      email,
      firstname,
      lastname,
      address,
      phone,
      image,
      billAdress,
    } = user;

    // Validate required fields
    if (
      !id ||
      !role ||
      !email ||
      !firstname ||
      !lastname ||
      !address ||
      !phone ||
      !image ||
      !billAdress
    ) {
      throw new Error(
        "All user fields (id, role, email, firstname, lastname) are required to generate a token"
      );
    }

    // Payload data
    const payload = {
      id,
      role,
      email,
      firstname,
      lastname,
      address,
      phone,
      image,
      billAdress,
    };

    // Token options
    const options = {
      expiresIn: "2h", // Token validity duration (e.g., 2 hours)
    };

    // Generate and return the token
    return jwt.sign(payload, SECRET_KEY, options);
  } catch (error) {
    console.error("Error generating token:", error.message);
    throw error; // Rethrow the error to ensure the calling code handles it
  }
}

function ResetPasswordToken(user) {
  try {
    const { email } = user;
    console.log("user", user);

    if (!email) {
      console.log("emal is required");
    }

    // Payload data
    const payload = {
      email,
    };

    // Token options
    const options = {
      expiresIn: "15m", // Token validity duration (e.g., 2 hours)h
    };

    // Generate and return the token
    return jwt.sign(payload, SECRET_KEY, options);
  } catch (error) {
    console.error("Error generating token:", error.message);
    throw error; // Rethrow the error to ensure the calling code handles it
  }
}

// // Example usage:
// const token = generateToken(123, "admin");
// console.log("Generated Token:", token);
export { generateToken, ResetPasswordToken };
