import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  // Handle CORS cross-origin preflight requests
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

    const modelQueue = [
      "gemini-1.5-pro",
      "gemini-1.5-flash"
    ];

    let aiResponse = null;

    for (const modelName of modelQueue) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        if (response && response.text) {
          aiResponse = response.text;
          break; 
        }
      } catch (modelError) {
        console.warn(`Model ${modelName} omitted. trying next target...`);
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
}

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