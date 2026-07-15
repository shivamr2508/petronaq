const Groq = require("groq-sdk");
const { buildComparisonPrompt } = require("./geminiCompareService");

let lastUsedModel = "llama-3.3-70b-versatile";

function getLastUsedModel() {
  return lastUsedModel;
}

/**
 * Robustly extracts and parses JSON from raw Groq output.
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
 * Generates an AI comparison in strict valid JSON format using Groq API.
 *
 * @param {Array} products - Array of product objects to compare (max 3)
 * @param {string} [petType] - Target pet type
 * @param {string} [breed] - Optional target pet breed
 * @returns {Promise<string>} - Validated JSON string
 */
async function generateGroqComparison(products = [], petType = "", breed = "") {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is not configured.");
  }

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("At least one product must be provided for comparison.");
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = buildComparisonPrompt({ products, petType, breed });

  // List of candidate models suitable for structured JSON generation on Groq
  const candidateModels = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
  ];

  let response = null;
  let selectedModel = null;
  let lastError = null;

  for (const modelName of candidateModels) {
    try {
      console.log(`[DEBUG AI GROQ 5] Groq request started using model: ${modelName}`);
      response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are PetRonaq AI, an expert pet product comparison assistant. You must always return STRICT VALID JSON matching the requested schema exactly. Never include markdown code fences, comments, or explanatory text outside the JSON object."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: modelName,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });
      selectedModel = modelName;
      lastUsedModel = selectedModel;
      break;
    } catch (err) {
      lastError = err;
      const errMsg = (err.message || String(err)).toLowerCase();
      console.warn(`[groqCompareService] Error with model ${modelName}: ${err.message}. Trying next candidate model...`);
      continue;
    }
  }

  if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
    throw lastError || new Error("Failed to generate content with any available Groq model.");
  }

  console.log(`[DEBUG AI GROQ 6] Groq response received from model: ${selectedModel}`);
  const rawText = response.choices[0].message.content ? response.choices[0].message.content.trim() : "";
  console.log("===================================================================");
  console.log(`[DEBUG AI GROQ RAW RESPONSE from ${selectedModel}]:\n${rawText}`);
  console.log("===================================================================");

  let parsed = null;
  try {
    parsed = extractAndParseJSON(rawText);
    console.log("[DEBUG AI GROQ 7] JSON parsed successfully on first attempt");
  } catch (firstErr) {
    console.warn(`[groqCompareService] First JSON.parse() failed: ${firstErr.message}. Initiating repair prompt retry...`);

    const repairPrompt = `You previously generated the following pet product comparison response, but it could not be parsed due to a JSON SyntaxError: "${firstErr.message}".

Here is the RAW text you returned:
\`\`\`text
${rawText}
\`\`\`

Please fix ALL JSON syntax errors (such as missing or extra commas, unescaped quotes, or mismatched brackets/braces).
Return ONLY valid, well-formed JSON matching the exact schema required. Do NOT include any markdown code fences (\`\`\`json), comments, or introductory/explanatory text. Return ONLY the raw JSON object starting with { and ending with }.`;

    console.log(`[DEBUG AI GROQ REPAIR] Calling Groq (${selectedModel}) with repair prompt...`);
    const repairResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert JSON syntax repair assistant. Return ONLY strictly valid JSON without markdown code blocks."
        },
        {
          role: "user",
          content: repairPrompt
        }
      ],
      model: selectedModel,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const rawRepairText = repairResponse.choices?.[0]?.message?.content ? repairResponse.choices[0].message.content.trim() : "";
    console.log("===================================================================");
    console.log(`[DEBUG AI GROQ RAW REPAIR RESPONSE from ${selectedModel}]:\n${rawRepairText}`);
    console.log("===================================================================");

    try {
      parsed = extractAndParseJSON(rawRepairText);
      console.log("[DEBUG AI GROQ 7] JSON parsed successfully after repair prompt retry!");
    } catch (repairErr) {
      console.error("[groqCompareService] Repair prompt retry also failed to produce valid JSON:", repairErr.message);
      throw new Error(`AI generated invalid JSON even after repair prompt retry: ${repairErr.message}`);
    }
  }

  // Return stringified clean valid JSON
  return JSON.stringify(parsed);
}

module.exports = {
  generateGroqComparison,
  buildComparisonPrompt,
  getLastUsedModel,
};
