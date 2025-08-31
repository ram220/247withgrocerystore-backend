const express = require('express');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const userModel = require('../models/UsersModel');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// -------------------- ROUTES --------------------

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, address, mobile, role } = req.body;
    const existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email, password: hashedPassword, address, mobile, role });
    await newUser.save();
    res.status(201).json({ message: "User Registered Successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
    res.status(200).json({
      message: "Login Successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        mobile: user.mobile
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID
router.get('/user/:id', async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------- MIDDLEWARE --------------------
function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // attach user data to request
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or Expired Token" });
  }
}

// Protected profile route
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- EXPORT --------------------
module.exports = { router, authMiddleware };
