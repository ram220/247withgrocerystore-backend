const Product = require("../models/ProductsModel");

module.exports = async function matchProduct(input) {
  if (!input) return null;

  const phrase = input.toLowerCase().trim();

  // 1️⃣ EXACT NAME MATCH (case-insensitive)
  let product = await Product.findOne({
    name: { $regex: new RegExp(`^${phrase}$`, "i") }
  });

  if (product) return product;

  // 2️⃣ PARTIAL NAME MATCH (MOST IMPORTANT)
  product = await Product.findOne({
    name: { $regex: phrase, $options: "i" }
  });

  if (product) return product;

  // 3️⃣ KEYWORD MATCH
  product = await Product.findOne({
    keywords: { $in: phrase.split(" ") }
  });

  if (product) return product;

  // 4️⃣ FALLBACK: ANY WORD MATCH
  const words = phrase.split(" ");
  return await Product.findOne({
    $or: [
      { name: { $regex: words.join("|"), $options: "i" } },
      { keywords: { $in: words } }
    ]
  });
};
