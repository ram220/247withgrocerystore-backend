module.exports = function detectIntent(text) {
  text = text.toLowerCase();

  // ADD TO CART
  if (
    text.includes("add") ||
    text.includes("put") ||
    text.includes("buy")
  ) {
    return "ADD_TO_CART";
  }

  // REMOVE FROM CART
  if (
    text.includes("remove") ||
    text.includes("delete")
  ) {
    return "REMOVE_FROM_CART";
  }

  // CLEAR CART (🔥 THIS IS YOUR ISSUE)
  if (
    text.includes("clear cart") ||
    text.includes("clear my cart") ||
    text.includes("empty cart") ||
    text.includes("empty my cart")
  ) {
    return "CLEAR_CART";
  }

  // OFFERS
  if (
    text.includes("offer") ||
    text.includes("discount")
  ) {
    return "SHOW_OFFERS";
  }

  // CHEAP PRODUCTS
  if (
    text.includes("cheap") ||
    text.includes("lowest price") ||
    text.includes("low price")
  ) {
    return "CHEAP_PRODUCTS";
  }

  return "UNKNOWN";
};
