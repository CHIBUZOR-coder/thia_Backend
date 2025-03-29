import express from "express";
const router = express.Router();
import { verifyEmail } from "../controllers/authController";

router.get("/verifyEmail", verifyEmail);
