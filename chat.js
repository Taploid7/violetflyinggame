// =========================================================================
// 🧠 VIOLET THE PILOT - BACKEND AI PRELOADER & INTERCEPT MANAGEMENT SYSTEM
// =========================================================================

const VERCEL_BACKEND_URL = "https://game1-shfe.vercel.app/api/chat";

let questionPool = [];
const TOTAL_QUESTIONS_NEEDED = 10;
let currentQuestionIndex = 0;

// Dynamic word selection array mapped across standard vocabulary modules
const MY_WORD_BANK = [
    "Wrench", "Pliers", "Appliances", "Reassemble", "Tinkering", 
    "Lawn Mower", "Engine", "Elaborate", "Scratch", "Sweater", 
    "Contraptions", "Engineering", "Hazards", "Coveralls", "Obnoxious", 
    "Beamed", "Frantically", "Altitude", "Canoeing", "Precision", 
    "Grateful", "Miserable", "Appetite", "Jubilantly", "Valor", "Esteem"
];

// 🚀 FAILSAFE INSTANT RECOVERY POOL (Keeps the progress bar filling even on network 500 drops!)
const fallbackQuestions = [
    { question: "What does the word 'Reassemble' mean?", options: ["To put pieces back together", "To break apart completely", "To move very quickly", "To clear out space"], correct: 0 },
    { question: "What does the word 'Precision' mean?", options: ["The quality of being exact and accurate", "Moving in a clumsy way", "A type of heavy machinery", "Feeling completely lost"], correct: 0 },
    { question: "What does the word 'Hazards' mean?", options: ["Safe environments", "Potential sources of danger", "Tools used for digging", "Types of dynamic airplanes"], correct: 1 },
    { question: "What does the word 'Altitude' mean?", options: ["The speed of an object", "The height of an object above sea level", "The weight of a fuel tank", "The direction of wind currents"], correct: 1 }
];

/**
 * Runs asynchronously on DOM launch to bundle all questions sequentially
 */
async function preloadAllQuestions() {
    console.log(`[Terminal Log]: Starting batch preloading sequence for ${TOTAL_QUESTIONS_NEEDED} questions...`);
    const shuffledWords = [...MY_WORD_BANK].sort(() => 0.5 - Math.random());

    for (let i = 0; i < TOTAL_QUESTIONS_NEEDED; i++) {
        const targetWord = shuffledWords[i % shuffledWords.length];
        let success = false;
        let attempts = 0;

        while (!success && attempts < 2) {
            try {
                const systemPrompt = `Generate one unique intermediate English vocabulary multiple-choice question for the target word: "${targetWord}".
Format your entire response exactly like this example layout text and do not include markdown blocks, json tags, symbols, or extra characters:
Question: What does the word "Diligent" mean?
A) Hard-working and careful
B) Lazy and slow
C) Angry and loud
D) Small and fast
Correct: A`;

                const response = await fetch(VERCEL_BACKEND_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: systemPrompt })
                });

                if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
                const data = await response.json();
                if (!data.reply) throw new Error("Empty text block payload.");

                const parsedQuestion = parseRawTextToQuiz(data.reply);
                if (parsedQuestion) {
                    questionPool.push(parsedQuestion);
                    success = true;
                } else {
                    throw new Error("Text structural parse divergence error.");
                }
            } catch (error) {
                attempts++;
            }
        }

        // 🚀 SAFE FALLBACK INTERCEPT: Inject local asset matrix if remote API breaks
        if (!success) {
            const fallbackItem = fallbackQuestions[i % fallbackQuestions.length];
            questionPool.push({ ...fallbackItem });
        }

        updateProgressBar(questionPool.length);
    }

    // 🛫 UNLOCK LAUNCHPAD: Transform title button once loading hits 100%
    const startBtn = document.getElementById("start-btn");
    if (startBtn) {
        startBtn.innerText = "START FLIGHT 🛫";
        startBtn.disabled = false;
    }
}

/**
 * Updates UI progress indicators
 */
function updateProgressBar(count) {
    const progressFill = document.getElementById("flight-progress-fill");
    const progressText = document.getElementById("progress-text");
    const percentage = Math.floor((count / TOTAL_QUESTIONS_NEEDED) * 100);

    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.innerText = `Syncing with Gemini AI: ${percentage}%`;
}

/**
 * RegEx line-parser to break structural AI text returns into application objects
 */
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
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Triggers modal setup and updates inner option configurations
 */
function useLoadedQuestion() {
    const quizModal = document.getElementById("quiz-modal");
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");

    let currentQuestion = questionPool[currentQuestionIndex];
    if (!currentQuestion) {
        currentQuestion = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    }

    questionText.innerText = currentQuestion.question;
    optionsContainer.innerHTML = "";

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.innerText = option;
        button.onclick = () => verifyPlayerAnswer(index, currentQuestion.correct);
        optionsContainer.appendChild(button);
    });

    if (quizModal) quizModal.classList.remove("hidden");
}

/**
 * Validates player feedback and branches mechanics accordingly
 */
function verifyPlayerAnswer(selectedIndex, correctIndex) {
    const quizModal = document.getElementById("quiz-modal");
    if (quizModal) quizModal.classList.add("hidden");

    if (selectedIndex === correctIndex) {
        // Advance pointer index along cached stack
        currentQuestionIndex = (currentQuestionIndex + 1) % questionPool.length;
        if (typeof window.resumeGameAfterSave === "function") window.resumeGameAfterSave();
    } else {
        if (typeof window.deductHeart === "function") window.deductHeart();
    }
}

// Global scope hooks binding systems to core frame ticker
window.questionPool = questionPool;
window.useLoadedQuestion = useLoadedQuestion;

document.addEventListener("DOMContentLoaded", () => {
    preloadAllQuestions();
});