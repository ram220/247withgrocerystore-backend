module.exports = function extractEntities(text, product = null) {
  let quantity = 1;
  let weight = null;

  if (!product) return { quantity, weight };

  // 🔹 WEIGHT BASED
  if (product.unit === "KG") {
    if (/quarter|1\/4|0\.25/.test(text)) weight = 0.25;
    else if (/half|1\/2|0\.5/.test(text)) weight = 0.5;
    else {
      const kgMatch = text.match(/(\d+(\.\d+)?)\s*kg/);
      if (kgMatch) weight = Number(kgMatch[1]);
    }

    // default = 1kg
    if (!weight) weight = 1;

    return { quantity: 1, weight };
  }

  // 🔹 UNIT BASED
  const byMatch = text.match(/by\s+(\d+)/);
  if (byMatch) quantity = Number(byMatch[1]);

  return { quantity, weight };
};
