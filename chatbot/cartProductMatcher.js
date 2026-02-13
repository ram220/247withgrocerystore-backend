module.exports = function matchProductInCart(cart, phrase) {
  if (!phrase) return null;
  if (!cart || cart.items.length === 0) return null;

  const words = phrase.toLowerCase().split(/\s+/);

  let bestItem = null;
  let bestScore = 0;

  for (const item of cart.items) {
    const name = item.productId.name.toLowerCase();
    const keywords = (item.productId.keywords || []).map(k => k.toLowerCase());

    let score = 0;
    words.forEach(word => {
      if (name.includes(word)) score += 5;
      if (keywords.includes(word)) score += 3;
    });

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  return bestItem;
};
