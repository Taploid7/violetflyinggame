// Using the globally stable Vercel native library hook
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  // Enforce CORS cross-origin headers so your GitHub Pages site is allowed to read data
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Answer preflight browser handshakes instantly
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Reject any malicious or mistaken traffic that isn't a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    
    // Initialize the Gemini Engine using the secure variable on your Vercel Dashboard
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Fetch via the highly reliable Flash engine model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    // Package the raw AI response text cleanly and pass it back down to the game
    return res.status(200).json({ reply: aiText });

  } catch (globalError) {
    console.error("Vercel Backend execution error:", globalError);
    
    // Safe JSON emergency structural backup so the student's browser never encounters a blank screen or a crash
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