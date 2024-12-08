import express from "express";
import { paginateResults } from "../middlewares/paginator.js";
import {
  crateProduct,
  getAllProducts,
  getAllProductsAdmin,
} from "../controllers/productController.js";
import uploads from "../middlewares/uploads.js"; // Import the uploads middleware

// Create a router
const productRouter = express.Router();

// Define the route and link it with the controller, applying the uploads middleware
productRouter.post("/api/Cloths", uploads.single("image"), crateProduct);


//User get link
productRouter.get("/api/Cloths", getAllProducts);
//Admin get link
productRouter.get("/api/ClothsAdmin", paginateResults(getAllProductsAdmin)); // Apply middleware
// Export the router
export { productRouter };
