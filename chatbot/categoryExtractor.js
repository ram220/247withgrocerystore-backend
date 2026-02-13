module.exports = function extractCategory(text) {
  text = text.toLowerCase();

  const CATEGORY_MAP = {
    rice: ["rice"],
    oil: ["oil", "oils"],
    milk: ["milk"],
    vegetables: ["vegetable", "vegetables", "veggies"],
    fruits: ["fruit", "fruits"],
    dal: ["dal", "pulses"],
    atta: ["atta", "flour"]
  };

  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(k => text.includes(k))) {
      return category;
    }
  }

  return null;
};
