import nodemailer from "nodemailer"
import dotenv from "dotenv";
dotenv.config();
const hostUser = process.env.EMAIL_HOST_USER;
const host = process.env.EMAIL_HOST;
const pass = process.env.EMAIL_HOST_PASSWORD;


export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // Use 465 if using SSL
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  },
});


