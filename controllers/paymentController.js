import client from "../db.js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid"; // <-- Add semicolon here
import fetch from "node-fetch";

dotenv.config();
const FLW_SECRETE_KEY = process.env.FLW_SECRETE_KEY;
export const initialisePayment = async (req, res) => {
  try {
    const { email, bill } = req.body;
    if (!email || !bill) {
      return res.status(400).json({
        success: false,
        message: "Email and bill are required",
      });
    }

    if (!bill || isNaN(parseFloat(bill))) {
      return res.status(400).json({
        success: false,
        message: "Invalid bill amount",
      });
    }

    const userResult = await client.query(
      "SELECT * FROM userr WHERE email = $1",
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Unable to find user",
      });
    }
    const cartProducts = await client.query(
      "SELECT cartItems.quantity, cloth.style, cloth.price, cloth.brand, cloth.image FROM cloth JOIN cartItems ON cartItems.clothsId = cloth.id JOIN cart ON cartItems.cartId = cart.id JOIN userr ON cart.userId = userr.id WHERE userr.id = $1 ",
      [user.id]
    );

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
          email: user.email,
          name: user.name,
          phonenumber: user.phone,
        },
        customizations: {
          title: "Thia Fashion",
          description: "Payment for items in cart",
          // logo: "https://yourwebsite.com/logo.png",
        },
      }),
    });

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
      orderId,
      customer: {
        email: user.email,
        name: user.name,
        phonenumber: user.phone,
        products: cartProducts.rows,
      },
    });
  } catch (error) {
    console.error(" Subscription error:", error);
    return res.status(500).json({
      success: false,
      message: "Subscription initiation failed due to an internal error",
    });
  }
};
