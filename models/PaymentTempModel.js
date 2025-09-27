const mongoose = require('mongoose');

const paymentTempSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  totalAmount: { type: Number, required: true },  // match backend
  status: { type: String, default: "Pending" }    // add this
}, { timestamps: true });

module.exports = mongoose.model('PaymentTemp', paymentTempSchema);
