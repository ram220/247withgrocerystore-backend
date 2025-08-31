const express = require("express");
const router = express.Router();
const Order = require("../models/OrdersModel");
const Cart = require("../models/CartModel");
const PaymentTemp = require("../models/PaymentTempModel");

// Mock UPI payment initiation
router.post("/init", async (req, res) => {
  try {
    const { amount, userId, items } = req.body;

    // Save temporary payment
    const tempPayment = new PaymentTemp({
      userId,
      items,
      totalAmount: amount,
      status: "Pending",
    });
    await tempPayment.save();

    // Instead of opening real payment page, return a simulated payment page URL
    res.json({ redirectUrl: `/api/payment/simulate/${tempPayment._id}` });
  } catch (err) {
    console.error("Payment Init Error:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// Simulated payment page
router.get("/simulate/:tempId", async (req, res) => {
  try {
    const tempPayment = await PaymentTemp.findById(req.params.tempId);
    if (!tempPayment) return res.send("Invalid payment");

    // Automatically mark payment as success and call callback
    const formattedItems = tempPayment.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    }));

    const newOrder = new Order({
      userId: tempPayment.userId,
      items: formattedItems,
      totalAmount: tempPayment.totalAmount,
      status: "Confirmed"
    });
    await newOrder.save();

    // Clear user cart
    await Cart.findOneAndUpdate({ userId: tempPayment.userId }, { $set: { items: [] } });

    // Delete temp payment
    await PaymentTemp.findByIdAndDelete(tempPayment._id);

    res.send("Payment successful! Order placed.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
