import client from "../db.js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid"; // <-- Add semicolon here
import fetch from "node-fetch";
import { json } from "express";

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
      "SELECT cartItems.quantity, cloth.style, cloth.size, cloth.price, cloth.brand, cloth.image FROM cloth JOIN cartItems ON cartItems.clothsId = cloth.id JOIN cart ON cartItems.cartId = cart.id JOIN userr ON cart.userId = userr.id WHERE userr.id = $1 ",
      [user.id]
    );

    console.log("cartProduvcts:", cartProducts.rows);

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

        meta: {
          products: JSON.stringify(
            cartProducts.rows.map((product) => ({
              quantity: String(product.quantity),
              style: String(product.style),
              size: String(product.sizee),
              price: String(product.price),
              brand: String(product.brand),
              image: String(product.image),
            }))
          ),
        },
      }),
    });

    // 5531 8866 5214 2950

    const data = await response.json();
    let products;
    if (data.status !== "success") {
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate payment link" });
    }

    if (data.data && data.data.meta && data.data.meta.products) {
      try {
        products = JSON.parse(data.data.meta.products);
        console.log("Parsed Products:", products);
      } catch (error) {
        console.error("Error parsing products JSON:", error);
      }
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
        products,
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

export const verifyPyment = async (req, res) => {
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
    let products;
    let bill;
    if (data.data && data.data.meta && data.data.meta.products) {
      try {
        products = JSON.parse(data.data.meta.products);
        bill = data?.data?.amount_settled;
        console.log("Parsed Products:", products);
      } catch (error) {
        console.error("Error parsing products JSON:", error);
      }
    }
    if (!data.data || data.status !== "success") {
      return res
        .status(400)
        .json({ success: false, message: "Payment failed" });
    }
    console.log("verified data", data);

    const FetchedUser = await client.query(
      "SELECT * FROM userr WHERE email = $1",
      [email]
    );
    const user = FetchedUser.rows[0];
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Unable to find user" });
    }

    console.log("user:");

    let reciept;
    // const existingReceipt = await client.query(
    //   "SELECT * FROM cloth_receipt WHERE userId = $1 AND orderId = $2 AND transaction_id = $3",
    //   [user.id, orderId, transaction_id]
    // );

    const existingReceipt = await client.query(
      "SELECT id FROM cloth_receipt WHERE orderId = $1 AND transaction_id = $2",
      [orderId, transaction_id]
    );

    if (existingReceipt.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Receipt already exists for this transaction and order!",
      });
    }

    const totalQuantity = products.reduce(
      (sum, item) => sum + (parseInt(item.quantity, 10) || 0),
      0
    );

    reciept = await client.query(
      `INSERT INTO cloth_receipt (userId, orderId, transaction_id, products, bill,  product_Quantity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        user.id,
        orderId,
        transaction_id,
        JSON.stringify(products),
        bill,
        totalQuantity,
        "Completed",
      ]
    );

    await client.query("DELETE FROM cart WHERE cart.userId = $1", [user.id]);

    return res.status(200).json({
      success: true,
      message: "Payment was successfull",
      data: reciept.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Somthing went wrong",
    });
  }
};
