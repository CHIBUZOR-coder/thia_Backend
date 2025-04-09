import express from "express";
import pg from "pg";
import cors from "cors";
import cookieParser from "cookie-parser";
import { productRouter } from "./Routers/productRouter.js";
import { reviewsRoutes } from "./Routers/reviewsRoutes.js";
import { authRouter } from "./Routers/authUsersRouter.js";
import { applicantsRouter } from "./Routers/applicantsRouter.js";
import { apprenticeRouter } from "./Routers/apprenticeRouter.js";
import { cartRouter } from "./Routers/cartRoutr.js";
import { paymentRouter } from "./Routers/paymentRouter.js";
import { searchRoute } from "./Routers/searchRouter.js";
const app = express();
import dotenv from "dotenv";



dotenv.config();


const port = process.env.PORT || 5000;
// console.log(`Type of password: ${typeof process.env.DB_PASSWORD}`);
//Middlewares
app.use(
  cors({
    origin: "https://thia-e-comerce.vercel.app", // Ensure your frontend URL is allowed
    methods: ["GET", "POST", "DELETE", "PUT"], // Allow specific HTTP methods
    credentials: true, // Allow cookies and other credentials
  })
);






app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use cookie-parser middleware
app.use(cookieParser());

//Router middlewares
app.use("/", productRouter);
app.use("/", reviewsRoutes);
app.use("/", authRouter);
app.use("/", cartRouter);
app.use("/", searchRoute);
app.use("/", paymentRouter);
app.use("/", applicantsRouter);
app.use("/", apprenticeRouter);

//Making Requests
app.listen(port, () => {
  console.log(`Server running sucefully at port: ${port}`);
  // console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  // console.log("API Key:", process.env.CLOUDINARY_API_KEY);
  // console.log("API Secret:", process.env.CLOUDINARY_API_SECRET);
});
