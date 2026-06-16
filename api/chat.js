import { GoogleGenAI } from "@google/genai";

// Initialize the Google Gen AI SDK using your environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    // Define your model cascade array from highest priority to lowest
    const modelQueue = [
      "gemini-1.5-pro",   // Tier 1: Deepest reasoning, lowest quota
      "gemini-1.5-flash", // Tier 2: Lightning fast, massive quota limits
      "gemini-2.0-flash-exp" // Tier 3: Alternative flash version backup
    ];

    let aiResponse = null;
    let errorLog = [];

    // Loop through the models sequentially until one succeeds
    for (const modelName of modelQueue) {
      try {
        console.log(`Attempting to generate quiz using model: ${modelName}`);
        
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          // Force JSON structure at the API configuration level for stability
          config: {
            responseMimeType: "application/json"
          }
        });

        // If successful, capture the text content and break out of the loop
        if (response && response.text) {
          aiResponse = response.text;
          console.log(`Success achieved using model: ${modelName}`);
          break; 
        }
      } catch (modelError) {
        console.warn(`Model ${modelName} failed or out of quota. Error:`, modelError.message);
        errorLog.push({ model: modelName, error: modelError.message });
        // The loop continues automatically to the next fallback model in line
      }
    }

    // If all online models fail due to quota exhaustion, trigger the ultimate server fallback
    if (!aiResponse) {
      console.error("All Gemini API models exhausted or rate-limited. Serving emergency server-side backup.");
      aiResponse = generateEmergencyFallbackJSON(prompt);
    }

    // Return the clean JSON back to your frontend chat.js file
    return new Response(JSON.stringify({ reply: aiResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (globalError) {
    console.error("Critical server failure:", globalError);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

/**
 * Emergency local parser to extract the word from the prompt and structure 
 * a flawless JSON response completely offline if all Google APIs go down.
 */
function generateEmergencyFallbackJSON(prompt) {
  // Regex pattern to extract the targeted word out of the sent text prompt string
  const wordMatch = prompt.match(/vocabulary word: "([^"]+)"/);
  const word = wordMatch ? wordMatch[1] : "Wrench";

  const fallbackObject = {
    question: `Look at the textbook word: "${word}". Can you pick the correct English match?`,
    options: [
      `A core definition matching the item: ${word}`,
      "An completely incorrect background item option",
      "An unrelated classroom verb choice",
      "A distraction answer choice matching food elements"
    ],
    correctIndex: 0
  };

  return JSON.stringify(fallbackObject);
}