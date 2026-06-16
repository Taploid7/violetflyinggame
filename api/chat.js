const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" }});
    const result = await model.generateContent(req.body.prompt);
    return res.status(200).json({ reply: result.response.text() });
  } catch (e) {
    return res.status(200).json({ reply: JSON.stringify({ question: "Error loading question. Press any option to continue.", options: ["Continue", "Continue", "Continue", "Continue"], correctIndex: 0 }) });
  }
};