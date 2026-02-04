const express = require("express");
const productSchema = require("../models/ProductsModel");
const { authMiddleware } = require("./authRoutes");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {CloudinaryStorage}=require("multer-storage-cloudinary")
const cloudinary=require("../config/cloudinary");

/* configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    cb(null, "uploads/"); // save files in uploads/ folder
  },
  filename: (req, file, cb) => {
  cb(null, Date.now() + path.extname(file.originalname));
}
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }
});

*/

// cloudinary storage for image instead of mutler

const storage=new CloudinaryStorage({
  cloudinary,
  params:{
    folder:"products",
    allowed_formats:["jpg", "png", "jpeg"],
    transformation: [
      { width: 600, height: 600, crop: "limit", quality: "auto" }
    ]
  },
})

const upload=multer({storage});

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
router.post("/",authMiddleware, (req, res,next) => {
  upload.single("image")(req, res, function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  }); }, async (req,res)=>{
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can add products" });
    }

    const { name, category, price, keywords,description,expiryDate } = req.body;


    if (!name || !category || !price) {
      return res.status(400).json({ message: "Required fields missing" });
    }


const imagePath = req.file ? req.file.secure_url: "";
      const newProduct = new productSchema({
      name,
      category,
      price,
      image: imagePath,
      expiryDate : expiryDate ? new Date(expiryDate) : null,
      description:description || "NO description yet",
      inStock: req.body.inStock !== undefined ? req.body.inStock : true,
      keywords: keywords
        ? keywords.split(",").map((k) => k.trim().toLowerCase())
        : [],
    });

    await newProduct.save()



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


// ✅ OFFERS — MUST BE BEFORE :id
// OFFERS: products expiring in next 7 days
// GET /api/products/offers
router.get("/offers", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    const tenDaysLater = new Date();
    tenDaysLater.setDate(today.getDate() + 10);
    tenDaysLater.setHours(23, 59, 59, 999); // end of 10th day

    const offers = await productSchema.find({
      expiryDate: { $exists: true, $gte: today, $lte: tenDaysLater },
      inStock: true
    }).sort({ expiryDate: 1 });

    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 3️⃣ Recommended products (MUST BE BEFORE :id)
router.get("/recommend/:id", async (req, res) => {
  try {
    const currentProduct = await productSchema.findById(req.params.id);
    if (!currentProduct) return res.status(404).json({ message: "Product not found" });

    const recommendedProducts = await productSchema.aggregate([
      { $match: { 
          category: currentProduct.category, 
          _id: { $ne: currentProduct._id }, 
          inStock: true 
      }},
      { $sample: { size: 4 } } // pick 3 random products
    ]);

    res.json(recommendedProducts);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// 4️⃣ Get single product (ALWAYS LAST)
router.get("/:id", async (req, res) => {
  try {
    const product = await productSchema.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Invalid product ID" });
  }
});




module.exports = router;

