import client from "../db.js";

export const AddToCart = async (req, res) => {
  try {
    const { clothId, quantity } = req.body;

    // Check if quantity is a valid number
    if (isNaN(quantity) || quantity <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid quantity" });
    }

    //Find the user cart if it exixt

    // //Alternative to Find the user cart if it exixt
    let userCart = await client.query("SELECT * FROM cart WHERE userId = $1", [
      req.user.id,
    ]);

    //create userCart if not existing
    if (userCart.rowCount === 0) {
      userCart = await client.query(
        "INSERT INTO cart (userId) VALUES($1) ON CONFLICT (userId) DO NOTHING RETURNING * ",
        [req.user.id]
      );
    }

    //check if  cloth that is to be added in the cart exists in cart
    // Check if the cloth exists in the database
    const cloth = await client.query(
      `SELECT id, price FROM cloth WHERE id = $1`,
      [clothId]
    );



    if (cloth.rowCount === 0)
      return res
        .status(400)
        .json({ success: false, message: "Product not found" });

    let cartItem = await client.query(
      "SELECT * FROM cartItems WHERE cartId = $1 AND clothsId = $2",
      [userCart.rows[0].id, cloth.rows[0].id]
    );

   

    //Update cartItems if it is found
    if (cartItem.rowCount > 0) {
      cartItem = await client.query(
        "UPDATE cartItems SET quantity = $1, amount = $2 WHERE id = $3 RETURNING *",
        [
          cartItem.rows[0].quantity + quantity,
          cloth.rows[0].price * (cartItem.rows[0].quantity + quantity),
          cartItem.rows[0].id,
        ]
      );

       res.status(200).json({
        success: true,
        message: "Cart item updated successfully",
        data: cartItem.rows[0],
      });
    } else {
      cartItem = await client.query(
        "INSERT INTO  cartItems (cartId,  clothsId,  amount,  quantity) VALUES($1, $2, $3, $4)  RETURNING*",
        [userCart.rows[0].id, clothId, cloth.rows[0].price * quantity, quantity]
      );
      return res.status(200).json({
        success: true,
        message: "product added to cart successfully",
        data: cartItem.rows[0],
      });
    }
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};




// export const getCart = async (req, res) => {
//   try {
//     const user = req.user;

//     // Validate user
//     if (!user) {
//       return res
//         .status(400)
//         .json({ success: false, message: "User not found. Please log in." });
//     }

//     // Fetch the user's cart
//     const cart = await client.query("SELECT * FROM cart WHERE userId = $1", [
//       user.id,
//     ]);

//     const cartitems = await client.query("SELECT amount, quantity, brand, style, price, size FROM cart  JOIN cartItems ON  cart.id = cartItems.cartId JOIN cloth ON cartItems.clothsId = cloth.id WHERE cart.id = $1", [cart.id])
    
//     // Check if cart exists
//     if (cartitems.rowCount === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "No cart found for this user." });
//     }

//     // Return cart details
//     return res.status(200).json({
//       success: true,
//       message: "CartItems retrieved successfully.",
//       data: cartitems.rows // Corrected from `ros` to `rows`
//     });
//   } catch (error) {
//     console.error({ message: error.message, stack: error.stack });
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error. Please try again later.",
//     });
//   }
// };


export const getCart = async (req, res) => {
  try {
    const user = req.user;

    // Validate user
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found. Please log in." });
    }

    // Fetch the user's cart
    const cart = await client.query("SELECT * FROM cart WHERE userId = $1", [
      user.id,
    ]);

    // Check if cart exists
    if (cart.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No cart found for this user." });
    }

    // Fetch cart items
    const cartId = cart.rows[0].id;
    // console.log("Cart ID:", cartId); // Debugging log
    const cartitems = await client.query(
      `SELECT 
         amount, 
         quantity, 
         brand, 
         style, 
         price, 
         size 
       FROM 
         cart  
       JOIN 
         cartItems ON cart.id = cartItems.cartId 
       JOIN 
         cloth ON cartItems.clothsId = cloth.id 
       WHERE 
         cart.id = $1`,
      [cartId]
    );

    // Log cart items result for debugging
    console.log("Cart Items Result:", cartitems);

    // Check if cart items exist
    if (cartitems.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No items found in the cart." });
    }

    // Return cart details
    return res.status(200).json({
      success: true,
      message: "Cart items retrieved successfully.",
      data: cartitems.rows, // Return all cart items
    });
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};
