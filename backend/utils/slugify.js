const mongoose = require("mongoose");

const DEVANAGARI_MAP = {
  "अ": "a",
  "आ": "aa",
  "इ": "i",
  "ई": "ee",
  "उ": "u",
  "ऊ": "oo",
  "ए": "e",
  "ऐ": "ai",
  "ओ": "o",
  "औ": "au",
  "क": "k",
  "ख": "kh",
  "ग": "g",
  "घ": "gh",
  "ङ": "ng",
  "च": "ch",
  "छ": "chh",
  "ज": "j",
  "झ": "jh",
  "ञ": "ny",
  "ट": "t",
  "ठ": "th",
  "ड": "d",
  "ढ": "dh",
  "ण": "n",
  "त": "t",
  "थ": "th",
  "द": "d",
  "ध": "dh",
  "न": "n",
  "प": "p",
  "फ": "ph",
  "ब": "b",
  "भ": "bh",
  "म": "m",
  "य": "y",
  "र": "r",
  "ल": "l",
  "व": "v",
  "श": "sh",
  "ष": "sh",
  "स": "s",
  "ह": "h",
  "ि": "i",
  "ी": "ee",
  "ु": "u",
  "ू": "oo",
  "े": "e",
  "ै": "ai",
  "ो": "o",
  "ौ": "au",
  "्": "",
  "ं": "",
  "ँ": "",
  "ः": "",
  "़": "",
};

const toReadableSlug = (value) => {
  if (!value || typeof value !== "string") return "";

  const transliterated = Array.from(value)
    .map((char) => DEVANAGARI_MAP[char] || char)
    .join("");

  const normalized = transliterated
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized.slice(0, 90);
};

const generateUniqueSlug = async (baseName, existingId = null, model = null) => {
  const baseSlug = toReadableSlug(baseName) || "blog";
  const shortSuffix = Math.random().toString(36).slice(2, 8);
  let slug = `${baseSlug}-${shortSuffix}`;

  if (!model) {
    return slug;
  }

  let candidate = slug;
  let counter = 2;

  while (await model.findOne({ slug: candidate, _id: { $ne: existingId } })) {
    candidate = `${baseSlug}-${shortSuffix}-${counter}`;
    counter += 1;
  }

  return candidate;
};

const generateProductSlug = async (name, productId = null, ProductModel = null) => {
  const baseSlug = toReadableSlug(name);
  const fallbackBase = "product";
  const safeBase = (baseSlug || fallbackBase).slice(0, 70);
  const shortId = productId
    ? String(productId).slice(-6)
    : new mongoose.Types.ObjectId().toString().slice(-6);

  let slug = `${safeBase}-${shortId}`.slice(0, 80);
  slug = slug.replace(/-+/g, "-").replace(/^-|-$/g, "");

  if (!slug) {
    slug = `product-${shortId}`;
  }

  if (!ProductModel) {
    return slug;
  }

  let uniqueSlug = slug;
  let counter = 2;

  while (await ProductModel.findOne({ slug: uniqueSlug, _id: { $ne: productId } })) {
    uniqueSlug = `${slug}-${counter}`;
    counter += 1;
  }

  return uniqueSlug;
};

module.exports = {
  generateProductSlug,
  generateUniqueSlug,
  toReadableSlug,
};
