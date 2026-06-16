const VERCEL_BACKEND_URL = "https://game1-shfe.vercel.app/api/chat";

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

// Clean out markdown ticks, extra spacing, or stray text characters
function cleanAndParseJSON(rawText) {
    let cleanText = rawText.trim();
    
    // Remove markdown block headers if they exist
    if (cleanText.includes("```json")) {
        cleanText = cleanText.split("```json")[1].split("```")[0];
    } else if (cleanText.includes("```")) {
        cleanText = cleanText.split("```")[1].split("```")[0];
    }
    
    cleanText = cleanText.trim();
    
    // Locate the first opening bracket and last closing bracket to isolate pure JSON
    const firstBracket = cleanText.indexOf("{");
    const lastBracket = cleanText.lastIndexOf("}");
    
    if (firstBracket !== -1 && lastBracket !== -1) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
    }
    
    return JSON.parse(cleanText);
}

async function prefetchNextQuestion() {
    if (isPrefetching) return;
    isPrefetching = true;

    const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)];
    
    // Enforce an absolute role-play rule in the prompt
    const promptText = `You are a quiz engine backend. Generate a multiple-choice question testing the true definition of the English word "${randomWord}". 
    Respond ONLY with a raw JSON object matching the schema below. No conversational words, no introductory text, no markdown block backticks.
    
    {"question": "What does the word \\"${randomWord}\\" mean?", "options": ["Option Definition 1", "Option Definition 2", "Option Definition 3", "Option Definition 4"], "correctIndex": 0}`;

    try {
        const response = await fetch(VERCEL_BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: promptText })
        });

        if (!response.ok) throw new Error("API Connection Dropped");

        const data = await response.json();
        const rawPayload = data.reply || data.text;
        
        // Run our bulletproof cleaning parser engine
        let quizData = cleanAndParseJSON(rawPayload);
        
        // Randomly scramble options arrays instantly on reception
        let items = quizData.options.map((opt, i) => ({ text: opt, isCorrect: i === quizData.correctIndex }));
        items.sort(() => Math.random() - 0.5);
        
        quizData.options = items.map(item => item.text);
        quizData.correctIndex = items.findIndex(item => item.isCorrect);

        cachedQuizData = quizData; 
    } catch (error) {
        console.warn("AI generation parser failed; deploying safe client-side dynamic dictionary backup:", error);
        cachedQuizData = generateFallbackPayload(randomWord);
    } finally {
        isPrefetching = false;
    }
}

function useLoadedQuestion() {
    const questionTextElement = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    
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

    cachedQuizData = null;
    prefetchNextQuestion();
}

function generateFallbackPayload(word) {
    // Dictionary backup maps true definitions to break loop patterns
    const dictionary = {
        "Wrench": ["A hand tool used for twisting bolts and nuts", "A footwear accessory", "A device used to warm meals", "A type of musical instrument"],
        "Sweater": ["A knitted garment worn to keep warm", "A plastic storage container", "A fast-moving running vehicle", "A tool used for digging gardens"],
        "Esteem": ["High respect, admiration, or value for someone", "A heavy liquid used in car engines", "A feeling of deep confusion", "A loud noise made by aircraft"],
        "Grateful": ["Feeling or showing thanks and appreciation", "Angry about an unexpected delay", "Extremely tired after long exercise", "Unsure of directions on a map"]
    };

    let dataset = dictionary[word] || [
        `The correct vocabulary definition matching the word "${word}"`,
        `An incorrect definition action block`,
        `A completely unrelated concept choice`,
        `A description of an unrelated item or tool`
    ];

    let options = [...dataset];
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