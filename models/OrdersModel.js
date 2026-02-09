const mongoose = require('mongoose');

const ordersSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "users",   // reference to Users collection
        required: true 
    },
    items: [
        {
            productId: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: "product", 
                required: true 
            },
            quantity: { type: Number, required: true, default: 1 },
            price: { type: Number, required: true }
        }
    ],
    totalAmount: { type: Number, required: true },
        paymentMethod: {
        type: String,
        enum: ["COD", "UPI"],
        default: "COD"
    },

    status: { type: String, enum: ["Pending", "Confirmed", "Delivered", "Cancelled"], default: "Pending" },
    orderDate: { type: Date, default: Date.now }
},{ timestamps: true });

module.exports = mongoose.model("Orders", ordersSchema);
