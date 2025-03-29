import express from "express";
import {
  AddToCart,
  getCart,
  DeleteCartItem,
} from "../controllers/cartController.js";
import { verifyToken } from "../middlewares/authentication.js";
const cartRouter = express.Router();

cartRouter.post("/api/addToCart", verifyToken, AddToCart);
cartRouter.get("/api/getCart", verifyToken, getCart);
cartRouter.delete("/api/deleteCart", verifyToken, DeleteCartItem);
export { cartRouter };
