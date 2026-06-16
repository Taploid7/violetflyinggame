const VERCEL_BACKEND_URL = "https://game1-shfe-git-main-taploid7s-projects.vercel.app/api/chat";

const vocabularyWords = [
    "Wrench", "Pliers", "Appliances", "Reassemble", "Tinkering", "Lawn Mower", 
    "Engine", "Elaborate", "Scratch", "Sweater", "Contraptions", "Engineering", 
    "Hazards", "Coveralls", "Obnoxious", "Beamed", "Frantically", "Altitude", 
    "Canoeing", "Precision", "Grateful", "Miserable", "Appetite", "Jubilantly", 
    "Valor", "Esteem"
];

let currentCorrectIndex = 0;

async function fetchAIQuestion() {
    const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)];
    const questionTextElement = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");

    questionTextElement.innerText = "Connecting to air traffic control AI...";
    optionsContainer.innerHTML = ""; 

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
        const rawPayload = data.reply || data.text;
        const quizData = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
        
        displayAIQuestion(quizData);

    } catch (error) {
        console.warn("AI fetch failed, rendering offline backup question:", error);
        fallbackQuestion(randomWord);
    }
}

function displayAIQuestion(quizData) {
    const questionTextElement = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    
    questionTextElement.innerText = quizData.question;
    optionsContainer.innerHTML = ""; 
    currentCorrectIndex = quizData.correctIndex;

    quizData.options.forEach((optionText, index) => {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.innerText = optionText;
        button.onclick = () => checkAnswer(index, currentCorrectIndex);
        optionsContainer.appendChild(button);
    });
}

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

function checkAnswer(selectedIndex, correctIndex) {
    if (selectedIndex === correctIndex) {
        document.getElementById("quiz-modal").classList.add("hidden");
        resumeGameAfterSave(); 
    } else {
        deductHeart(); 
    }
}