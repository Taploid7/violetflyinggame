const VERCEL_BACKEND_URL = "https://game1-shfe.vercel.app/api/chat";

let nextQuestionCache = null;
let isFetchingQuestion = false;

// 1. YOUR CUSTOM VOCABULARY WORD BANK
const MY_WORD_BANK = [
    "Wrench", "Pliers", "Appliances", "Reassemble", "Tinkering", 
    "Lawn Mower", "Engine", "Elaborate", "Scratch", "Sweater", 
    "Contraptions", "Engineering", "Hazards", "Coveralls", "Obnoxious", 
    "Beamed", "Frantically", "Altitude", "Canoeing", "Precision", 
    "Grateful", "Miserable", "Appetite", "Jubilantly", "Valor", "Esteem"
];

// Safe local fallback generator if the network layers drop out entirely
const fallbackQuestions = [
    { question: "What does the word 'Reassemble' mean?", options: ["To put pieces back together", "To break apart completely", "To move very quickly", "To clear out space"], correct: 0 },
    { question: "What does the word 'Precision' mean?", options: ["The quality of being exact and accurate", "Moving in a clumsy way", "A type of heavy machinery", "Feeling completely lost"], correct: 0 }
];

async function prefetchNextQuestion() {
    if (isFetchingQuestion || nextQuestionCache) return;
    isFetchingQuestion = true;
    updateDebugTerminal("⏳ Requesting Gemini AI question...", "yellow");

    // Pick a random target word from your specific list
    const randomTargetWord = MY_WORD_BANK[Math.floor(Math.random() * MY_WORD_BANK.length)];

    const systemPrompt = `Generate one unique intermediate English vocabulary multiple-choice question for the target word: "${randomTargetWord}".
Format your entire response exactly like this example text and do not include markdown blocks, symbols, or extra characters:
Question: What does the word "Diligent" mean?
A) Hard-working and careful
B) Lazy and slow
C) Angry and loud
D) Small and fast
Correct: A`;

    try {
        const response = await fetch(VERCEL_BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: systemPrompt })
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        if (!data.reply) throw new Error("Empty payload from server template.");

        const cleanParsedQuestion = parseRawTextToQuiz(data.reply);
        if (cleanParsedQuestion) {
            nextQuestionCache = cleanParsedQuestion;
            updateDebugTerminal(`✅ Gemini AI question pre-loaded for: ${randomTargetWord}`, "green");
        } else {
            throw new Error("Text parsing schema structural mismatch.");
        }
    } catch (error) {
        console.error("AI Error:", error);
        updateDebugTerminal(`❌ AI Fetch FAILED! Using Fallback. Error: ${error.message}`, "red");
        nextQuestionCache = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    } finally {
        isFetchingQuestion = false;
    }
}

function parseRawTextToQuiz(rawText) {
    try {
        const cleanText = rawText.replace(/```json|```/g, "").trim();
        
        // Flexible regex matching to handle unexpected variations in whitespace/capitalization
        const questionMatch = cleanText.match(/(?:Question|Q):\s*(.*)/i);
        const optAMatch = cleanText.match(/[A]\)?\s+(.*)/i);
        const optBMatch = cleanText.match(/[B]\)?\s+(.*)/i);
        const optCMatch = cleanText.match(/[C]\)?\s+(.*)/i);
        const optDMatch = cleanText.match(/[D]\)?\s+(.*)/i);
        const correctMatch = cleanText.match(/(?:Correct|Answer):\s*([A-D])/i);

        if (questionMatch && optAMatch && optBMatch && optCMatch && optDMatch && correctMatch) {
            const choices = [optAMatch[1].trim(), optBMatch[1].trim(), optCMatch[1].trim(), optDMatch[1].trim()];
            const letterMapping = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
            
            return {
                question: questionMatch[1].trim(),
                options: choices,
                correct: letterMapping[correctMatch[1].toUpperCase()]
            };
        }
        
        // Secondary parser: Split line by line if Regex matching fails
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
        return null;
    } catch (e) {
        return null;
    }
}

function useLoadedQuestion() {
    const quizModal = document.getElementById("quiz-modal");
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");

    if (!nextQuestionCache) {
        nextQuestionCache = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    }

    const currentQuestion = nextQuestionCache;
    nextQuestionCache = null;

    questionText.innerText = currentQuestion.question;
    optionsContainer.innerHTML = "";

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.innerText = option;
        button.onclick = () => verifyPlayerAnswer(index, currentQuestion.correct);
        optionsContainer.appendChild(button);
    });

    quizModal.classList.remove("hidden");
    prefetchNextQuestion(); 
}

function verifyPlayerAnswer(selectedIndex, correctIndex) {
    const quizModal = document.getElementById("quiz-modal");
    quizModal.classList.add("hidden");

    if (selectedIndex === correctIndex) {
        updateDebugTerminal("✨ Correct answer! Resuming flight.", "green");
        if (typeof resumeFlight === "function") resumeFlight();
    } else {
        updateDebugTerminal("💥 Wrong answer! Damage sustained.", "red");
        if (typeof applyDamage === "function") applyDamage();
    }
}

function updateDebugTerminal(message, color) {
    console.log(`[Terminal Log]: ${message}`);
}

// 2. CRITICAL FIX: Explicitly expose functions to the global window context
window.prefetchNextQuestion = prefetchNextQuestion;
window.useLoadedQuestion = useLoadedQuestion;

document.addEventListener("DOMContentLoaded", () => {
    prefetchNextQuestion();
});