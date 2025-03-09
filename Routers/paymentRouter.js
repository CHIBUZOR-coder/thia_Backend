import { initialisePayment } from "../controllers/paymentController.js";
import express from "express";
const paymentRouter = express.Router();

paymentRouter.post("/initiate_payment", initialisePayment);
export { paymentRouter };