const dotenv = require('dotenv');
dotenv.config();
const express = require("express");
const connectDb = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const { router: authRouter, authMiddleware } = require('./routes/authRoutes');
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");


const markExpiringProducts = require("./utils/checkOffers");

const chatbotRoutes=require('./routes/chatbotRoutes');


const cors = require("cors");



connectDb(); // Make sure your db connection uses process.env.MONGO_URI

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://two47withgrocerystoreram-frontend.onrender.com",
    "https://247withmygrocerystore.vercel.app"  // <-- add this
  ],
  credentials: true
}));

app.use('/api/products', productRoutes);
app.use('/api/auth', authRouter);
app.use("/api/cart", cartRoutes);
//app.use("/uploads", express.static("uploads"));
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot",chatbotRoutes);


markExpiringProducts();


// Optional: run every 24 hours
const cron = require("node-cron");
cron.schedule("0 0 * * *", async () => {
  await markExpiringProducts();
  console.log("Daily offer check complete");
});

app.get("/", (req, res) => {
    res.send("Hello from the server");
});

// Use dynamic port for cloud deployment
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started on port: ${port}`);
});
