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
let lastUsedModel = "gemini-flash-latest";

function getLastUsedModel() {
  return lastUsedModel;
}

/**
 * Internal helper to score model names based on version/capability so that
 * the newest supported text generation model can be selected deterministically.
 */
function scoreModel(name = "") {
  let score = 0;
  const match = name.match(/gemini-(\d+(?:\.\d+)?)/i);
  if (match) {
    score += parseFloat(match[1]) * 1000;
  } else if (name.toLowerCase().includes("latest")) {
    score += 1800; // Between 1.5 and 2.0 or generic latest
  }

  const lower = name.toLowerCase();
  if (lower.includes("flash") && !lower.includes("lite")) score += 50;
  else if (lower.includes("pro")) score += 40;
  else if (lower.includes("lite")) score += 20;

  if (!lower.includes("preview") && !lower.includes("exp")) score += 10;

  return score;
}

/**
 * Robustly extracts and parses JSON from raw Gemini output.
 * Strips code fences, isolates outermost { ... }, and fixes common syntax issues.
 */
function extractAndParseJSON(rawText = "") {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Raw response from AI is empty or invalid.");
  }

  let text = rawText.trim();

  // 1. Remove markdown code fences if present (e.g. ```json ... ``` or ``` ... ```)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(codeBlockRegex);
  if (match && match[1]) {
    text = match[1].trim();
  } else if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // 2. Try direct parsing
  try {
    return JSON.parse(text);
  } catch (directErr) {
    // Continue to robust extraction
  }

  // 3. Extract only the outermost JSON object { ... }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = text.substring(firstBrace, lastBrace + 1).trim();

    try {
      return JSON.parse(jsonCandidate);
    } catch (candidateErr) {
      // 4. Clean up common syntax errors in candidate (e.g. trailing commas before } or ])
      const cleanedCandidate = jsonCandidate
        .replace(/,\s*([\]}])/g, "$1")
        .replace(/\r?\n(?!(?:[^"]*"[^"]*")*[^"]*$)/g, "\\n");

      try {
        return JSON.parse(cleanedCandidate);
      } catch (finalErr) {
        throw finalErr;
      }
    }
  }

  // If no { ... } found, throw the original parse attempt error
  return JSON.parse(text);
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
    // 1. List available models for this API key and log them
    console.log("[DEBUG AI] Listing available models for API key...");
    const responseModels = await ai.models.list();
    const availableModels = [];
    for await (const m of responseModels) {
      if (m.supportedActions && m.supportedActions.includes("generateContent")) {
        availableModels.push(m.name);
      }
    }
    console.log("[geminiCompareService] Available generateContent models for API key:", availableModels);

    // 2. Filter for general text generation Gemini models (excluding audio/image/vision/robotics/etc.)
    const textModels = availableModels.filter((name) => {
      const lower = (name || "").toLowerCase();
      if (!lower.includes("gemini")) return false;
      if (
        lower.includes("tts") ||
        lower.includes("image") ||
        lower.includes("vision") ||
        lower.includes("audio") ||
        lower.includes("robotics") ||
        lower.includes("embedding") ||
        lower.includes("aqa") ||
        lower.includes("computer-use")
      ) {
        return false;
      }
      return true;
    });

    if (textModels.length === 0) {
      throw new Error("No supported Gemini text generation models found for this API key.");
    }

    // 3. Sort text models from newest to oldest using version scoring
    textModels.sort((a, b) => scoreModel(b) - scoreModel(a));
    console.log("[geminiCompareService] Sorted candidate text models (newest first):", textModels);

    // 4. Try the newest supported text generation model (with automatic fallback if a model returns 404/unavailable)
    let response = null;
    let selectedModel = null;
    let lastError = null;

    for (const modelName of textModels) {
      try {
        console.log(`[DEBUG AI 5] Gemini request started using model: ${modelName}`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        selectedModel = modelName;
        lastUsedModel = selectedModel.replace(/^models\//, "");
        break; // Successfully generated!
      } catch (err) {
        lastError = err;
        const errMsg = (err.message || String(err)).toLowerCase();
        // If model returns 404/unavailable or not found for new users, log warning and try the next candidate
        if (
          err.status === 404 ||
          errMsg.includes("not found") ||
          errMsg.includes("no longer available") ||
          errMsg.includes("not supported")
        ) {
          console.warn(`[geminiCompareService] Model ${modelName} returned 404/unavailable (${err.message}). Trying next newest model...`);
          continue;
        }
        // If rate limited or other fatal error, let it propagate or try fallback
        if (err.status === 429) {
          throw err;
        }
        console.warn(`[geminiCompareService] Error with model ${modelName}: ${err.message}. Trying next model...`);
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to generate content with any available Gemini text model.");
    }

    console.log(`[DEBUG AI 6] Gemini response received from model: ${selectedModel}`);
    const rawText = response.text ? response.text.trim() : "";
    console.log("===================================================================");
    console.log(`[DEBUG AI RAW RESPONSE from ${selectedModel}]:\n${rawText}`);
    console.log("===================================================================");

    let parsed = null;
    try {
      parsed = extractAndParseJSON(rawText);
      console.log("[DEBUG AI 7] JSON parsed successfully on first attempt");
    } catch (firstErr) {
      console.warn(`[geminiCompareService] First JSON.parse() failed: ${firstErr.message}. Initiating repair prompt retry...`);

      const repairPrompt = `You previously generated the following pet product comparison response, but it could not be parsed due to a JSON SyntaxError: "${firstErr.message}".

Here is the RAW text you returned:
\`\`\`text
${rawText}
\`\`\`

Please fix ALL JSON syntax errors (such as missing or extra commas, unescaped quotes, or mismatched brackets/braces).
Return ONLY valid, well-formed JSON matching the exact schema required. Do NOT include any markdown code fences (\`\`\`json), comments, or introductory/explanatory text. Return ONLY the raw JSON object starting with { and ending with }.`;

      console.log(`[DEBUG AI REPAIR] Calling Gemini (${selectedModel}) with repair prompt...`);
      const repairResponse = await ai.models.generateContent({
        model: selectedModel,
        contents: repairPrompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const rawRepairText = repairResponse.text ? repairResponse.text.trim() : "";
      console.log("===================================================================");
      console.log(`[DEBUG AI RAW REPAIR RESPONSE from ${selectedModel}]:\n${rawRepairText}`);
      console.log("===================================================================");

      try {
        parsed = extractAndParseJSON(rawRepairText);
        console.log("[DEBUG AI 7] JSON parsed successfully after repair prompt retry!");
      } catch (repairErr) {
        console.error("[geminiCompareService] Repair prompt retry also failed to produce valid JSON:", repairErr.message);
        throw new Error(`AI generated invalid JSON even after repair prompt retry: ${repairErr.message}`);
      }
    }

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
  getLastUsedModel,
};
