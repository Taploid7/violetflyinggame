// =========================================================================
// 🧠 VIOLET THE PILOT - BACKEND AI PRELOADER & INTERCEPT MANAGEMENT SYSTEM
// =========================================================================

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

// 📚 ELEMENTARY TAIWAN INTRODUCTORY ENGLISH LEVEL DICTIONARY
const LOCAL_DICTIONARY = {
    "Wrench": { definition: "A tool to turn and fix bolts", wrongs: ["A small bird", "A fast car", "A winter hat"] },
    "Pliers": { definition: "A hand tool to hold things tight or cut wire", wrongs: ["A music player", "Running shoes", "A cooking pot"] },
    "Appliances": { definition: "Machines used in the house, like a TV or fridge", wrongs: ["Forest animals", "Big mountains", "Story books"] },
    "Reassemble": { definition: "To put pieces back together again", wrongs: ["To break something", "To paint a room", "To run away"] },
    "Tinkering": { definition: "Fixing or playing with toys and machines", wrongs: ["Sleeping all day", "Eating a big dinner", "Shouting loudly"] },
    "Lawn Mower": { definition: "A machine used to cut grass", wrongs: ["A swim tool", "A computer game", "A kitchen microwave"] },
    "Engine": { definition: "The machine part that makes a car or plane move", wrongs: ["A notebook", "A soft blanket", "Fruit juice"] },
    "Elaborate": { definition: "Beautiful with many small and careful details", wrongs: ["Plain and empty", "Very broken", "Super fast"] },
    "Scratch": { definition: "To hurt the skin or a wall with fingernails or keys", wrongs: ["To sing a song", "To fly a kite", "To cook soup"] },
    "Sweater": { definition: "Warm clothes you wear on your body when it is cold", wrongs: ["A big truck", "A school desk", "A noisy dog"] },
    "Contraptions": { definition: "Strange or funny machines", wrongs: ["Fresh apples", "Wooden blocks", "White clouds"] },
    "Engineering": { definition: "The work of building roads, bridges, and machines", wrongs: ["Drawing pictures", "Writing stories", "Playing basketball"] },
    "Hazards": { definition: "Dangerous things that can hurt you", wrongs: ["Safe playgrounds", "Fun video games", "Soft pillows"] },
    "Coveralls": { definition: "One piece of work clothes that covers the whole body", wrongs: ["Sunglasses", "Shiny shoes", "A king's crown"] },
    "Obnoxious": { definition: "Very noisy, rude, and annoying", wrongs: ["Kind and sweet", "Quiet and nice", "Pretty and clean"] },
    "Beamed": { definition: "Smiled with a very big and happy face", wrongs: ["Cried loudly", "Fell asleep", "Ran away safely"] },
    "Frantically": { definition: "Doing something very fast because you are scared or worried", wrongs: ["Moving very slowly", "Sleeping deeply", "Eating a snack"] },
    "Altitude": { definition: "How high something is in the sky", wrongs: ["How fast a plane is", "How heavy a bag is", "The color of the sky"] },
    "Canoeing": { definition: "Rowing a small, long boat in the water", wrongs: ["Flying a plane", "Riding a bicycle", "Skiing on snow"] },
    "Precision": { definition: "Being completely correct, exact, and careful", wrongs: ["Clumsy falling", "Feeling lost", "A heavy truck"] },
    "Grateful": { definition: "Feeling happy and saying 'thank you' for help", wrongs: ["Very angry", "Bored and sad", "Rude and mean"] },
    "Miserable": { definition: "Very, very sad and unhappy", wrongs: ["Happy and glad", "Strong and big", "Fast and active"] },
    "Appetite": { definition: "Feeling hungry and wanting to eat food", wrongs: ["A bike tool", "A winter storm", "Being very tired"] },
    "Jubilantly": { definition: "Cheering and shouting with great joy", wrongs: ["Very sadly", "Quietly and softly", "With an angry face"] },
    "Valor": { definition: "Great bravery when things are scary", wrongs: ["Being lazy", "Being scared", "Telling funny jokes"] },
    "Esteem": { definition: "Respecting and liking someone because they are good", wrongs: ["Hating someone", "Heavy exercise", "Forgetting names"] }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function preloadAllQuestions() {
    console.log(`[Terminal Log]: Starting paced preloading sequence for ${TOTAL_QUESTIONS_NEEDED} questions...`);
    const shuffledWords = [...MY_WORD_BANK].sort(() => 0.5 - Math.random());

    for (let i = 0; i < TOTAL_QUESTIONS_NEEDED; i++) {
        const targetWord = shuffledWords[i % shuffledWords.length];
        let success = false;
        let attempts = 0;

        await delay(2000);

        while (!success && attempts < 2) {
            try {
                const systemPrompt = `Generate one unique English vocabulary multiple-choice question for the word: "${targetWord}".
Keep the English level extremely simple, suitable for elementary school ESL kids in Taiwan. Use short words and basic sentences.
Format your entire response exactly like this example layout text:
Question: What does the word "Diligent" mean?
A) Working hard and carefully
B) Lazy and slow
C) Angry and loud
D) Small and fast
Correct: A`;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);

                const response = await fetch(VERCEL_BACKEND_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: systemPrompt }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
                
                const data = await response.json();
                
                if (data.success === false || !data.reply) {
                    throw new Error(data.error || "Backend skipped payload delivery.");
                }

                const parsedQuestion = parseRawTextToQuiz(data.reply);
                if (parsedQuestion) {
                    questionPool.push(parsedQuestion);
                    success = true;
                    console.log(`[Preloader]: Cached question for "${targetWord}" via Gemini.`);
                } else {
                    throw new Error("Text structural parse divergence error.");
                }
            } catch (error) {
                console.warn(`[Preloader Warning]: Fetch failure for "${targetWord}" (Attempt ${attempts + 1}): ${error.message}`);
                attempts++;
                if (attempts < 2) await delay(1000);
            }
        }

        if (!success) {
            console.log(`[Preloader]: Generating elementary fallback question for "${targetWord}".`);
            const wordData = LOCAL_DICTIONARY[targetWord] || { 
                definition: "To study and learn English words", 
                wrongs: ["To jump up high", "To run backward", "To sleep now"] 
            };
            
            const optionsList = [wordData.definition, ...wordData.wrongs];
            const originalDefinition = wordData.definition;
            
            const shuffledOptions = [...optionsList].sort(() => 0.5 - Math.random());
            const correctIndex = shuffledOptions.indexOf(originalDefinition);

            questionPool.push({
                question: `What does the word "${targetWord}" mean?`,
                options: shuffledOptions,
                correct: correctIndex
            });
        }

        updateProgressBar(questionPool.length);
    }

    const startBtn = document.getElementById("start-btn");
    if (startBtn) {
        startBtn.innerText = "START FLIGHT 🛫";
        startBtn.disabled = false;
    }
}

function updateProgressBar(count) {
    const progressFill = document.getElementById("flight-progress-fill");
    const progressText = document.getElementById("progress-text");
    const percentage = Math.floor((count / TOTAL_QUESTIONS_NEEDED) * 100);

    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressText) progressText.innerText = `Syncing with Gemini AI: ${percentage}%`;
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
        currentQuestion = {
            question: "What does the word 'Sweater' mean?",
            options: ["Warm clothes you wear when it is cold", "A big truck", "A school desk", "A noisy dog"],
            correct: 0
        };
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
        if (typeof window.resumeGameAfterSave === "function") window.resumeGameAfterSave();
    } else {
        if (typeof window.deductHeart === "function") window.deductHeart();
    }
}

window.questionPool = questionPool;
window.useLoadedQuestion = useLoadedQuestion;

document.addEventListener("DOMContentLoaded", () => {
    preloadAllQuestions();
});