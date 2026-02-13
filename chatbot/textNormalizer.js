/*module.exports = function normalizeText(text) {
  if (!text) return "";

  let t = text.toLowerCase();

  // remove punctuation
  t = t.replace(/[.,!?]/g, " ");

  // common wrong speech-to-text fixes
  const phoneticMap = {
    // ADD / ACTION words
    "pintu": "add",
    "pettu": "add",
    "petu": "add",
    "puttu": "add",
    "operative": "add",
    "property": "add",
    "paid": "add",
    "pid": "add",

    // quantities
    "okati": "1",
    "one": "1",
    "two": "2",
    "too": "2",
    "to": "2",
    "tu": "2",

    // rice mistakes
    "bhel": "bell",
    "bell": "bell",
    "27": "27",
    "twenty seven": "27",

    // vegetables & items
    "bangla": "potato",
    "dumpala": "potato",
    "alu": "potato",
    "aloo": "potato",

    "balu": "milk",
    "paalu": "milk",
    "pal": "milk",

    "nimmakayala": "lemon",
    "nimmakaya": "lemon",
    "lemon": "lemon",

    "cabbage": "cabbage",
    "gobi": "cabbage"
  };

  Object.keys(phoneticMap).forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, "g");
    t = t.replace(regex, phoneticMap[key]);
  });

  // cleanup extra spaces
  t = t.replace(/\s+/g, " ").trim();

  return t;
};*/
