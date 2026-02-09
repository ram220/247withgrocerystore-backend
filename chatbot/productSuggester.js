const Product = require("../models/ProductsModel");

module.exports = async function suggestProducts(productPhrase) {
  if (!productPhrase) return [];

  const words = productPhrase.split(" ");

  const products = await Product.find({
    keywords: { $in: words },
    inStock: true
  }).limit(5);

  return products;
};
