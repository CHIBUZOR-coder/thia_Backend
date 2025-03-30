import client from '../db.js'

export const AddToCart = async (req, res) => {
  try {
    const { clothId, quantity, sizee } = req.body

    // Check if quantity is a valid number
    if (isNaN(quantity) || quantity <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid quantity' })
    }

    if (!sizee) {
      return res
        .status(400)
        .json({ success: false, message: 'Size is required' })
    }
    //Find the user cart if it exixt

    // //Alternative to Find the user cart if it exixt
    let userCart = await client.query('SELECT * FROM cart WHERE userId = $1', [
      req.user.id
    ])

    //create userCart if not existing
    if (userCart.rowCount === 0) {
      userCart = await client.query(
        'INSERT INTO cart (userId) VALUES($1) ON CONFLICT (userId) DO NOTHING RETURNING * ',
        [req.user.id]
      )
    }

    //check if  cloth that is to be added in the cart exists in cart
    // Check if the cloth exists in the database
    const cloth = await client.query(
      `SELECT id, price FROM cloth WHERE id = $1`,
      [clothId]
    )

    if (cloth.rowCount === 0)
      return res
        .status(400)
        .json({ success: false, message: 'Product not found' })

    let cartItem = await client.query(
      'SELECT * FROM cartItems WHERE cartId = $1 AND clothsId = $2',
      [userCart.rows[0].id, cloth.rows[0].id]
    )

    //Update cartItems if it is found
    if (cartItem.rowCount > 0) {
      cartItem = await client.query(
        'UPDATE cartItems SET quantity = $1, amount = $2, sizee = $3 WHERE id = $4 RETURNING *',
        [
          cartItem.rows[0].quantity + quantity,
          cloth.rows[0].price * (cartItem.rows[0].quantity + quantity),
          sizee,
          cartItem.rows[0].id
        ]
      )

      res.status(200).json({
        success: true,
        message: 'Cart item updated successfully',
        data: cartItem.rows[0]
      })
    } else {
      cartItem = await client.query(
        'INSERT INTO  cartItems (cartId,  clothsId,  amount,  quantity, sizee) VALUES($1, $2, $3, $4, $5)  RETURNING*',
        [
          userCart.rows[0].id,
          clothId,
          cloth.rows[0].price * quantity,
          quantity,
          sizee
        ]
      )
      return res.status(200).json({
        success: true,
        message: 'product added to cart successfully',
        data: cartItem.rows[0]
      })
    }
  } catch (error) {
    console.error({ message: error.message, stack: error.stack })
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error' })
  }
}

// ***********************************
// ***********************************

export const getCart = async (req, res) => {
  try {
    const user = req.user

    // Validate user
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found. Please log in.' })
    }

    // Fetch the user's cart
    const cart = await client.query(
      `SELECT cart.id, style, sizee, quantity, amount, image, brand 
   FROM cart 
   JOIN cartItems ON cart.id = cartItems.cartId 
   JOIN cloth ON cloth.id = cartItems.clothsId 
   WHERE userId = $1;`,
      [user.id]
    )

    //user.id
    // Check if cart exists
    if (cart.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No cart found for this user.' })
    }

    // Fetch cart items
    const cartId = cart.rows[0].id
    // console.log("Cart ID:", cartId); // Debugging log
    const cartitems = await client.query(
      `SELECT 
       cloth.id AS id,
         amount, 
         quantity, 
         brand, 
         style, 
         price, 
         sizee ,
         image
       FROM 
         cart  
       JOIN 
         cartItems ON cart.id = cartItems.cartId 
       JOIN 
         cloth ON cartItems.clothsId = cloth.id 
       WHERE 
         cart.id = $1`,
      [cartId]
    )

    // Log cart items result for debugging
    // console.log("Cart Items Result:", cartitems);

    // Check if cart items exist
    if (cartitems.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'No items found in the cart.' })
    }

    // Return cart details
    return res.status(200).json({
      success: true,
      message: 'Cart items retrieved successfully.',
      data: cartitems.rows // Return all cart items
    })
  } catch (error) {
    console.error({ message: error.message, stack: error.stack })
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    })
  }
}

// ***********************************
// ***********************************

export const DeleteCartItem = async (req, res) => {
  try {
    const { userId, itemId } = req.body
    console.log('body:', req.body)

    if (!itemId) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing item id' })
    }
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing user id' })
    }
    const parsedItemId = parseInt(itemId, 10)

    const Fetcheduser = await client.query(
      `SELECT * FROM userr WHERE userr.id = $1`,
      [userId]
    )

    let user
    if (Fetcheduser.rowCount === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Unable to find user!' })
    }
    user = Fetcheduser.rows[0]
    console.log('user:', user)

    let Usercart
    const FetchedUserCart = await client.query(
      `SELECT * 
   FROM cartItems 
   JOIN cart ON cart.id = cartItems.cartId 
   JOIN cloth ON cloth.id = cartItems.clothsId 
   WHERE cart.userId = $1`,
      [user.id]
    )

    // const cloth = await client.query(
    //   `SELECT id, price FROM cloth WHERE id = $1`,
    //   [clothId]
    // )

    if (FetchedUserCart.rowCount < 1) {
      return res
        .status(404)
        .json({ success: false, message: 'Unable to find cart!' })
    }
    Usercart = FetchedUserCart.rows
    const itemCheck = await client.query(
      `SELECT * FROM cartItems WHERE cartItems.clothsId = $1`,
      [parsedItemId]
    )
    if (itemCheck.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Cart item not found!' })
    }
    console.log("item", itemCheck);
    
    if (itemCheck.rows[0].quantity > 1) {
      const clothPrice = await client.query(
        `SELECT price FROM cloth WHERE id = $1`,
        [parsedItemId]
      )
      if (cloth.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: 'Item price not found!' })
      }

      const UpdatedCartItem = await client.query(
        'UPDATE cartItems SET quantity = $1, amount = $2, sizee = $3 WHERE id = $4 RETURNING *',
        [
          itemCheck.rows[0].quantity - 1,
          clothPrice.rows[0].price * (itemCheck.rows[0].quantity - 1),
          itemCheck.rows[0].sizee,
          itemCheck.rows[0].id
        ]
      )
      return res.status(200).json({
        success: true,
        message: 'cartItem deleted successfully',
        data: UpdatedCartItem
      })
    } else {
      const remainingCart = Usercart.filter(item => item.id !== parsedItemId)
      if (remainingCart.length === Usercart.length) {
        return res
          .status(400)
          .json({ success: false, message: 'Unable to delete cart' })
      }

      // Delete item from database
      await client.query(
        `DELETE FROM cartItems WHERE cartItems.clothsId = $1`,
        [parsedItemId]
      )
      return res.status(200).json({
        success: true,
        message: 'cartItem deleted successfully',
        data: remainingCart
      })
    }
  } catch (error) {
    console.log('errorMessage:', error.message)
    return res.status(500).json({ success: false, message: error.message })
  }
}
