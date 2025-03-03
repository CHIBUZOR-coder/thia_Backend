import client from "../db.js";
import { cloudinary } from "../config/cloudinary.js";

export const crateProduct = async (req, res) => {
  try {
    const { brand, style, category, price, description, size, status } =
      req.body; // Corrected this line

console.log(req.body);

          
    let imageUrl = null;

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    // Check if a file is attached and handle the image upload
    if (req.file) {
      console.log("Starting image upload...");
      // console.log("File buffer:", req.file.buffer); 

      try {
        // Use async/await to handle the image upload process
        imageUrl = await uploadImageToCloudinary(req.file.buffer);


        // After the upload completes, log the image URL
        console.log("Image URL after upload:", imageUrl);
      } catch (error) {
        console.error("Error during upload:", error);
        return res
          .status(500)
          .json({ success: false, message: "Image upload failed" });
      }
    }

    // Handle the case where imageUrl is null (upload failed)
    if (!imageUrl) {
      return res
        .status(400)
        .json({ success: false, message: "Image upload failed" });
    }

    // Check if the product already exists
    const existingProduct = await client.query(
      "SELECT * FROM cloth WHERE brand = $1 AND style = $2 AND category = $3 AND description = $4",
      [brand, style, category, description]
    );

    // Insert the product into the database with the image URL from Cloudinary
    const result = await client.query(
      "INSERT INTO cloth (brand, style, category, price, image, status, description, size) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        brand,
        style,
        category,
        price,
        imageUrl, // Use the image URL after upload
        status,
        description,
        size,
      ]
    );

    // Send response based on success and existing items
    if (existingProduct.rows.length > 0 && result.rowCount > 0) {
      return res.status(201).json({
        message: "Some products were added, but some already exist.",
        added: result.rows,
        existing: existingProduct.rows,
      });
    } else if (existingProduct.rows.length > 0) {
      return res.status(400).json({
        message: " products already exist.",
        existing: existingProduct.rows,
      });
    } else {
      return res.status(201).json({
        message: "Product was added successfully.",
        added: result.rows,
      });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



const uploadImageToCloudinary = async (fileBuffer) => {
  try {
    const uploadPromise = new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { resource_type: "image", folder: "product_image" },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        )
        .end(fileBuffer);
    });

    const result = await uploadPromise;
    console.log("Upload successful:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Image upload failed");
  }
};

// Getting All products for user
export const getAllProducts = async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM cloth"); // Fixed the typo here
    res.status(200);
    res.json(result.rows); // Chained the response to the status and JSON
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Getting All products for Admin
export const getAllProductsAdmin = async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM cloth");
    return result; // Return the entire result object
  } catch (error) {
    console.error(error);
    throw new Error("Database query failed."); // Propagate the error to the middleware
  }
};



