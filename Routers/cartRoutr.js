import express from "express";
import { AddToCart } from "../controllers/cartController.js";
import { verifyToken } from "../middlewares/authentication.js";
const cartRouter = express.Router();

cartRouter.post("/api/addToCart", verifyToken, AddToCart);
export { cartRouter };
