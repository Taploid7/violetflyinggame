const VERCEL_BACKEND_URL = "https://game1-shfe.vercel.app/api/chat";

let nextQuestionCache = null;
let isFetchingQuestion = false;

const MY_WORD_BANK = [
    "Wrench", "Pliers", "Appliances", "Reassemble", "Tinkering", 
    "Lawn Mower", "Engine", "Elaborate", "Scratch", "Sweater", 
    "Contraptions", "Engineering", "Hazards", "Coveralls", "Obnoxious", 
    "Beamed", "Frantically", "Altitude", "Canoeing", "Precision", 
    "Grateful", "Miserable", "Appetite", "Jubilantly", "Valor", "Esteem"
];

const fallbackQuestions = [
    { question: "What does the word 'Reassemble' mean?", options: ["To put pieces back together", "To break apart completely", "To move very quickly", "To clear out space"], correct: 0 },
    { question: "What does the word 'Precision' mean?", options: ["The quality of being exact and accurate", "Moving in a clumsy way", "A type of heavy machinery", "Feeling completely lost"], correct: 0 }
];

async function prefetchNextQuestion() {
    if (isFetchingQuestion || nextQuestionCache) return;
    isFetchingQuestion = true;
    console.log("[Terminal Log]: ⏳ Requesting Gemini AI question...");

    const randomTargetWord = MY_WORD_BANK[Math.floor(Math.random() * MY_WORD_BANK.length)];

    const systemPrompt = `Generate one unique intermediate English vocabulary multiple-choice question for the target word: "${randomTargetWord}".
Format your entire response exactly like this example layout text and do not include markdown blocks, symbols, or extra characters:
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

        // 🚨 CRITICAL TROUBLESHOOTING UPGRADE:
        // If the server returns an error code (like 500), parse the JSON payload to reveal the inner debug details!
        if (!response.ok) {
            let errorDetails = "Could not parse server error message.";
            try {
                const errorData = await response.json();
                console.error("⛔ [DETAILED BACKEND CRASH REPORT]:", errorData);
                errorDetails = JSON.stringify(errorData, null, 2);
            } catch (e) {
                const rawText = await response.text();
                console.error("⛔ [RAW BACKEND HTML/TEXT ERROR]:", rawText);
                errorDetails = rawText;
            }
            throw new Error(`HTTP Error Status: ${response.status}\nDetails:\n${errorDetails}`);
        }
        
        const data = await response.json();
        if (!data.reply) throw new Error("Empty payload from server template.");

        const cleanParsedQuestion = parseRawTextToQuiz(data.reply);
        if (cleanParsedQuestion) {
            nextQuestionCache = cleanParsedQuestion;
            console.log(`[Terminal Log]: ✅ Gemini AI question pre-loaded for: ${randomTargetWord}`);
        } else {
            console.warn("⚠️ Received raw text could not be processed by parser regular expressions:", data.reply);
            throw new Error("Text parsing schema structural mismatch.");
        }
    } catch (error) {
        console.error("❌ AI Fetch Layer FAILED! Details:", error.message);
        nextQuestionCache = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    } finally {
        isFetchingQuestion = false;
    }
}

function parseRawTextToQuiz(rawText) {
    try {
        const cleanText = rawText.replace(/```json|```/g, "").trim();
        
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
        if (typeof resumeFlight === "function") resumeFlight();
    } else {
        if (typeof applyDamage === "function") applyDamage();
    }
}

window.prefetchNextQuestion = prefetchNextQuestion;
window.useLoadedQuestion = useLoadedQuestion;

document.addEventListener("DOMContentLoaded", () => {
    prefetchNextQuestion();
});