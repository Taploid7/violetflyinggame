const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const violetSprite = new Image();
violetSprite.src = "assets/violet.png"; 

const bgImage = new Image();
bgImage.src = "assets/background.png";

let violet = { x: 100, y: 220, width: 60, height: 60, gravity: 0.04, velocity: 0 };
let score = 0, lives = 3;
let isGameStarted = false;
let isGameActive = false;
let isPausedForQuiz = false;
let hasWon = false;

let bgX = 0, bgSpeed = 1.5, jitterTimer = 0;

window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && isGameActive && !isPausedForQuiz && isGameStarted) {
        violet.velocity = -2.0;
    }
});

function startGameNow() {
    isGameStarted = true; 
    isGameActive = true; 
    isPausedForQuiz = false; 
    hasWon = false;
    lives = 3; 
    score = 0; 
    violet.y = 220;
    violet.velocity = 0;
    
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("quiz-modal").classList.add("hidden");
    document.getElementById("game-over-screen").classList.add("hidden");
    document.getElementById("victory-screen").classList.add("hidden");
    document.getElementById("ui-layer").classList.remove("hidden");
    updateHeartsDisplay();
}

function update() {
    if (!isGameStarted || !isGameActive || isPausedForQuiz) return;
    
    violet.velocity += violet.gravity;
    violet.y += violet.velocity;
    jitterTimer += 0.2; 
    
    if (bgImage.complete && bgImage.naturalWidth > 0) {
        let scaleFactor = canvas.height / bgImage.naturalHeight;
        let scaledWidth = bgImage.naturalWidth * scaleFactor;
        
        bgX -= bgSpeed;
        if (bgX <= -scaledWidth) {
            bgX = 0;
        }
    } else {
        bgX -= bgSpeed;
        if (bgX <= -canvas.width) bgX = 0;
    }
    
    if (violet.y + violet.height >= canvas.height - 30 || violet.y <= 10) {
        triggerDippedQuizEvent();
    }
    
    score += 1;
    let finalScore = Math.floor(score / 10);
    document.getElementById("score-container").innerText = `Score: ${finalScore}`;

    if (finalScore >= 100 && !hasWon) {
        triggerVictoryEvent();
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (bgImage.complete && bgImage.naturalWidth !== 0) {
        let scaleFactor = canvas.height / bgImage.naturalHeight;
        let scaledWidth = bgImage.naturalWidth * scaleFactor;
        
        ctx.drawImage(bgImage, bgX, 0, scaledWidth, canvas.height);
        ctx.drawImage(bgImage, bgX + scaledWidth, 0, scaledWidth, canvas.height);
    } else {
        ctx.fillStyle = "#70c5ce"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    let offset = (isGameActive && !isPausedForQuiz && isGameStarted) ? Math.sin(jitterTimer) * 1.5 : 0;
    
    if (violetSprite.complete && violetSprite.naturalWidth !== 0) {
        ctx.drawImage(violetSprite, violet.x, violet.y + offset, violet.width, violet.height);
    } else {
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(violet.x, violet.y + offset, violet.width, violet.height);
    }
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function triggerDippedQuizEvent() {
    isPausedForQuiz = true;
    if (violet.y > 250) {
        violet.y = canvas.height - violet.height - 35;
    } else {
        violet.y = 15;
    }
    violet.velocity = 0;
    document.getElementById("quiz-modal").classList.remove("hidden");
    fetchAIQuestion(); 
}

// 🚀 UPDATED: Pulls clean data directly from your preloaded batch arrays
function fetchAIQuestion() {
    if (typeof window.useLoadedQuestion === "function") {
        window.useLoadedQuestion();
    } else {
        console.warn("Preloader system array unlinked. Resuming default vectors.");
        resumeGameAfterSave();
    }
}

function deductHeart() {
    lives--;
    updateHeartsDisplay();
    if (lives <= 0) {
        endGame();
    } else {
        fetchAIQuestion();
    }
}

function updateHeartsDisplay() {
    document.getElementById("hearts-container").innerText = "❤️".repeat(lives);
}

function resumeGameAfterSave() {
    isPausedForQuiz = false;
    if (violet.y > 250) {
        violet.velocity = -4.5;
    } else {
        violet.velocity = 1.0;
    }
    document.getElementById("quiz-modal").classList.add("hidden");
}

function endGame() {
    isGameActive = false;
    document.getElementById("quiz-modal").classList.add("hidden");
    document.getElementById("game-over-screen").classList.remove("hidden");
    document.getElementById("final-score").innerText = `You explored Taiwan! Score: ${Math.floor(score / 10)}`;
}

function triggerVictoryEvent() {
    isGameActive = false;
    hasWon = true;
    document.getElementById("ui-layer").classList.add("hidden");
    document.getElementById("victory-screen").classList.remove("hidden");
}

function resetGame() { 
    startGameNow(); 
}

gameLoop();