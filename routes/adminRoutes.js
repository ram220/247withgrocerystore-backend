const express = require("express");
const router = express.Router();
const Order = require("../models/OrdersModel");
const { authMiddleware } = require("./authRoutes");

// GET all orders with pagination (admin only)
router.get("/all-orders", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can access this" });
    }

    let { page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 3; // default 10 orders per page
    const skip = (page - 1) * limit;

    // Fetch orders with pagination and LIFO (newest first)
    const orders = await Order.find()
      .populate("userId", "name email address mobile")
      .populate("items.productId", "name price image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments();

    res.json({
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update order status (admin only)
router.put("/update-status/:orderId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update orders" });
    }

    const { orderId } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

    res.json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/monthly-income", async (req, res) => {
  try {
    const income = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$orderDate" },
            month: { $month: "$orderDate" }
          },
          totalIncome: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // ✅ Calculate total income across all orders
    const totalIncome = income.reduce((sum, item) => sum + item.totalIncome, 0);

    res.json({ monthlyIncome: income, totalIncome });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
