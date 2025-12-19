// const { GoogleGenAI } = require("@google/genai");

// const client = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// async function getAIResponse(messages) {
//   try {
//     // Convert messages into a single prompt
//     const prompt = messages
//       .map(m => `${m.role.toUpperCase()}: ${m.content}`)
//       .join("\n");

//     const response = await client.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: prompt,
//     });

//     return response.text;
//   } catch (error) {
//     console.error("Gemini AI Error:", error);
//     throw error;
//   }
// }

// module.exports = { getAIResponse };

const { GoogleGenAI } = require("@google/genai");

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function getAIResponse(messages) {
  console.log("🤖 [AI PROVIDER] Gemini request started");

  try {
    const prompt = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    console.log("📤 [AI PROVIDER] Prompt sent to Gemini");

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("📥 [AI PROVIDER] Response received from Gemini");

    return response.text;

  } catch (error) {
    console.error("❌ [AI PROVIDER] Gemini error:", error.message);
    throw error;
  }
}

module.exports = { getAIResponse };
