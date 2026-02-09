const express = require("express");
const jwt = require("jsonwebtoken");
const Cart = require("../models/CartModel");
const Product = require("../models/ProductsModel");

const detectIntent = require("../chatbot/intentDetector");
const extractEntities = require("../chatbot/entityExtractor");
const matchProduct = require("../chatbot/productMatcher");
const suggestProducts = require("../chatbot/productSuggester");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/", async (req, res) => {
  const { message } = req.body;

  // 🔐 OPTIONAL AUTH (VERY IMPORTANT)
  let userId = null;
  const authHeader = req.headers.authorization;

  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      userId = null;
    }
  }

  try {
    const intent = detectIntent(message);
    const entities = extractEntities(message);

    switch (intent) {

      // ================= ADD TO CART =================
      case "ADD_TO_CART": {
        if (!userId) {
          return res.json({
            reply: "Please login to add items to your cart"
          });
        }

        const product = await matchProduct(entities.productPhrase);

        if (!product) {
          const suggestions = await suggestProducts(entities.productPhrase);
          return res.json({
            reply: suggestions.length
              ? "I couldn't find that product. Did you mean:\n" +
                suggestions.map(p => `• ${p.name}`).join("\n")
              : "Sorry, I couldn't find that product"
          });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) cart = new Cart({ userId, items: [] });

        const index = cart.items.findIndex(
          item => item.productId.toString() === product._id.toString()
        );

        if (index > -1) {
          cart.items[index].quantity += entities.quantity || 1;
        } else {
          cart.items.push({
            productId: product._id,
            quantity: entities.quantity || 1
          });
        }

        await cart.save();

        const populatedCart = await Cart.findOne({ userId })
          .populate("items.productId", "name price image isOffer discountPercentage expiryDate");

        return res.json({
          reply: `Added ${product.name} to your cart`,
          cart: populatedCart.items
        });
      }

      // ================= REMOVE FROM CART =================
      case "REMOVE_FROM_CART": {
        if (!userId) {
          return res.json({
            reply: "Please login to manage your cart"
          });
        }

        const product = await matchProduct(entities.productPhrase);
        if (!product) {
          return res.json({ reply: "I couldn't find that product in your cart" });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
          return res.json({ reply: "Your cart is empty" });
        }

        cart.items = cart.items.filter(
          item => item.productId.toString() !== product._id.toString()
        );

        await cart.save();

        const populatedCart = await Cart.findOne({ userId })
          .populate("items.productId", "name price image isOffer discountPercentage expiryDate");

        return res.json({
          reply: `Removed ${product.name} from your cart`,
          cart: populatedCart.items
        });
      }

      // ================= CLEAR CART =================
      case "CLEAR_CART": {
        if (!userId) {
          return res.json({
            reply: "Please login to clear your cart"
          });
        }

        await Cart.findOneAndUpdate(
          { userId },
          { $set: { items: [] } }
        );

        return res.json({
          reply: "Your cart has been cleared successfully",
          cart: []
        });
      }

      // ================= SHOW OFFERS =================
      case "SHOW_OFFERS": {
        const offers = await Product.find({ isOffer: true }).limit(3);
        return res.json({
          reply: offers.length
            ? `Today's offers: ${offers.map(p => p.name).join(", ")}`
            : "No offers available today"
        });
      }

      // ================= CHEAP PRODUCTS =================
      case "CHEAP_PRODUCTS": {
        const products = await Product.find({ inStock: true })
          .sort({ price: 1 })
          .limit(3);

        return res.json({
          reply: products.length
            ? `Cheapest products are: ${products
                .map(p => `${p.name} (₹${p.price})`)
                .join(", ")}`
            : "No products found"
        });
      }

      // ================= DEFAULT =================
      default:
        return res.json({
          reply: "You can ask me to add items, remove items, clear cart, check offers, or find cheap products"
        });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      reply: "Something went wrong. Please try again."
    });
  }
});

module.exports = router;
