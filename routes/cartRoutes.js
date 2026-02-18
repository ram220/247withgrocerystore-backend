const express = require("express");
const Cart = require("../models/CartModel");
const Product = require("../models/ProductsModel");

const router = express.Router();

// Get user cart
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId })
      .populate("items.productId", "name price image unit isOffer discountPercentage expiryDate"); // ✅ populate product
    if (!cart) return res.json({ items: populatedCart.items });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Error fetching cart" });
  }
});



// Add to cart
router.post("/add", async (req, res) => {
  const { userId, productId, quantity,weight } = req.body;

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

    if (product.unit === "KG") {
      // 🔥 KG PRODUCT → USE WEIGHT
      if (itemIndex > -1) {
        cart.items[itemIndex].weight += weight;
      } else {
        cart.items.push({
          productId,
          quantity: 1,
          weight
        });
      }
    } else {
      // NORMAL PRODUCT
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();
     // ✅ repopulate before sending response
    const populatedCart = await Cart.findOne({ userId })
      .populate("items.productId", "name price image unit isOffer discountPercentage expiryDate");

    res.json({items:populatedCart.items});
  } catch (err) {
    res.status(500).json({ message: "Error adding to cart" });
  }
});

// Update cart item quantity
router.put("/update", async (req, res) => {
  try {
    const { userId, productId, quantity, weight } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      (i) => i.productId.toString() === productId
    );

    if (!item) return res.status(404).json({ message: "Item not found" });

    if (item.weight !== null) {
      item.weight = weight; // quantity = weight here
      item.quantity = 1;      // always keep quantity = 1 for KG
    } else {
      item.quantity = quantity;
    }



    await cart.save();

    const populatedCart = await Cart.findOne({ userId })
      .populate(
        "items.productId",
        "name price image unit isOffer discountPercentage expiryDate"
      );

    res.json({items:populatedCart.items});
  } catch (err) {
    res.status(500).json({ message: "Error updating quantity" });
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
      .populate("items.productId", "name price image unit isOffer discountPercentage expiryDate");

    res.json({items:populatedCart.items});
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
