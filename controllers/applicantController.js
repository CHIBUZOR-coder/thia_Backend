import bcrypt, { compare } from "bcrypt";
import client from "../db.js";
import { generateToken } from "../middlewares/generateToken.js";
//create/register new user
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid"; // <-- Add semicolon here
import { cloudinary } from "../config/cloudinary.js";
import jwt from "jsonwebtoken";
import { transporter } from "../config/email.js";
dotenv.config();

export const registerApplicants = async (req, res) => {
  //request body
  try {
    const { email, firstName, lastName, phone, address } = req.body;

    // Check if all required fields are provided
    if (!email || !firstName || !lastName || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "A feild is missing. All fields are required!",
      });
    }

    let imageUrl;
    if (!req.file) {
      return res.status(400).json({ message: " profile photo is requirwd" });
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
        return res.status(500).json({ success: false, message: error.message });
      }
    }

    //check if applicant already exist
    const applicant = await client.query(
      "SELECT * FROM applicants  WHERE email = $1 ",
      [email]
    );
    if (applicant.rowCount > 0)
      return res
        .status(400)
        .json({ success: false, message: "Applicant already exists" });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    //create new applicant
    const newUserApplicant = await client.query(
      "INSERT INTO applicants  ( email, firstName, lastName, phone, address,  image ) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [email, firstName, lastName, phone, address, imageUrl]
    );

    // const verificationLink = `http://localhost:5173/verifyEmail?token=${verifyEmailToken}`;
    const message = ` Hi ${email}, Your Application was successfull. Thank you for choosing Thia's Appareal, you will recive an addmission email if you are selected  `;

    await sendVerificationEmail(email, message);
    // sendVerificationEmail(email, message).catch((err) =>
    //   console.error("Email sending failed:", err)
    // );

    const userData = newUserApplicant.rows[0];
    delete userData.password; // Remove the password from the response
    return res.status(201).json({
      success: true,
      message:
        "Application successfully. Please check your email for verification..",
      applicant: userData,
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
          { resource_type: "image", folder: "thia_applicants_image" },
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
const sendVerificationEmail = async (email, message) => {
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
          <td style="text-align: center; padding: 20px;">
              <img src="https://res.cloudinary.com/dtjgj2odu/image/upload/v1734469383/ThiaLogo_nop3yd.png" 
              alt="Thia's Apparel Logo" width="120" height="120" 
              style="max-width: 100%; display: block; margin: auto; border-radius: 50%;">
            </td>
          </tr>
        </table>
        <div style="padding: 20px; color:  #0B0F29;">
         
          <p  style="display: inline-block; padding: 12px 24px; background: #F1ECEC; 
          border: 5px solid #0B0F29; color: #656363; text-decoration: none; font-weight: bold; border-radius: 5px;">${message}</p>
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

export const getApplicants = async (req, res) => {
  try {
    const applicants = await client.query("SELECT * FROM applicants");
    if (applicants.rowCount < 0) {
      return res.status(400).json({
        success: false,
        message: "There are no applicants data currently",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Applicants data recived successfully!",
      data: applicants.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to retriev applicants data! ",
    });
  }
};

export const deleteApplicant = async (req, res) => {
  try {
    const { id } = req.body;
    const parsedId = parseInt(id); // Convert ID to integer
    console.log(parsedId);

    if (isNaN(parsedId)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    // Ensure client is imported and connected
    const applicant = await client.query(
      "SELECT * FROM applicants WHERE id = $1",
      [parsedId]
    );

    if (applicant.rowCount < 1) {
      return res
        .status(404)
        .json({ success: false, message: "Applicant not found" });
    }

    const deletedApplicant = await client.query(
      "DELETE FROM applicants WHERE id = $1 RETURNING *",
      [parsedId]
    );

    if (deletedApplicant.rowCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Applicant deleted successfully",
        data: deletedApplicant.rows[0], // Send deleted record (optional)
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Failed to delete applicant",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const AlldeleteApplcant = async (req, res) => {
  try {
    const deletedApplicant = await query("DELETE FROM applicants");

    return res.status(200).json({
      success: true,
      message: "All applicants deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
