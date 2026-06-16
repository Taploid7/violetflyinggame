const VERCEL_BACKEND_URL = "[https://game1-shfe.vercel.app/api/chat](https://game1-shfe.vercel.app/api/chat)";

const vocabularyWords = [
    "Wrench", "Pliers", "Appliances", "Reassemble", "Tinkering", "Lawn Mower", 
    "Engine", "Elaborate", "Scratch", "Sweater", "Contraptions", "Engineering", 
    "Hazards", "Coveralls", "Obnoxious", "Beamed", "Frantically", "Altitude", 
    "Canoeing", "Precision", "Grateful", "Miserable", "Appetite", "Jubilantly", 
    "Valor", "Esteem"
];

let currentCorrectIndex = 0;
let cachedQuizData = null; // Background memory slot for pre-fetched questions
let isPrefetching = false;

// Quietly fetches the next question while the student is flying
async function prefetchNextQuestion() {
    if (isPrefetching) return;
    isPrefetching = true;

    const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)];
    const promptText = `Generate a child-friendly multiple choice question testing the true definition of the word "${randomWord}". Return ONLY a JSON object. No markdown, no backticks.
    Format:
    {"question": "What does the word ... mean?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0}`;

    try {
        const response = await fetch(VERCEL_BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: promptText })
        });

        if (!response.ok) throw new Error("Network down");

        const data = await response.json();
        let rawPayload = data.reply;
        
        if (typeof rawPayload === "string") {
            rawPayload = rawPayload.replace(/```json/g, "").replace(/```/g, "").trim();
        }
        
        let quizData = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
        
        // Randomly scramble options arrays instantly on reception
        let items = quizData.options.map((opt, i) => ({ text: opt, isCorrect: i === quizData.correctIndex }));
        items.sort(() => Math.random() - 0.5);
        
        quizData.options = items.map(item => item.text);
        quizData.correctIndex = items.findIndex(item => item.isCorrect);

        cachedQuizData = quizData; // Successfully saved to background cache memory!
    } catch (error) {
        console.warn("Background prefetch delayed; building emergency backup payload.", error);
        cachedQuizData = generateFallbackPayload(randomWord);
    } finally {
        isPrefetching = false;
    }
}

// Spawns the screen items immediately out of pre-fetched background memory
function useLoadedQuestion() {
    const questionTextElement = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    
    // If the network hasn't returned a question yet, run a fast fallback generator
    if (!cachedQuizData) {
        const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)];
        cachedQuizData = generateFallbackPayload(randomWord);
    }

    questionTextElement.innerText = cachedQuizData.question;
    optionsContainer.innerHTML = ""; 
    currentCorrectIndex = cachedQuizData.correctIndex;

    cachedQuizData.options.forEach((optionText, index) => {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.innerText = optionText;
        button.onclick = () => checkAnswer(index, currentCorrectIndex);
        optionsContainer.appendChild(button);
    });

    // Wipe used cache slot clean and immediately start downloading the next one
    cachedQuizData = null;
    prefetchNextQuestion();
}

function generateFallbackPayload(word) {
    let wrongMeanings = [
        `An action related to moving quickly`,
        `A mechanical process or tool assembly`,
        `Something completely unrelated to ${word}`,
        `An object used inside standard classrooms`
    ];
    let options = [`The true definition matching "${word}"`];
    while(options.length < 4) {
        let randIdx = Math.floor(Math.random() * wrongMeanings.length);
        if(!options.includes(wrongMeanings[randIdx])) options.push(wrongMeanings[randIdx]);
    }
    let items = options.map((opt, i) => ({ text: opt, original: i === 0 }));
    items.sort(() => Math.random() - 0.5);
    
    return {
        question: `What does the vocabulary word "${word}" mean?`,
        options: items.map(i => i.text),
        correctIndex: items.findIndex(i => i.original)
    };
}

function checkAnswer(selectedIndex, correctIndex) {
    if (selectedIndex === correctIndex) {
        document.getElementById("quiz-modal").classList.add("hidden");
        resumeGameAfterSave(); 
    } else {
        deductHeart(); 
    }
}