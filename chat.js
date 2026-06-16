const VERCEL_BACKEND_URL = "https://game1-shfe.vercel.app/api/chat";

// 🚀 NEW: Array structure to hold the 10 preloaded questions
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

const fallbackQuestions = [
    { question: "What does the word 'Reassemble' mean?", options: ["To put pieces back together", "To break apart completely", "To move very quickly", "To clear out space"], correct: 0 },
    { question: "What does the word 'Precision' mean?", options: ["The quality of being exact and accurate", "Moving in a clumsy way", "A type of heavy machinery", "Feeling completely lost"], correct: 0 }
];

// 🚀 NEW: Batched loop loader that pulls all questions sequentially on initial launch
async function preloadAllQuestions() {
    console.log(`[Terminal Log]: 🛫 Starting batch preloading sequence for ${TOTAL_QUESTIONS_NEEDED} questions...`);
    
    // Shuffle the word bank list so matches don't run in the exact same sequence order
    const shuffledWords = [...MY_WORD_BANK].sort(() => 0.5 - Math.random());

    for (let i = 0; i < TOTAL_QUESTIONS_NEEDED; i++) {
        const targetWord = shuffledWords[i % shuffledWords.length];
        let success = false;
        let attempts = 0;

        while (!success && attempts < 2) {
            try {
                const systemPrompt = `Generate one unique intermediate English vocabulary multiple-choice question for the target word: "${targetWord}".
Format your entire response exactly like this example layout text and do not include markdown blocks, symbols, or extra characters:
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

                if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
                const data = await response.json();
                if (!data.reply) throw new Error("Empty payload from server.");

                const parsedQuestion = parseRawTextToQuiz(data.reply);
                if (parsedQuestion) {
                    questionPool.push(parsedQuestion);
                    success = true;
                    console.log(`[Terminal Log]: Cache position [${i + 1}/10] loaded successfully for: ${targetWord}`);
                } else {
                    throw new Error("Regex structural parse mismatch.");
                }
            } catch (error) {
                attempts++;
                console.warn(`⚠️ Fetch attempt ${attempts} failed for "${targetWord}". Retrying...`);
            }
        }

        // If both attempts fail to reach the live API, load a clean fallback item gracefully
        if (!success) {
            console.error(`❌ Fetching completely failed for "${targetWord}". Injecting safe fallback dynamic node item.`);
            const fallbackItem = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
            questionPool.push({...fallbackItem, question: `[Local] ${fallbackItem.question}`});
        }

        // Update loading bar progress values mathematically
        updateProgressBar(questionPool.length);
    }

    // Unlock the entry flight button once the cache array is full
    const actionButton = document.getElementById("action-button");
    if (actionButton) {
        actionButton.innerText = "Start Flight 🛫";
        actionButton.disabled = false;
        actionButton.style.opacity = "1";
        actionButton.style.cursor = "pointer";
    }
}

function updateProgressBar(count) {
    const progressFill = document.getElementById("flight-progress-fill");
    const progressText = document.getElementById("progress-text");
    const percentage = Math.floor((count / TOTAL_QUESTIONS_NEEDED) * 100);

    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.innerText = `Preloading Gemini AI Questions: ${count} / ${TOTAL_QUESTIONS_NEEDED} (${percentage}%)`;
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

    // Pull directly from our 10 preloaded questions
    let currentQuestion = questionPool[currentQuestionIndex];

    // Safety fallback loop in case of array boundary index exceptions
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
        // Move forward to tracking next question element index in our pool cache array
        currentQuestionIndex = (currentQuestionIndex + 1) % TOTAL_QUESTIONS_NEEDED;
        if (typeof resumeFlight === "function") resumeFlight();
    } else {
        if (typeof applyDamage === "function") applyDamage();
    }
}

window.useLoadedQuestion = useLoadedQuestion;

// Trigger batch preloading execution immediately on page loading completion
document.addEventListener("DOMContentLoaded", () => {
    preloadAllQuestions();
});