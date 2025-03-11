import {
  initialisePayment,
  verifyPyment,
} from "../controllers/paymentController.js";
import express from "express";
const paymentRouter = express.Router();

paymentRouter.post("/initiate_payment", initialisePayment);
paymentRouter.post("/verify_payment", verifyPyment);
export { paymentRouter,  };