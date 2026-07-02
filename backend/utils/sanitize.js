const stripDangerousContent = (value = "") => {
  if (typeof value !== "string") return "";

  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/\son\w+=(["']).*?\1/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .replace(/\u0000/g, "")
    .trim();
};

const sanitizePlainText = (value = "") => {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const sanitizeTextArray = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .filter(Boolean)
    .map((item) => sanitizePlainText(String(item)))
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);
};

module.exports = {
  stripDangerousContent,
  sanitizePlainText,
  sanitizeTextArray,
};
