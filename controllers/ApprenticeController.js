import bcrypt, { compare } from "bcrypt";
import client from "../db.js";
import { generateToken } from "../middlewares/generateToken.js";
//create/register new user
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid"; // <-- Add semicolon here
import { cloudinary } from "../config/cloudinary.js";
import jwt from "jsonwebtoken";
import { transporter } from "../config/email.js";
const FLW_SECRETE_KEY = process.env.FLW_SECRETE_KEY;
dotenv.config();

export const registerApprentice = async (req, res) => {
  //request body
  try {
    const { email, firstname, lastname, phone, address, image } = req.body;

    console.log("reqbody:", req.body);

    // Check if all required fields are provided
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email feild is missing and required!",
      });
    }
    if (!firstname) {
      return res.status(400).json({
        success: false,
        message: "FirstName is missing and is required!",
      });
    }
    if (!lastname) {
      return res.status(400).json({
        success: false,
        message: "LastName is missing and is required!",
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone feild is missing and is required!",
      });
    }
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image feild is missing and is required!",
      });
    }
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address feild is missing and is required!",
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
    const isUser = await client.query("SELECT * FROM userr WHERE email = $1", [
      email,
    ]);

    if (isUser.rowCount > 0) {
      await client.query(
        "UPDATE userr SET role = 'Apprentice' WHERE email = $1",
        [email]
      );
    }

    //create new applicant
    const newUserApprentice = await client.query(
      "INSERT INTO apprentice  ( email, firstname, lastname, phone, address,  image ) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [email, firstname, lastname, phone, address, image]
    );

    const PaymentLink = `http://localhost:5173/payment?email=${email}`;
    const message = `Congratulation, ${firstname} ${lastname}, You have be addmited to Thia's Appareal. Click below to start your payment procedure. Or Visist our main Office at Mile 50 for addmission procedures. You can also call 08134348537 for more information on addmission procedures`;

    await sendVerificationEmail(email, message, PaymentLink);
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

const sendVerificationEmail = async (email, message, PaymentLink) => {
  const mailOptions = {
    from: {
      name: "THIA'S APAREAL",
      address: process.env.EMAIL_HOST_USER,
    },
    to: email,
    subject: "Addmision Confirmation",
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
      ${message}</p>

      <a href="${PaymentLink}" style="display: inline-block; padding: 12px 24px; background: #0B0F29; 
      border: 5px solid #0B0F29; color: #F20000; text-decoration: none; font-weight: bold; border-radius: 5px;"
      onmouseover="this.style.background='#FFF'; this.style.color='#0B0F29';"
      onmouseout="this.style.background='#0B0F29'; this.style.color='#F20000';">Start Payment</a>
      
      <p style="font-size: 16px;">If you did not request this, please ignore this email.</p>
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

export const getSingleApprentice = async (req, res) => {
  try {
    const user = req.user;
    console.log("user:", req.user);

    const parsedId = parseInt(user.id);

    const apprentice = await client.query(
      "SELECT * FROM apprentice WHERE id = $1",
      [parsedId]
    );

    if (apprentice.rowCount === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Apprentice does not exist!" });
    }

    return res.status(200).json({
      success: true,
      message: "Apprentice data retrieved successfully",
      data: apprentice.rows[0],
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, please try again later!",
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

export const initialisePayment = async (req, res) => {
  try {
    const { email } = req.body;
    const bill = 20000;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required!",
      });
    }

    if (!bill || isNaN(parseFloat(bill))) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill amount",
      });
    }

    const apprenticeResult = await client.query(
      "SELECT * FROM apprentice WHERE email = $1",
      [email]
    );

    const apprentice = apprenticeResult.rows[0];

    if (!apprentice) {
      return res.status(404).json({
        success: false,
        message: `Apprentice with the email ${email} is not in the database`,
      });
    }

    const orderId = uuidv4();
    const redirectUrl = `http://localhost:5173/thankyou?orderId=${orderId}`;

    // Generate a dynamic payment link from Flutterwave API
    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRETE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: orderId,
        amount: bill,
        currency: "NGN",
        redirect_url: redirectUrl, // Redirect user after payment
        customer: {
          email: apprentice.email,
          name: `${apprentice.firstname} ${apprentice.lastname}`,
          phonenumber: apprentice.phone,
          address: apprentice.address,
        },
        customizations: {
          title: "Thia Fashion",
          description: "Payment for Addmission fee",
          logo: "https://res.cloudinary.com/dtjgj2odu/image/upload/v1734469383/ThiaLogo_nop3yd.png",
        },

        meta: {
          apprentuceId: apprentice.id,
          orderId,
          amount: bill,
          startDate: "January 2025",
          endDate: "December 2025",
          course: "Fashion Design",
        },
      }),
    });

    // 5531 8866 5214 2950

    const data = await response.json();

    if (data.status !== "success") {
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate payment link" });
    }

    console.log("Flutterwave Response:", data);
    console.log("Redirect URL:", redirectUrl);

    return res.status(200).json({
      success: true,
      message: "Payment link generated successfully",
      payment_link: data.data.link, // Use Flutterwave's dynamic link
      email,
    });
  } catch (error) {
    console.error(" Subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Subscription initiation failed due to an internal error",
    });
  }
};

export const verifyApprenticePyment = async (req, res) => {
  try {
    const { transaction_id, orderId, email } = req.body;
    console.log("reqBody:", req.body);

    if (!transaction_id || !orderId || !email) {
      return res.status(400).json({
        success: false,
        message: "transaction_Id, orderId, and email are required",
      });
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FLW_SECRETE_KEY}`,
        },
      }
    );

    const data = await response.json();

    let bill;
    if (data.data && data.data.meta) {
      try {
        bill = data?.data?.charged_amount;
        // console.log("Parsed Products:", products);
      } catch (error) {
        console.error("Error parsing products JSON:", error);
      }
    }
    if (!data.data || data.status !== "success") {
      return res
        .status(400)
        .json({ success: false, message: "Payment failed" });
    }
    console.log("verified data:", data);

    const Fetchedapprentice = await client.query(
      "SELECT * FROM apprentice WHERE email = $1",
      [email]
    );
    console.log("Fetchedapprentice:", Fetchedapprentice);
    const apprentice = Fetchedapprentice.rows[0];
    console.log("apprentice:", apprentice);
    if (!apprentice) {
      return res.status(404).json({
        success: false,
        message: "Unable to find Apprentice in database",
      });
    }

    let reciept;

    const existingReceipt = await client.query(
      "SELECT id FROM apprentice_reciept WHERE orderId = $1 AND transaction_id = $2",
      [orderId, transaction_id]
    );

    if (existingReceipt.rows[0]) {
      return res.status(400).json({
        success: false,
        message: "Receipt already exists for this transaction and order!",
      });
    }

    reciept = await client.query(
      `INSERT INTO apprentice_reciept (apprenticeId, orderId, transaction_id, bill, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [apprentice.id, orderId, transaction_id, bill, "Completed"]
    );

    //gggg
    return res.status(200).json({
      success: true,
      message: "Payment was successful",

      data: reciept.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Somthing went wrong",
    });
  }
};
