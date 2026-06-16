// Vocabulary list from your textbook selection
const vocabularyWords = [
    "Wrench", "Pliers", "Appliances", "Reassemble", "Tinkering", "Lawn Mower", 
    "Engine", "Elaborate", "Scratch", "Sweater", "Contraptions", "Engineering", 
    "Hazards", "Coveralls", "Obnoxious", "Beamed", "Frantically", "Altitude", 
    "Canoeing", "Precision", "Grateful", "Miserable", "Appetite", "Jubilantly", 
    "Valor", "Esteem"
];

// Replace this with your actual Vercel deployment URL
const VERCEL_BACKEND_URL = "https://game1-shfe-git-main-taploid7s-projects.vercel.app/";

async function fetchAIQuestion() {
    // Pick a random word from the book list
    const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)];
    
    try {
        // We prompt Gemini via our safe Vercel proxy to hide the API key
        const response = await fetch(VERCEL_BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: `You are an ESL English teacher for lower-school elementary students in Taiwan. 
                Create a very simple, 1-sentence multiple choice question testing the vocabulary word: "${randomWord}".
                
                CRITICAL INSTRUCTION: Provide exactly one Chinese translation helper line in brackets for the core sentence context if needed, but keep the UI clean.
                
                Return your answer EXACTLY as a raw JSON object string with nothing else. Format:
                {
                  "question": "The sentence using or asking about the word...",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correctIndex": 0
                }`
            })
        });

        const data = await response.json();
        
        // Parse out the JSON sent back by your Vercel/Gemini setup
        // Depending on your backend design, parse standard data.text or data.reply
        const quizData = JSON.parse(data.reply || data.text);
        displayAIQuestion(quizData);

    } catch (error) {
        console.error("AI fetch failed, rendering offline backup question:", error);
        fallbackQuestion(randomWord);
    }
}

function displayAIQuestion(quizData) {
    const questionText = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    
    questionText.innerText = quizData.question;
    optionsContainer.innerHTML = ""; // Clear out previous options

    quizData.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.classList.add("option-btn");
        button.innerText = option;
        button.onclick = () => checkAnswer(index, quizData.correctIndex);
        optionsContainer.appendChild(button);
    });
}

// Fallback backup mode so your game works perfectly even if the network fails or API quota runs dry
function fallbackQuestion(word) {
    const mockData = {
        question: `What does the book vocabulary word "${word}" mean?`,
        options: [`A useful tool or concept of ${word}`, "Something completely unrelated", "An unrelated action", "A food item"],
        correctIndex: 0
    };
    displayAIQuestion(mockData);
}

function checkAnswer(selectedIndex, correctIndex) {
    if (selectedIndex === correctIndex) {
        // Correct answer saves Violet!
        document.getElementById("quiz-modal").classList.add("hidden");
        resumeGameAfterSave();
    } else {
        // Wrong answer drops an extra heart
        deductHeart();
    }
}