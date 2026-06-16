module.exports = async function handler(req, res) {
  // 1. Force explicit CORS policies so GitHub Pages can read the response
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Handle Browser Preflight security checks immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY environment variable on server." });
    }

    // 3. Direct Native API fetch request straight to Google's servers
    const googleEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const googleResponse = await fetch(googleEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      return res.status(googleResponse.status).json({ error: `Google API rejected request: ${errorText}` });
    }

    const data = await googleResponse.json();
    
    // Extract the text payload out of Google's native JSON tree structure
    const aiResponseText = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ reply: aiResponseText.trim() });

  } catch (error) {
    console.error("Internal Vercel System Crash:", error);
    return res.status(500).json({ error: "Internal Server API Error", details: error.message });
  }
};