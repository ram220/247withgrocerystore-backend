module.exports = function detectIntent(text) {
  text = text.toLowerCase();

  // ================= CART =================
  if (/clear|empty/.test(text) && text.includes("cart"))
    return "CLEAR_CART";

  if (/show|view/.test(text) && text.includes("cart"))
    return "SHOW_CART";

  // ================= CHEAPEST BY CATEGORY (🔥 MUST BE BEFORE CHEAP_PRODUCTS)
  if (
    text.includes("cheapest") ||
    text.includes("lowest price") ||
    text.includes("low price")
  ) {
    return "CHEAPEST_BY_CATEGORY";
  }

  // ================= GENERIC CHEAP PRODUCTS
  if (/cheap|lowest/.test(text))
    return "CHEAP_PRODUCTS";

  // ================= CART ACTIONS =================
  if (/remove|delete/.test(text))
    return "REMOVE_FROM_CART";

  if (/decrease|reduce|less/.test(text))
    return "DECREASE_QUANTITY";

  if (/increase|add more|more|another|extra/.test(text))
    return "INCREASE_QUANTITY";

  if (/add|buy|put/.test(text))
    return "ADD_TO_CART";

  // ================= OFFERS =================
  if (/offer|discount/.test(text))
    return "SHOW_OFFERS";

  return "UNKNOWN";
};
