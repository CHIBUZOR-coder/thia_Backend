import client from "../db.js";

//create/register new user
import dotenv from "dotenv";
dotenv.config();

import { cloudinary } from "../config/cloudinary.js";
import { transporter } from "../config/email.js";

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
      "SELECT * FROM userr WHERE email = $1 ",
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
    const message = ` Hi ${email}, Your Application was successfull. Thank you for choosing Thia's Appareal,you will recive an addmission email if you are selected  `;

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
          { resource_type: "image", folder: "thia_applicant_image" },
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
            <td style="background: url('https://res.cloudinary.com/dtjgj2odu/image/upload/v1734469383/ThiaLogo_nop3yd.png') 
            no-repeat center center; background-size: cover;"></td>
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
