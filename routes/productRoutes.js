const express = require("express");
const productSchema = require("../models/ProductsModel");
const { authMiddleware } = require("./authRoutes");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    cb(null, "uploads/"); // save files in uploads/ folder
  },
  filename: (req, file, cb) => {
  cb(null, Date.now() + path.extname(file.originalname));
}
});

const upload = multer({ storage });

// ✅ Fetch all products
router.get("/", async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (page && limit) {
      const products = await productSchema.find()
        .skip((page - 1) * limit)
        .limit(Number(limit));
      const total = await productSchema.countDocuments();
      return res.json({ products, total, totalPages: Math.ceil(total / limit) });
    }

    // Return products in same shape
    const products = await productSchema.find();
    res.json({ products });  // <-- changed here
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Add new product (admin only)
router.post("/",authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can add products" });
    }

    const { name, category, price, keywords } = req.body;

    // check uploaded files
    console.log("Uploaded files:", req.file);


    if (!name || !category || !price) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const newProduct = new productSchema({
      name,
      category,
      price,
      image: imagePath,
      inStock: req.body.inStock !== undefined ? req.body.inStock : true,
      keywords: keywords
        ? keywords.split(",").map((k) => k.trim().toLowerCase())
        : [],
    });

    await newProduct.save();
    res.status(201).json({ message: "Product Added Successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search products by keyword
router.get("/search", async (req, res) => {
  try {
    const keyword = req.query.keyword
      ? {
          name: { $regex: req.query.keyword, $options: "i" }, // case-insensitive
        }
      : {};

    const products = await productSchema.find(keyword);
    res.json({products});
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Update product (admin only)
// ✅ Update product (admin only)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update products" });
    }

    let { inStock } = req.body;
    if (typeof inStock === "string") {
      inStock = inStock === "true";
    }

    const updatedProduct = await productSchema.findByIdAndUpdate(
      req.params.id,
      { inStock },
      { new: true }
    );

    if (!updatedProduct) return res.status(404).json({ message: "Not found" });

    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});






module.exports = router;

