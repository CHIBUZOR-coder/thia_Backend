import client from "../db.js";

export const AddToCart = async (req, res) => {
  try {
    const { clothId, quantity } = req.body;

    // // Check if quantity is a valid number
    // if (isNaN(quantity) || quantity <= 0) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Invalid quantity" });
    // }

    //Find the user cart if it exixt

    // //Alternative to Find the user cart if it exixt
    let userCart = await client.query("SELECT * FROM cart WHERE userId = $1", [
      req.user.id,
    ]);

    //create userCart if not existing
    if (userCart.rowCount === 0) {
      userCart = await client.query(
        "INSERT INTO cart (userId) VALUES($1)  RETURNING * ",
        [req.user.id]
      );
    }

    //check if  cloth that is to be added in the cart exists in cart
    // Check if the cloth exists in the database
    const cloth = await client.query(
      `SELECT id, price FROM cloth WHERE id = $1`,
      [clothId]
    );

    //  const price = cloth.rows[0].price;
    //  if (isNaN(price) || price <= 0) {
    //    return res
    //      .status(400)
    //      .json({ success: false, message: "Invalid price" });
    //  }

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
