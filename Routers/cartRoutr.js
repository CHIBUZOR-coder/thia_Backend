import express from "express";
import { AddToCart, getCart } from "../controllers/cartController.js";
import { verifyToken } from "../middlewares/authentication.js";
const cartRouter = express.Router();

cartRouter.post("/api/addToCart", verifyToken, AddToCart);
cartRouter.get("/api/getCart", verifyToken, getCart);
export { cartRouter };
