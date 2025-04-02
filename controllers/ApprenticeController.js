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

export const registerApprentice = async (req, res) => {
  //request body
  try {
    const { email, firstName, lastName, phone, address, image } = req.body;

    // Check if all required fields are provided
    if (!email || !firstName || !lastName || !phone || !address || image) {
      return res.status(400).json({
        success: false,
        message: "A feild is missing. All fields are required!",
      });
    }



    //check if applicant already exist
    const apprentice = await client.query(
      "SELECT * FROM apprentice  WHERE email = $1 ",
      [email]
    );


    if (apprentice.rowCount > 0)
      return res
        .status(400)
        .json({ success: false, message: "Apprentice already exists" });

    // Validate email format

    //create new applicant
    const newUserApprentice = await client.query(
      "INSERT INTO apprentice  ( email, firstName, lastName, phone, address,  image ) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [email, firstName, lastName, phone, address, image]
    );

    // const verificationLink = `http://localhost:5173/verifyEmail?token=${verifyEmailToken}`;
    const message = `Congratulatio for more information on addmission procedures Visist our main Office at Mile 50 for addmission procedures or call 08134348537 for more information on addmission procedures`;

    await sendVerificationEmail(email, message);
    // sendVerificationEmail(email, message).catch((err) =>
    //   console.error("Email sending failed:", err)
    // );

    const userData = newUserApprentice.rows[0];
    delete userData.password; // Remove the password from the response
    return res.status(201).json({
      success: true,
      message: `Appentice Added successfully. Email has been sent to ${email}`,
      applicant: userData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
          <p style="font-size: 16px;">Click the button below to verify your email. This link is valid for 1 hour.</p>
          <p  style="display: inline-block; padding: 12px 24px; background: #F1ECEC; 
          border: 5px solid #0B0F29; color: #656363; text-decoration: none; font-weight: bold; border-radius: 5px;"
          
         >${message}</p>
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

export const getApprentice = async (req, res) => {
  try {
    const apprentice = await client.query("SELECT * FROM apprentice");
    if (apprentice.rowCount < 0) {
      return res.status(400).json({
        success: false,
        message: "There are no apprentice data currently",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Apprentice data recived successfully!",
      data: apprentice.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to retriev apprentoce data! ",
    });
  }
};

export const deleteApprentice = async (req, res) => {
  try {
    const { id } = req.body;
    const parsedId = parseInt(id); // Convert ID to integer
    console.log(parsedId);

    if (isNaN(parsedId)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    // Ensure client is imported and connected
    const apprentice = await client.query(
      "SELECT * FROM apprentice WHERE id = $1",
      [parsedId]
    );

    if (apprentice.rowCount < 1) {
      return res
        .status(404)
        .json({ success: false, message: "Apprentice not found" });
    }

    const deletedApprentice = await client.query(
      "DELETE FROM apprentice WHERE id = $1 RETURNING *",
      [parsedId]
    );

    if (deletedApprentice.rowCount > 0) {
      return res.status(200).json({
        success: true,
        message: "Apprentice deleted successfully",
        data: deletedApprentice.rows[0], // Send deleted record (optional)
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
    const deletedApprentice = await query("DELETE FROM apprentice");

    return res.status(200).json({
      success: true,
      message: "All apprentice  deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
