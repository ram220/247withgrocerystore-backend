const express = require("express");
const router = express.Router();
const Order = require("../models/OrdersModel");
const Cart = require("../models/CartModel");
const PaymentTemp = require("../models/PaymentTempModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});




// 1. Create Razorpay order
router.post("/init", async (req, res) => {
  try {
    const { amount, userId, items } = req.body;

    console.log("AMOUNT RECEIVED:", amount, typeof amount);

    console.log(
      "RAZORPAY KEY ID:",
      process.env.RAZORPAY_KEY_ID ? "OK" : "MISSING"
    );

    console.log(
      "RAZORPAY KEY SECRET:",
      process.env.RAZORPAY_KEY_SECRET ? "OK" : "MISSING"
    );

    if (!amount || isNaN(amount) || amount <= 0) {
  return res.status(400).json({ message: "Invalid amount" });
}


    // Save temporary payment
    const tempPayment = new PaymentTemp({
      userId,
      items,
      totalAmount: amount,
      status: "Pending",
    });
    await tempPayment.save();

    const options = {
amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `rcpt_${tempPayment._id}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      tempPaymentId: tempPayment._id,
    });
  } catch (err) {
    console.error("Payment Init Error:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});

// 2. Verify Payment
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tempPaymentId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Get temp payment
      const tempPayment = await PaymentTemp.findById(tempPaymentId);
      if (!tempPayment) return res.status(400).json({ message: "Invalid payment reference" });

      // Create confirmed order
      const formattedItems = tempPayment.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      const newOrder = new Order({
        userId: tempPayment.userId,
        items: formattedItems,
        totalAmount: tempPayment.totalAmount,
        status: "Confirmed",
      });
      await newOrder.save();

      // Clear user cart
      await Cart.findOneAndUpdate({ userId: tempPayment.userId }, { $set: { items: [] } });

      // Delete temp payment
      await PaymentTemp.findByIdAndDelete(tempPayment._id);

      return res.json({ success: true, message: "Payment successful! Order placed." });
    } else {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (err) {
    console.error("Payment Verify Error:", err.message);
    res.status(500).json({ message: "Something went wrong" });
  }
});




module.exports = router;
