import { createReview, getReviews } from "../controllers/reviewsController.js";
import { verifyToken } from "../middlewares/authentication.js";
import express from "express";

//creating routes host for all reviews
const reviewsRoutes = express.Router();
//creating all routes and linking them to their controller
reviewsRoutes.post("/add_reviews", verifyToken, createReview);
reviewsRoutes.get("/get_client_reviews", getReviews);
export { reviewsRoutes };
