const productSchema = require("../models/ProductsModel");


const markExpiringProducts = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tenDaysLater = new Date();
  tenDaysLater.setDate(today.getDate() + 3);
  tenDaysLater.setHours(23, 59, 59, 999);

  // REMOVE OFFERS FOR EXPIRED PRODUCTS
  await productSchema.updateMany(
    {
      expiryDate: { $lt: today }
    },
    {
      $set: {
        isOffer: false,
        offerType: null,
        discountPercentage: 0
      }
    }
  );

  // APPLY OFFER FOR PRODUCTS ENTERING 10-DAY WINDOW
  await productSchema.updateMany(
    {
      expiryDate: { $gte: today, $lte: tenDaysLater },
      inStock: true
    },
    {
      $set: {
        isOffer: true,
        offerType: "DISCOUNT",
        discountPercentage: 20
      }
    }
  );

  console.log("✅ Offer check completed");
};

module.exports = markExpiringProducts;