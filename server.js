import express from "express";
import pg from "pg";
import cors from "cors";
import cookieParser from "cookie-parser";
import { productRouter } from "./Routers/productRouter.js";
import { reviewsRoutes } from "./Routers/reviewsRoutes.js";
import { authRouter } from "./Routers/authUsersRouter.js";
import { cartRouter } from "./Routers/cartRoutr.js";
import { searchRoute } from "./Routers/searchRouter.js";
const app = express();
import dotenv from "dotenv";

dotenv.config();


const port = process.env.PORT || 3000;
// console.log(`Type of password: ${typeof process.env.DB_PASSWORD}`);
//Middlewares
app.use(
  cors({
    origin: "http://localhost:5173", // Ensure your frontend URL is allowed
    methods: ["GET", "POST"], // Allow specific HTTP methods
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



//Making Requests
app.listen(port, () => {
  console.log(`Server running sucefully at port: ${port}`);
  // console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  // console.log("API Key:", process.env.CLOUDINARY_API_KEY);
  // console.log("API Secret:", process.env.CLOUDINARY_API_SECRET);
});
