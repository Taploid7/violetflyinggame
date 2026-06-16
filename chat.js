const VERCEL_BACKEND_URL = "https://game1-shfe-git-main-taploid7s-projects.vercel.app/api/chat";

const vocabularyWords = [
    "Wrench", "Pliers", "Appliances", "Reassemble", "Tinkering", "Lawn Mower", 
    "Engine", "Elaborate", "Scratch", "Sweater", "Contraptions", "Engineering", 
    "Hazards", "Coveralls", "Obnoxious", "Beamed", "Frantically", "Altitude", 
    "Canoeing", "Precision", "Grateful", "Miserable", "Appetite", "Jubilantly", 
    "Valor", "Esteem"
];

let currentCorrectIndex = 0;
let cachedQuizData = null; 
let isPrefetching = false;

function cleanAndParseJSON(rawText) {
    let cleanText = rawText.trim();
    if (cleanText.includes("```json")) {
        cleanText = cleanText.split("```json")[1].split("```")[0];
    } else if (cleanText.includes("```")) {
        cleanText = cleanText.split("```")[1].split("```")[0];
    }
    
    const firstBracket = cleanText.indexOf("{");
    const lastBracket = cleanText.lastIndexOf("}");
    if (firstBracket !== -1 && lastBracket !== -1) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
    }
    return JSON.parse(cleanText);
}

async function prefetchNextQuestion() {
    if (isPrefetching) return false;
    isPrefetching = true;
    
    if (window.logDebug) window.logDebug("⏳ Requesting Gemini AI question...");

    const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)];
    const promptText = `You are a quiz engine backend. Generate a multiple-choice question testing the true definition of the English word "${randomWord}". 
    Respond ONLY with a raw JSON object matching the schema below. No conversational words, no introductory text, no markdown block backticks.
    {"question": "What does the word \\"${randomWord}\\" mean?", "options": ["Option Definition 1", "Option Definition 2", "Option Definition 3", "Option Definition 4"], "correctIndex": 0}`;

    try {
        const response = await fetch(VERCEL_BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: promptText })
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        const rawPayload = data.reply || data.text;
        
        let quizData = cleanAndParseJSON(rawPayload);
        
        let items = quizData.options.map((opt, i) => ({ text: opt, isCorrect: i === quizData.correctIndex }));
        items.sort(() => Math.random() - 0.5);
        
        quizData.options = items.map(item => item.text);
        quizData.correctIndex = items.findIndex(item => item.isCorrect);

        cachedQuizData = quizData; 
        if (window.logDebug) window.logDebug("✅ Gemini API fully loaded!");
        return true;
        
    } catch (error) {
        if (window.logDebug) window.logDebug("❌ AI Fetch FAILED! Using Fallback. Error: " + error.message);
        console.error("AI Error:", error);
        cachedQuizData = generateFallbackPayload(randomWord);
        return true; // Return true so fallback lets game unlock
    } finally {
        isPrefetching = false;
    }
}

function useLoadedQuestion() {
    const questionTextElement = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    
    if (!cachedQuizData) {
        if (window.logDebug) window.logDebug("⚠️ No cache found! Generating emergency fallback.");
        const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)];
        cachedQuizData = generateFallbackPayload(randomWord);
    } else {
        if (window.logDebug) window.logDebug("🎯 Injecting pre-loaded question to UI.");
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

    cachedQuizData = null;
    prefetchNextQuestion(); 
}

function generateFallbackPayload(word) {
    let options = [
        `The true definition matching "${word}"`,
        `An action related to moving quickly`,
        `Something completely unrelated to ${word}`,
        `An object used inside standard classrooms`
    ];
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
        if (window.logDebug) window.logDebug("✨ Correct answer! Resuming flight.");
        document.getElementById("quiz-modal").classList.add("hidden");
        resumeGameAfterSave(); 
    } else {
        if (window.logDebug) window.logDebug("💔 Wrong answer! Deducting heart.");
        deductHeart(); 
    }
}