const Product = require("../models/ProductsModel");

module.exports = async function matchProduct(productPhrase) {
  if (!productPhrase) return null;

  const phrase = productPhrase.toLowerCase().trim();
  const words = phrase.split(" ").filter(Boolean);

  const products = await Product.find({
    inStock: true,
    $or: [
      { name: { $regex: phrase, $options: "i" } },
      { keywords: { $regex: phrase, $options: "i" } }
    ]
  });

  if (!products.length) return null;

  let bestProduct = null;
  let bestScore = 0;

  for (const product of products) {
    let score = 0;

    const name = product.name.toLowerCase();
    const keywords = product.keywords.map(k => k.toLowerCase());

    // full phrase match (highest priority)
    if (name.includes(phrase)) score += 10;
    if (keywords.some(k => k.includes(phrase))) score += 10;

    // word-level match
    words.forEach(word => {
      if (name.includes(word)) score += 3;
      if (keywords.some(k => k.includes(word))) score += 5;
    });

    if (score > bestScore) {
      bestScore = score;
      bestProduct = product;
    }
  }

  return bestProduct;
};
