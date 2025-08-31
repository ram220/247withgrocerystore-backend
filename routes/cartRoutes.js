const express = require("express");
const Cart = require("../models/CartModel");
const Product = require("../models/ProductsModel");

const router = express.Router();

// Get user cart
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId })
      .populate("items.productId", "name price image"); // ✅ populate product
    if (!cart) return res.json({ items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart" });
  }
});



// Add to cart
router.post("/add", async (req, res) => {
  const { userId, productId, quantity } = req.body;

  try {
      const product = await Product.findById(productId);
      if (!product.inStock) {
      return res.status(400).json({ message: "Product is out of stock" });
      }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // if no cart, create new
      cart = new Cart({ userId, items: [] });
    }

    // check if product already in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      // if exists, increase quantity
      cart.items[itemIndex].quantity += quantity || 1;
    } else {
      // if not, push new item
      cart.items.push({ productId, quantity: quantity || 1 });
    }

    await cart.save();
     // ✅ repopulate before sending response
    const populatedCart = await Cart.findOne({ userId })
      .populate("items.productId", "name price image");

    res.json(populatedCart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding to cart" });
  }
});


// ✅ Remove item
router.delete("/remove/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const cart = await Cart.findOne({ userId });

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await cart.save();
    // ✅ repopulate here too
    const populatedCart = await Cart.findOne({ userId })
      .populate("items.productId", "name price image");

    res.json(populatedCart);
  }
  catch (err) {
    res.status(500).json({ message: "Error removing item" });
  }
});

// ✅ Clear cart
router.delete("/clear/:userId", async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.params.userId });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: "Error clearing cart" });
  }
});

module.exports = router;
