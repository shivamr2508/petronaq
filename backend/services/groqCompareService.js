const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const Groq = require("groq-sdk");
const { buildComparisonPrompt } = require("./geminiCompareService");

let lastUsedModel = "llama-3.3-70b-versatile";

function getLastUsedModel() {
  return lastUsedModel;
}

/**
 * Robustly extracts and parses JSON from raw Groq output.
 * Strips code fences, isolates outermost { ... }, and parses using JSON.parse().
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

  // 2. Extract only the outermost JSON object { ... }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1).trim();
  }

  // 3. Parse using JSON.parse()
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
  let rawKey = process.env.GROQ_API_KEY ? String(process.env.GROQ_API_KEY).trim() : "";
  if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
    rawKey = rawKey.slice(1, -1).trim();
  }

  if (!rawKey) {
    throw new Error("GROQ_API_KEY environment variable is not configured.");
  }

  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("At least one product must be provided for comparison.");
  }

  const groq = new Groq({ apiKey: rawKey });
  const basePrompt = buildComparisonPrompt({ products, petType, breed });

  const systemPrompt = `You are an API.

Return ONLY valid JSON.

Never return markdown.

Never return code fences.

Never explain anything.

Never write extra text.

The first character must be {

The last character must be }

Return valid JSON only.`;

  const userPrompt = `${basePrompt}

IMPORTANT:

Return ONLY valid JSON.

Do not wrap the JSON in markdown.

Do not use \`\`\`json

Do not explain anything.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  console.log("[DEBUG GROQ] Request Started");
  lastUsedModel = "llama-3.3-70b-versatile";

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    messages
  });

  console.log("[DEBUG GROQ] Response Received");
  const raw = completion.choices[0].message.content;
  console.log(`[DEBUG GROQ] Raw Response: ${raw}`);

  let parsed = null;
  try {
    parsed = extractAndParseJSON(raw);
    console.log("[DEBUG GROQ] JSON Parsed");
  } catch (parseErr) {
    console.log("[DEBUG GROQ] Retry Triggered");

    const repairMessages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `The following JSON is invalid.\n\nRepair it.\n\nReturn ONLY valid JSON.\n\nNo explanation.\n\nHere is the broken JSON:\n\n${raw}`
      }
    ];

    try {
      const repairCompletion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        messages: repairMessages
      });

      console.log("[DEBUG GROQ] Response Received");
      const rawRepair = repairCompletion.choices[0].message.content;
      console.log(`[DEBUG GROQ] Raw Response: ${rawRepair}`);

      parsed = extractAndParseJSON(rawRepair);
      console.log("[DEBUG GROQ] JSON Parsed");
      console.log("[DEBUG GROQ] Retry Success");
    } catch (retryErr) {
      console.log("[DEBUG GROQ] Retry Failed");
      throw new Error("Groq returned invalid JSON after retry.");
    }
  }

  return JSON.stringify(parsed);
}

module.exports = {
  generateGroqComparison,
  buildComparisonPrompt,
  getLastUsedModel,
};
