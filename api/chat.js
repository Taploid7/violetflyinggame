const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  // Enforce global CORS headers so GitHub Pages can connect securely without blocks
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Using gemini-2.5-flash for the fastest possible load speeds
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 250,
        temperature: 0.7
      }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let aiText = response.text().trim();

    // Secondary sanitization safety sweep
    if (aiText.startsWith("```")) {
      aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    return res.status(200).json({ reply: aiText });

  } catch (globalError) {
    console.error("Vercel Backend execution error:", globalError);
    
    // High stability local fallback safety net
    const emergencyObject = {
      question: "Air Traffic Control lost signal briefly! Choose an option below to clear the path safely.",
      options: [
        "Fly back up safely! 🚀",
        "Proceed back to flight coordinates",
        "Clear runway pathway options",
        "Engage engine thrust systems"
      ],
      correctIndex: 0
    };
    
    return res.status(200).json({ reply: JSON.stringify(emergencyObject) });
  }
};