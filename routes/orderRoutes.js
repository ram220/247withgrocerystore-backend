const express = require("express");
const router = express.Router();
const Order = require("../models/OrdersModel");
const Cart = require("../models/CartModel");
const mongoose = require("mongoose");

// GET user orders
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }
    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate("items.productId", "name price image");
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Place COD order
router.post("/", async (req, res) => {
  try {
    const { userId, items, totalAmount, paymentMethod } = req.body;

    const newOrder = new Order({ userId, items, totalAmount, paymentMethod });
    await newOrder.save();

    // Clear user cart
    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    res.json({ success: true, order: newOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

module.exports = router;
