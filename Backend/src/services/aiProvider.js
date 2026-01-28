// Using @google/generative-ai (the standard package)
// Dynamic import used inside function to support ESM

async function getAIResponse(messages) {
  console.log("🤖 [AI PROVIDER] Gemini request started");

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please configure your .env");
    }
    const client = new GoogleGenerativeAI(apiKey);

    const prompt = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    console.log("📤 [AI PROVIDER] Prompt sent to Gemini");

    // Use a supported model name; allow override via env
    let configuredModel = (process.env.GEMINI_MODEL || "gemini-1.5-flash-latest").trim();
    // Normalize legacy names to latest variants
    const legacyMap = {
      "gemini-1.5-flash": "gemini-1.5-flash-latest",
      "gemini-1.5-pro": "gemini-1.5-pro-latest",
      "gemini-1.0-pro": "gemini-1.0-pro-latest",
      "gemini-pro": "gemini-1.0-pro-latest"
    };
    configuredModel = legacyMap[configuredModel] || configuredModel;

    const model = client.getGenerativeModel({ model: configuredModel });
    const result = await model.generateContent(prompt);
    const response = result.response;

    console.log("📥 [AI PROVIDER] Response received from Gemini");

    return response.text();

  } catch (error) {
    console.error("❌ [AI PROVIDER] Gemini error:", error.message);
    // Provide clearer guidance on common misconfigurations
    if (String(error?.message || "").includes("404 Not Found") || String(error?.message || "").includes("is not found for API version")) {
      const help = `Model not found. Try setting GEMINI_MODEL to a supported value such as \"gemini-1.5-flash-latest\" or \"gemini-1.5-pro-latest\". Current: ${process.env.GEMINI_MODEL || "(unset)"}`;
      throw new Error(help);
    }
    throw error;
  }
}

module.exports = { getAIResponse };
