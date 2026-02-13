module.exports = function detectIntent(text) {
  text = text.toLowerCase();

  if (/clear|empty/.test(text) && text.includes("cart"))
    return "CLEAR_CART";

  if (/show|view/.test(text) && text.includes("cart"))
    return "SHOW_CART";

  if (/remove|delete/.test(text))
    return "REMOVE_FROM_CART";

  if (/decrease|reduce|less/.test(text))
    return "DECREASE_QUANTITY";

  if (/increase|add more|more|another|extra/.test(text))
    return "INCREASE_QUANTITY";

  if (/add|buy|put/.test(text))
    return "ADD_TO_CART";

  if (/offer|discount/.test(text))
    return "SHOW_OFFERS";

  if (/cheap|lowest|low price/.test(text))
    return "CHEAP_PRODUCTS";

  return "UNKNOWN";
};
