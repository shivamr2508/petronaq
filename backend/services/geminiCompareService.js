const { GoogleGenAI } = require("@google/genai");

/* ═══════════════════════════════════════════════════════════════════════════════
   Gemini Compare Service — PetRonaq AI Compare Engine (Phase 4C)
   
   Provides structured comparison prompt generation and Google Gemini API
   integration returning strict valid JSON for comparing up to 3 pet products.
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Builds the structured prompt to send to the Gemini model requesting strict JSON.
 *
 * @param {Object} params - Prompt builder parameters
 * @param {Array} params.products - Array of product objects to compare
 * @param {string} [params.petType] - Target pet type (e.g., Dog, Cat)
 * @param {string} [params.breed] - Target pet breed (optional)
 * @returns {string} - Formatted plain text prompt asking for JSON
 */
function buildComparisonPrompt({ products = [], petType = "", breed = "" }) {
  const formattedProducts = products
    .map((product, index) => {
      const id = product._id ? String(product._id) : `prod_${index + 1}`;
      const name = product.name || `Product ${index + 1}`;
      const brand = product.brand || "Unavailable";

      let priceStr = "Unavailable";
      if (product.discountPrice && product.discountPrice > 0 && product.price) {
        priceStr = `₹${product.discountPrice} (MRP: ₹${product.price})`;
      } else if (product.price) {
        priceStr = `₹${product.price}`;
      } else if (product.discountPrice) {
        priceStr = `₹${product.discountPrice}`;
      }

      const nutrition = product.nutrition || product.nutritionalInfo || "Unavailable";
      const ingredients = product.ingredients || "Unavailable";
      const categories =
        Array.isArray(product.categories) && product.categories.length > 0
          ? product.categories.join(", ")
          : "Unavailable";
      const suitableFor =
        Array.isArray(product.petTypes) && product.petTypes.length > 0
          ? product.petTypes.join(", ")
          : "Unavailable";

      return `--- PRODUCT ${index + 1}: ${name} ---
ID: ${id}
Name: ${name}
Brand: ${brand}
Price: ${priceStr}
Food Type / Categories: ${categories}
Suitable For Pet Types: ${suitableFor}
Nutrition Information: ${nutrition}
Ingredients: ${ingredients}`;
    })
    .join("\n\n");

  const resolvedPetType = petType || "Not specified";
  const resolvedBreed = breed || "Not specified";

  return `You are PetRonaq AI, an expert pet product comparison assistant. Compare the following pet products based strictly on the data provided below and return STRICT VALID JSON matching the required schema.

TARGET PET PROFILE:
Pet Type: ${resolvedPetType}
Breed: ${resolvedBreed}

COMPARED PRODUCTS DATA:
${formattedProducts}

INSTRUCTIONS AND STRICT CONSTRAINTS:
1. Use ONLY the supplied product data above. Never invent product facts, ingredients, or nutrition values.
2. If data is unavailable, explicitly say "Information not available."
3. Never give medical advice. Recommend consulting a veterinarian when appropriate or for specific medical conditions.
4. Return ONLY valid JSON. Never return Markdown, HTML, or plain paragraphs outside the JSON structure.

REQUIRED JSON STRUCTURE:
{
  "winner": {
    "productId": "<Exact ID of the winning product from COMPARED PRODUCTS DATA>",
    "name": "<Exact Name of the winning product>",
    "reason": "<Detailed explanation why this product won the comparison based strictly on the supplied data>",
    "score": <Number between 1 and 10>
  },
  "summary": "<Comprehensive overview comparing the selected products>",
  "nutrition": {
    "protein": "<Comparison summary of protein content across the products or Information not available.>",
    "fat": "<Comparison summary of fat content across the products or Information not available.>",
    "fiber": "<Comparison summary of fiber content across the products or Information not available.>",
    "ingredients": "<Comparison summary of ingredient quality across the products or Information not available.>"
  },
  "pros": [
    "<Specific pro point regarding a compared product based on data>"
  ],
  "cons": [
    "<Specific con point regarding a compared product based on data>"
  ],
  "bestFor": [
    "<Specific pet profile or scenario this product set or winner is best for>"
  ],
  "avoidFor": [
    "<Specific pet profile or condition to avoid for or consult vet>"
  ],
  "valueForMoney": "<Analysis of pricing vs quality across the products>",
  "finalRecommendation": "<Final clear verdict and recommendation>",
  "disclaimer": "This AI comparison is for informational purposes only and based solely on available product data. Please consult a qualified veterinarian for specific dietary or medical advice."
}`;
}

/**
 * Generates an AI comparison in strict valid JSON format using Google Gemini API.
 *
 * @param {Array} products - Array of product objects to compare (max 3)
 * @param {string} [petType] - Target pet type
 * @param {string} [breed] - Optional target pet breed
 * @returns {Promise<string>} - Validated JSON string
 */
async function generateComparison(products = [], petType = "", breed = "") {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("At least one product must be provided for comparison.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = buildComparisonPrompt({ products, petType, breed });

  try {
    console.log("[DEBUG AI 5] Gemini request started");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    console.log("[DEBUG AI 6] Gemini response received");
    let rawText = response.text ? response.text.trim() : "";
    // Clean up markdown code blocks if present
    if (rawText.startsWith("```")) {
      const firstNewline = rawText.indexOf("\n");
      const lastBackticks = rawText.lastIndexOf("```");
      if (firstNewline !== -1 && lastBackticks > firstNewline) {
        rawText = rawText.substring(firstNewline + 1, lastBackticks).trim();
      }
    }

    // Safely parse JSON to ensure it is valid before returning
    const parsed = JSON.parse(rawText);
    console.log("[DEBUG AI 7] JSON parsed successfully");

    // Return stringified clean valid JSON
    return JSON.stringify(parsed);
  } catch (error) {
    console.error("[DEBUG AI ERROR in generateComparison] Full error stack:\n", error.stack || error);
    console.error("[geminiCompareService] Error generating/parsing AI comparison JSON:", error);
    throw new Error(`AI generated invalid JSON: ${error.message || String(error)}`);
  }
}

module.exports = {
  generateComparison,
  buildComparisonPrompt,
};
