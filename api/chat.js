const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
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
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let aiText = response.text();

    // Cleans out markdown code wrappers if AI includes them
    if (aiText.includes("```json")) {
      aiText = aiText.split("```json")[1].split("```")[0];
    } else if (aiText.includes("```")) {
      aiText = aiText.split("```")[1].split("```")[0];
    }

    return res.status(200).json({ reply: aiText.trim() });

  } catch (globalError) {
    console.error("Vercel Backend execution error:", globalError);
    
    const emergencyObject = {
      question: "Air traffic control lost connection briefly! Click any answer below to clear the path safely.",
      options: [
        "Fly back up safely! [飛上去]",
        "Proceed back to flight coordinates",
        "Clear runway pathway options",
        "Engage engine thrust systems"
      ],
      correctIndex: 0
    };
    
    return res.status(200).json({ reply: JSON.stringify(emergencyObject) });
  }
};