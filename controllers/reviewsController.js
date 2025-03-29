import client from "../db.js";
import path from "path";

console.log(path.resolve());
export const createReview = async (req, res) => {
  try {
    const user = req.user;
    const { text } = req.body;

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found. Please log in." });
    }

    // Insert a new review if the user has none, otherwise update the existing review
    const result = await client.query(
      `
      INSERT INTO review (userId, text)
      VALUES ($1, $2)
      ON CONFLICT (userId) 
      DO UPDATE SET text = EXCLUDED.text
      RETURNING *;
      `,
      [parseInt(user.id), text]
    );

    if (result.rowCount < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Unable to add/update user review!" });
    }

    return res.status(201).json({
      success: true,
      message: "Client review added/updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error in createReview:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while adding/updating review.",
      error: error.message,
    });
  }
};


export const getReviews = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT userr.firstName, userr.lastName, userr.image, review.text 
      FROM userr 
      JOIN review ON userr.id = review.userId
      WHERE review.text IS NOT NULL
    `);

    if (result.rowCount === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No users with reviews found!" });
    }

    return res.status(200).json({
      success: true,
      message: "User reviews retrieved successfully",
      reviews: result.rows, // Return the actual data
    });
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An error occurred while fetching reviews.",
    });
  }
};
