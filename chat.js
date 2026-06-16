const VERCEL_BACKEND_URL = "https://game1-shfe.vercel.app/api/chat";

let questionPool = [];
const TOTAL_QUESTIONS_NEEDED = 10;
let currentQuestionIndex = 0;

const MY_WORD_BANK = [
    "Wrench", "Pliers", "Appliances", "Reassemble", "Tinkering", 
    "Lawn Mower", "Engine", "Elaborate", "Scratch", "Sweater", 
    "Contraptions", "Engineering", "Hazards", "Coveralls", "Obnoxious", 
    "Beamed", "Frantically", "Altitude", "Canoeing", "Precision", 
    "Grateful", "Miserable", "Appetite", "Jubilantly", "Valor", "Esteem"
];

// 🚀 ROBUST FALLBACK DATABASE
const fallbackQuestions = [
    { question: "What does the word 'Reassemble' mean?", options: ["To put pieces back together", "To break apart completely", "To move very quickly", "To clear out space"], correct: 0 },
    { question: "What does the word 'Precision' mean?", options: ["The quality of being exact and accurate", "Moving in a clumsy way", "A type of heavy machinery", "Feeling completely lost"], correct: 0 },
    { question: "What does the word 'Hazards' mean?", options: ["Safe environments", "Potential sources of danger", "Tools used for digging", "Types of dynamic airplanes"], correct: 1 },
    { question: "What does the word 'Altitude' mean?", options: ["The speed of an object", "The height of an object above sea level", "The weight of a fuel tank", "The direction of wind currents"], correct: 1 }
];

async function preloadAllQuestions() {
    console.log(`[Cache Log]: Initializing vocabulary matrix for ${TOTAL_QUESTIONS_NEEDED} items...`);
    const shuffledWords = [...MY_WORD_BANK].sort(() => 0.5 - Math.random());

    for (let i = 0; i < TOTAL_QUESTIONS_NEEDED; i++) {
        const targetWord = shuffledWords[i % shuffledWords.length];
        let success = false;
        let attempts = 0;

        // Try up to 2 times per word before falling back gracefully
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

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                if (!data.reply) throw new Error("Empty payload response.");

                const parsedQuestion = parseRawTextToQuiz(data.reply);
                if (parsedQuestion) {
                    questionPool.push(parsedQuestion);
                    success = true;
                } else {
                    throw new Error("Text structural parse exception.");
                }
            } catch (error) {
                console.warn(`[Preloader Warning]: Attempt ${attempts + 1} failed for "${targetWord}". Error: ${error.message}`);
                attempts++;
            }
        }

        // 🚀 SAFE RECOVERY: If API fails, pull a dynamic fallback question so the bar keeps moving!
        if (!success) {
            console.log(`[Preloader]: Injecting local fallback question context asset for index alignment.`);
            const fallbackItem = fallbackQuestions[i % fallbackQuestions.length];
            questionPool.push({ ...fallbackItem });
        }

        updateProgressBar(questionPool.length);
    }

    // Activate the Takeoff Engine button once the batch hits 10 items
    const actionButton = document.getElementById("action-button");
    if (actionButton) {
        actionButton.innerText = "START FLIGHT 🛫";
        actionButton.disabled = false;
        actionButton.style.opacity = "1";
        actionButton.style.cursor = "pointer";
        actionButton.style.background = "linear-gradient(135deg, #2ecc71, #27ae60)";
    }
}

function updateProgressBar(count) {
    const progressFill = document.getElementById("flight-progress-fill");
    const progressText = document.getElementById("progress-text");
    const percentage = Math.floor((count / TOTAL_QUESTIONS_NEEDED) * 100);

    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.innerText = `LOADING FLIGHT PLANS: ${count} / ${TOTAL_QUESTIONS_NEEDED} (${percentage}%)`;
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
        return null;
    } catch (e) {
        return null;
    }
}

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

function verifyPlayerAnswer(selectedIndex, correctIndex) {
    const quizModal = document.getElementById("quiz-modal");
    if (quizModal) quizModal.classList.add("hidden");

    if (selectedIndex === correctIndex) {
        currentQuestionIndex = (currentQuestionIndex + 1) % questionPool.length;
        if (typeof window.resumeFlight === "function") window.resumeFlight();
    } else {
        if (typeof window.applyDamage === "function") window.applyDamage();
    }
}

window.questionPool = questionPool;
window.useLoadedQuestion = useLoadedQuestion;

document.addEventListener("DOMContentLoaded", () => {
    preloadAllQuestions();
});