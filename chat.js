function parseRawTextToQuiz(rawText) {
    try {
        // Strip out code block wrappers if Gemini ignored the prompt and added them anyway
        const cleanText = rawText.replace(/```json|```/g, "").trim();
        
        // Looser Regex matching that tolerates missing spaces, varying capitalization, and brackets
        const questionMatch = cleanText.match(/(?:Question|Q):\s*(.*)/i);
        const optAMatch = cleanText.match(/[A]\)?\s+(.*)/i);
        const optBMatch = cleanText.match(/[B]\)?\s+(.*)/i);
        const optCMatch = cleanText.match(/[C]\)?\s+(.*)/i);
        const optDMatch = cleanText.match(/[D]\)?\s+(.*)/i);
        const correctMatch = cleanText.match(/(?:Correct|Answer):\s*([A-D])/i);

        if (questionMatch && optAMatch && optBMatch && optCMatch && optDMatch && correctMatch) {
            const choices = [
                optAMatch[1].trim(), 
                optBMatch[1].trim(), 
                optCMatch[1].trim(), 
                optDMatch[1].trim()
            ];
            const letterMapping = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
            
            return {
                question: questionMatch[1].trim(),
                options: choices,
                correct: letterMapping[correctMatch[1].toUpperCase()]
            };
        }
        
        // Backup Plan: Split line by line if Regex fails completely
        const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length >= 6) {
            const question = lines[0].replace(/^(Question:\s*|Q:\s*)/i, "");
            const choices = [
                lines[1].replace(/^[A]\)?\s*/i, ""),
                lines[2].replace(/^[B]\)?\s*/i, ""),
                lines[3].replace(/^[C]\)?\s*/i, ""),
                lines[4].replace(/^[D]\)?\s*/i, "")
            ];
            const lastLine = lines[lines.length - 1];
            const letterMatch = lastLine.match(/([A-D])/i);
            
            if (letterMatch) {
                const letterMapping = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                return {
                    question: question,
                    options: choices,
                    correct: letterMapping[letterMatch[1].toUpperCase()]
                };
            }
        }
        
        return null; // Both parsers exhausted
    } catch (e) {
        console.error("Parsing error exception:", e);
        return null;
    }
}