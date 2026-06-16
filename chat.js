const VERCEL_BACKEND_URL = "https://game1-shfe.vercel.app/api/chat";

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

    questionTextElement.innerText = "Connecting to Flight Control AI...";
    optionsContainer.innerHTML = ""; 

    // Optimized pure instructions to ensure valid JSON data output without formatting errors
    const promptText = `Generate a multiple choice question testing the English definition of the vocabulary word "${randomWord}" for young students. Return ONLY a single JSON object. Do not include markdown formatting, backticks, or code block markers. 
    JSON Structure:
    {"question": "What does the word ... mean?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctIndex": 0}`;

    try {
        const response = await fetch(VERCEL_BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: promptText })
        });

        if (!response.ok) throw new Error("API Connection Failed");

        const data = await response.json();
        let rawPayload = data.reply || data.text;
        
        // Strip out stray backticks if they sneak past filters
        if (typeof rawPayload === "string") {
            rawPayload = rawPayload.replace(/```json/g, "").replace(/```/g, "").trim();
        }
        
        let quizData = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
        
        // Randomly shuffle options array so index position varies dynamically every single run
        let items = quizData.options.map((opt, i) => ({ text: opt, isCorrect: i === quizData.correctIndex }));
        items.sort(() => Math.random() - 0.5);
        
        quizData.options = items.map(item => item.text);
        quizData.correctIndex = items.findIndex(item => item.isCorrect);

        displayAIQuestion(quizData);

    } catch (error) {
        console.warn("AI Generation failed or timed out. Initiating client-side engine:", error);
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
    // Dynamically generate scrambled placeholders if connection ever goes offline
    let wrongMeanings = [
        `An action related to moving quickly`,
        `A mechanical process or tool assembly`,
        `Something completely unrelated to ${word}`,
        `An object used inside standard classrooms`
    ];
    
    let options = [`The true vocabulary definition matching ${word}`];
    while(options.length < 4) {
        let randIdx = Math.floor(Math.random() * wrongMeanings.length);
        if(!options.includes(wrongMeanings[randIdx])) {
            options.push(wrongMeanings[randIdx]);
        }
    }
    
    // Scramble the location index of the accurate answer choice randomly
    let items = options.map((opt, i) => ({ text: opt, original: i === 0 }));
    items.sort(() => Math.random() - 0.5);
    
    const mockData = {
        question: `What does the vocabulary word "${word}" mean?`,
        options: items.map(i => i.text),
        correctIndex: items.findIndex(i => i.original)
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