module.exports = function extractEntities(text, product = null) {
  let quantity = 1;

  if (!product) {
    return { quantity };
  }

  // extract quantity ONLY when "by <number>" is used
  const match = text.match(/by\s+(\d+)/);
  if (match) {
    quantity = Number(match[1]);
  }

  return { quantity };
};
