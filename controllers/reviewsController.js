import client from "../db.js";
import path from "path";


console.log(path.resolve()); 
export const createReview = async (req, res) => {
  try {
    // Check if the request body is an array
    const items = Array.isArray(req.body) ? req.body : [req.body];
    console.log(req.body);

    const insertedItems = [];

    for (const item of items) {
      const { name, image, location, text } = item;

      // Insert each item into the database
      const result = await client.query(
        `INSERT INTO  review (name, image, location, text) VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, image, location, text]
      );

      // Collect the inserted item
      insertedItems.push(result.rows[0]);
    }

    // Send a combined response with a success message and the created items
    res.status(201).json({ message: "Client data Added", data: insertedItems });
  } catch (error) {
    res.status(500).json({ error: error.message }); // Send error response
  }
};

export const getReviews = async (req, res) => {
  try {
    const result = await client.query(`SELECT * FROM review`); // Fixed the typo here
    res.status(201);
    res.json(result.rows); // Chained the response to the status and JSON
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
