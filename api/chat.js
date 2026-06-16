// Using the standard built-in Vercel legacy library hook
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
  // Fix cross-origin resource sharing permissions so GitHub Pages can talk to it
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
    
    // Initialize using the env variable you set up on your dashboard
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Fallback cascade using classic models
    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];
    let aiResponse = null;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        if (response && response.text()) {
          aiResponse = response.text();
          break;
        }
      } catch (e) {
        console.warn(`Model ${modelName} skipped.`);
      }
    }

    if (!aiResponse) {
      aiResponse = generateEmergencyFallbackJSON(prompt);
    }

    return res.status(200).json({ reply: aiResponse });

  } catch (globalError) {
    console.error(globalError);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

function generateEmergencyFallbackJSON(prompt) {
  const wordMatch = prompt.match(/vocabulary word: "([^"]+)"/);
  const word = wordMatch ? wordMatch[1] : "Wrench";

  const fallbackObject = {
    question: `Look at the textbook word: "${word}". Can you pick the correct English match?`,
    options: [
      `A core tool or concept item matching: ${word}`,
      "An completely incorrect background item option",
      "An unrelated classroom verb choice",
      "A distraction answer choice matching food elements"
    ],
    correctIndex: 0
  };

  return JSON.stringify(fallbackObject);
}