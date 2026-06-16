module.exports = async function handler(req, res) {
  // 1. ABSOLUTE CORS OVERRIDE
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // 2. INSTANT PREFLIGHT APPROVAL
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. BULLETPROOF API CALL
  try {
    const prompt = req.body.prompt;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "API Key missing on Vercel" });
    }

    const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await googleResponse.json();
    const aiResponseText = data.candidates[0].content.parts[0].text;

    return res.status(200).json({ reply: aiResponseText.trim() });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};