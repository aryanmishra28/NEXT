// exports.chatWithAI = async (req, res) => {
//   try {
//     const { message } = req.body;

//     if (!message) {
//       return res.status(400).json({ success: false, message: "Message is required" });
//     }

//     // Temporary dummy response (for testing)
//     res.json({
//       success: true,
//       reply: `AI received your message: "${message}"`
//     });
//   } catch (error) {
//     console.error("AI Chat Error:", error);
//     res.status(500).json({ success: false, message: "AI chat failed" });
//   }
// };

const { getAIResponse } = require('../services/aiProvider');

exports.chatWithAI = async (req, res) => {
  console.log("📩 [AI CHAT] Request received");

  try {
    const { message } = req.body;

    if (!message) {
      console.log("⚠️ [AI CHAT] Empty message");
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    console.log("🧠 [AI CHAT] Preparing system prompt");
    console.log("➡️ User message:", message);

    const systemPrompt = `
You are an AI Career Mentor for Indian Computer Science students.
Explain in simple language.
Give step-by-step roadmaps.
Focus on placements and internships.
`;

    console.log("🚀 [AI CHAT] Sending request to AI service...");

    const aiReply = await getAIResponse([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]);

    console.log("✅ [AI CHAT] AI response generated successfully");

    return res.json({
      success: true,
      reply: aiReply
    });

  } catch (error) {
    console.error("❌ [AI CHAT] Error occurred");

    console.error("🪵 Error details:", error.message);

    // Quota fallback
    if (error?.status === 429 || error?.message?.includes("Quota")) {
      console.log("🔁 [AI CHAT] Quota exceeded, sending fallback response");

      return res.json({
        success: true,
        reply: `
⚠️ AI quota limit reached (demo mode)

Backend Developer Roadmap:
1. Learn Java / JavaScript
2. Master DSA
3. Learn Node.js & Express
4. Work with MongoDB
5. Implement Authentication
6. Build Projects
7. Prepare for Interviews
`
      });
    }

    // Model configuration fallback
    if (error?.message?.includes("Model not found") || error?.message?.includes("GEMINI_MODEL")) {
      console.log("🔁 [AI CHAT] Model misconfiguration, sending fallback response");
      return res.json({
        success: true,
        reply: `
⚠️ AI model is not configured correctly.

Please set GEMINI_MODEL to a supported value like:
// - gemini-1.5-flash-latest (fast)
// - gemini-1.5-pro-latest (better reasoning)

Meanwhile, here is a starter roadmap:

Backend Developer Roadmap:
1. Learn Java / JavaScript
2. Master DSA
3. Learn Node.js & Express
4. Work with MongoDB
5. Implement Authentication
6. Build Projects
7. Prepare for Interviews
`
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "AI chat failed"
    });
  }
};
