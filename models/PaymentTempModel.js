const mongoose = require('mongoose');

const paymentTempSchema = new mongoose.Schema({
  merchantTransactionId: String,
  userId: String,
  items: Array,
  amount: Number,
}, { timestamps: true });

module.exports = mongoose.model('PaymentTemp', paymentTempSchema);
