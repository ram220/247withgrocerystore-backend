module.exports = function extractEntities(text) {
  text = text.toLowerCase();

  // remove punctuation
  text = text.replace(/[.,!?]/g, "");

  // quantity
  let quantity = 1;
  const qtyMatch = text.match(/\d+/);
  if (qtyMatch) quantity = Number(qtyMatch[0]);

  // unit detection
  let unit = null;
  if (text.includes("kg")) unit = "kg";
  else if (text.includes("g")) unit = "g";
  else if (text.includes("packet") || text.includes("packets")) unit = "packet";

  // clean product phrase
  const cleaned = text
    .replace(/\d+/g, "")
    .replace("kg", "")
    .replace("g", "")
    .replace("packet", "")
    .replace("packets", "")
    .replace("add", "")
    .replace("to cart", "")
    .replace("my cart", "")
    .replace("buy", "")
    .trim();

  return {
    productPhrase: cleaned,
    quantity,
    unit
  };
};
