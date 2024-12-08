export const paginateResults = (query) => async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const endIndex = page * limit;
    const startIndex = (page - 1) * limit;

    const result = await query(); // Call the query function (e.g., getAllProductsAdmin)

    if (!result || !result.rows) {
      return res
        .status(500)
        .json({ message: "Error: Data format not correct." });
    }

    const results = {
      pagination: {},
      results: result.rows.slice(startIndex, endIndex),
    };

    if (endIndex < result.rows.length) {
      results.pagination.next = { page: page + 1, limit };
    }

    if (startIndex > 0) {
      results.pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json(results); // Send the response from the middleware
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
