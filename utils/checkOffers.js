const productSchema = require("../models/ProductsModel");

const markExpiringProducts = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threshold = new Date();
  threshold.setDate(today.getDate() + 7);
  threshold.setHours(23, 59, 59, 999);

  await productSchema.updateMany(
    {
      expiryDate: { $gte: today, $lte: threshold },
    },
    {
      isOffer: true,
      offerType: "DISCOUNT",
      discountPercentage: 20,
    }
  );
};

module.exports = markExpiringProducts;
