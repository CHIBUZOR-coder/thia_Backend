import client from "../db.js";

// Search controller
export const getSearch = async (req, res) => {
  const searchTerm = req.query.q; // Extract 'q' parameter from the query string

  // Validate searchTerm
  if (!searchTerm || searchTerm.trim() === "") {
    return res.status(400).json({ error: "Search term cannot be empty" });
  }

  try {
    // Flexible search with partial matches


    // Add '%' wildcards for partial matching
 

    // Execute the query
    const result = await client.query( `
      SELECT * 
      FROM cloth 
      WHERE description ILIKE $1 
         OR brand ILIKE $1
    `, [`%${searchTerm}%`] );

    // Handle no results
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // Send the results back to the frontend
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(`[Search Error] Query failed: ${err.message}`)
    res.status(500).json({ error: "Failed to fetch products" });
  }
};
