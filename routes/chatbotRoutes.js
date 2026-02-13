const express = require("express");
const jwt = require("jsonwebtoken");
const Cart = require("../models/CartModel");
const Product = require("../models/ProductsModel");

const detectIntent = require("../chatbot/intentDetector");
const extractEntities = require("../chatbot/entityExtractor");
const matchProduct = require("../chatbot/productMatcher");
const suggestProducts = require("../chatbot/productSuggester");

const matchProductInCart = require("../chatbot/cartProductMatcher");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

function cleanProductPhrase(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?]/g, "")          // ✅ remove punctuation
    .replace(/\b(add|buy|put|remove|increase|decrease)\b/g, "")
    .replace(/\b(by|of|the|quantity|one|two)\b/g, "")
    .trim();
}


const CART_POPULATE_FIELDS =
  "name price image isOffer discountPercentage keywords";



router.post("/", async (req, res) => {
  const { message } = req.body;

  // 🔐 OPTIONAL AUTH
  let userId = null;
  const authHeader = req.headers.authorization;

  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch {
      userId = null;
    }
  }

  try {
    // ✅ NORMALIZE TELUGU + SLANG
    const normalized = message.toLowerCase();

    const intent = detectIntent(normalized);

    switch (intent) {

      // ================= ADD TO CART =================
      case "ADD_TO_CART": {
  if (!userId) {
    return res.json({ reply: "Please login to add items to your cart" });
  }

  // 🔥 STEP 1: MATCH PRODUCT USING FULL TEXT
  const productPhrase = cleanProductPhrase(normalized);
const product = await matchProduct(productPhrase);


  if (!product) {
    const suggestions = await suggestProducts(normalized);
    return res.json({
      reply: suggestions.length
        ? "I couldn't find that product. Did you mean:\n" +
          suggestions.map(p => `• ${p.name}`).join("\n")
        : "Sorry, I couldn't find that product"
    });
  }

  // 🔥 STEP 2: NOW EXTRACT ENTITIES (PRODUCT AWARE)
  const entities = extractEntities(normalized, product);

  let cart = await Cart.findOne({ userId });
  if (!cart) cart = new Cart({ userId, items: [] });

  const item = cart.items.find(
    i => i.productId.toString() === product._id.toString()
  );

  if (item) {
    item.quantity += entities.quantity;
  } else {
    cart.items.push({
      productId: product._id,
      quantity: entities.quantity
    });
  }

  await cart.save();

  // 🔥 POPULATE PRODUCT DETAILS
    const populatedCart = await Cart.findOne({ userId })
    .populate("items.productId", CART_POPULATE_FIELDS);

  return res.json({
    reply: `Added ${product.name} to your cart`,
    cart: populatedCart.items
  });
}


      // ================= INCREASE QUANTITY =================
      case "INCREASE_QUANTITY": {
        if (!userId) {
          return res.json({ reply: "Please login to manage your cart" });
        }

        const cart = await Cart.findOne({ userId })
          .populate("items.productId", CART_POPULATE_FIELDS);        
          
          if (!cart || cart.items.length === 0) {
            return res.json({ reply: "Your cart is empty" });
          }

        const item = await matchProductInCart(cart, normalized);
        if (!item) {
          return res.json({ reply: "That product is not in your cart" });
        }

        // remove product name from text before extracting quantity
        let qtyText = normalized.replace(
          item.productId.name.toLowerCase(),
          ""
        );

        // now safely extract quantity
        const byMatch = qtyText.match(/\bby\s+(\d+)\b/);
        const qty = byMatch ? Number(byMatch[1]) : 1;

        item.quantity += qty;

        await cart.save();

        
        const populatedCart = await Cart.findOne({ userId })
          .populate("items.productId", CART_POPULATE_FIELDS);

        return res.json({
          reply: `Increased ${item.productId.name} quantity`,
          cart: populatedCart.items
        });
      }

      // ================= DECREASE QUANTITY =================
      case "DECREASE_QUANTITY": {
        if (!userId) {
          return res.json({ reply: "Please login first" });
        }

        const cart = await Cart.findOne({ userId })
          .populate("items.productId", CART_POPULATE_FIELDS);

        if (!cart || cart.items.length === 0) {
          return res.json({ reply: "Your cart is empty" });
        }

        const item =await matchProductInCart(cart, normalized);
        if (!item) {
          return res.json({ reply: "That product is not in your cart" });
        }

        // remove product name before extracting quantity
          let qtyText = normalized.replace(
            item.productId.name.toLowerCase(),
            ""
          );

          // now safely extract quantity
          const byMatch = qtyText.match(/\bby\s+(\d+)\b/);
          const qty = byMatch ? Number(byMatch[1]) : 1;

          item.quantity -= qty;

        if (item.quantity <= 0) {
          cart.items = cart.items.filter(
            i => i._id.toString() !== item._id.toString()
          );
        }

        await cart.save();

        const populatedCart = await Cart.findOne({ userId })
          .populate("items.productId", CART_POPULATE_FIELDS);

        return res.json({
          reply: `Decreased ${item.productId.name} quantity`,
          cart: populatedCart.items
        });
      }


      // ================= REMOVE FROM CART =================
      case "REMOVE_FROM_CART": {
        if (!userId) {
          return res.json({ reply: "Please login to manage your cart" });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
          return res.json({ reply: "Your cart is empty" });
        }

        const item = await matchProductInCart(cart, normalized);
        if (!item) {
          return res.json({ reply: "I couldn't find that product in your cart" });
        }

        cart.items = cart.items.filter(
          i => i.productId.toString() !== item.productId._id.toString()
        );

        await cart.save();

        
        const populatedCart = await Cart.findOne({ userId })
          .populate("items.productId", CART_POPULATE_FIELDS);

        return res.json({
          reply: `Removed ${item.productId.name} from your cart`,
          cart: populatedCart.items
        });
      }

      // ================= CLEAR CART =================
      case "CLEAR_CART": {
        if (!userId) {
          return res.json({ reply: "Please login to clear your cart" });
        }

        await Cart.findOneAndUpdate(
          { userId },
          { $set: { items: [] } }
        );

        return res.json({
          reply: "Your cart has been cleared",
          cart: []
        });
      }

      // ================= SHOW CART =================
      case "SHOW_CART": {
        if (!userId) {
          return res.json({ reply: "Please login to view your cart" });
        }

        const cart = await Cart.findOne({ userId })
          .populate("items.productId", CART_POPULATE_FIELDS);

        if (!cart || cart.items.length === 0) {
          return res.json({ reply: "Your cart is empty" });
        }

        const summary = cart.items
          .map(i => `${i.productId.name} × ${i.quantity}`)
          .join(", ");

        return res.json({
          reply: `Your cart contains: ${summary}`,
          cart: cart.items
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
            ? products.map(p => `${p.name} ₹${p.price}`).join(", ")
            : "No products found"
        });
      }

      // ================= DEFAULT =================
      default:
        return res.json({
          reply: "You can add, remove, increase, decrease items or ask about offers"
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
