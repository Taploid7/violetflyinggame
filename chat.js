// Your actual Vercel deployment URL with the safe api path appended
const VERCEL_BACKEND_URL = "https://game1-shfe-git-main-taploid7s-projects.vercel.app/api/chat";

// Vocabulary list from your textbook selection
const vocabularyWords = [
    "Wrench", "Pliers", "Appliances", "Reassemble", "Tinkering", "Lawn Mower", 
    "Engine", "Elaborate", "Scratch", "Sweater", "Contraptions", "Engineering", 
    "Hazards", "Coveralls", "Obnoxious", "Beamed", "Frantically", "Altitude", 
    "Canoeing", "Precision", "Grateful", "Miserable", "Appetite", "Jubilantly", 
    "Valor", "Esteem"
];

let currentCorrectIndex = 0;

/**
 * Triggered by game.js when Violet hits a boundary.
 * Selects a random textbook word and handles the networking request.
 */
async function fetchAIQuestion() {
    // Pick a random word from the book list
    const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)];
    const questionTextElement = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");

    questionTextElement.innerText = "Connecting to air traffic control AI...";
    optionsContainer.innerHTML = ""; // Clear out previous buttons

    const promptText = `You are an ESL English teacher for lower-school elementary students in Taiwan. 
    Create a very simple, 1-sentence multiple choice question testing the vocabulary word: "${randomWord}".
    
    CRITICAL INSTRUCTION: Provide exactly one Chinese translation helper line in brackets for the core sentence context if needed, but keep the UI clean.
    
    Return your answer EXACTLY as a raw JSON object string with nothing else. Format:
    {
      "question": "The sentence using or asking about the word...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0
    }`;

    try {
        const response = await fetch(VERCEL_BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: promptText })
        });

        if (!response.ok) throw new Error("Server network error");

        const data = await response.json();
        
        // Parse out the JSON string safely depending on your backend key design
        const rawPayload = data.reply || data.text;
        const quizData = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
        
        displayAIQuestion(quizData);

    } catch (error) {
        console.warn("AI fetch failed, rendering offline backup question:", error);
        fallbackQuestion(randomWord);
    }
}

/**
 * Builds the text and layout buttons dynamically in the HTML overlay card
 */
function displayAIQuestion(quizData) {
    const questionTextElement = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    
    questionTextElement.innerText = quizData.question;
    optionsContainer.innerHTML = ""; // Clear loading screen message
    currentCorrectIndex = quizData.correctIndex;

    quizData.options.forEach((optionText, index) => {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.innerText = optionText;
        
        // Attach click validation handle to each button item
        button.onclick = () => checkAnswer(index, currentCorrectIndex);
        optionsContainer.appendChild(button);
    });
}

/**
 * Complete offline backup generator to keep the game loops running if API limits expire
 */
function fallbackQuestion(word) {
    const mockData = {
        question: `What does the book vocabulary word "${word}" mean?`,
        options: [
            `A useful tool or concept matching: ${word}`, 
            "Something completely unrelated", 
            "An unrelated classroom action", 
            "A standard food item description"
        ],
        correctIndex: 0
    };
    displayAIQuestion(mockData);
}

/**
 * Processes selection indices and coordinates reaction states back to game.js
 */
function checkAnswer(selectedIndex, correctIndex) {
    if (selectedIndex === correctIndex) {
        alert("Correct choice! Back to the skies! 🎉");
        document.getElementById("quiz-modal").classList.add("hidden");
        resumeGameAfterSave(); // Tells game.js to unfreeze the movement loop
    } else {
        alert("Incorrect definition! Lost 1 heart. 💔");
        deductHeart(); // Tells game.js to subtract a heart profile point
    }
}