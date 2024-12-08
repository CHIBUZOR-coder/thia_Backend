import { createReview, getReviews } from "../controllers/reviewsController.js";
import express from "express";

//creating routes host for all reviews
const reviewsRoutes = express.Router();
//creating all routes and linking them to their controller
reviewsRoutes.post("/api/client/reviews", createReview);
reviewsRoutes.get("/api/getclient/reviews/", getReviews);
export { reviewsRoutes };
