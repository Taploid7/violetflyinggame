const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const violetSprite = new Image();
violetSprite.src = "assets/violet.png"; 

// Game State Variables
let violet = { x: 100, y: 220, width: 60, height: 60, gravity: 0.10, velocity: 0 };
let score = 0, lives = 3;
let isGameStarted = false;
let isGameActive = false;
let isPausedForQuiz = false;

let bgX = 0, bgSpeed = 2, jitterTimer = 0;

// Input
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && isGameActive && !isPausedForQuiz && isGameStarted) {
        violet.velocity = -3.2;
    }
});

// UI Controls
function startGameNow() {
    isGameStarted = true; 
    isGameActive = true; 
    isPausedForQuiz = false; 
    lives = 3; 
    score = 0; 
    violet.y = 220;
    violet.velocity = 0;
    
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("quiz-modal").classList.add("hidden");
    document.getElementById("game-over-screen").classList.add("hidden");
    document.getElementById("ui-layer").classList.remove("hidden");
    updateHeartsDisplay();
}

function update() {
    // Blocks all logic if menu is up
    if (!isGameStarted || !isGameActive || isPausedForQuiz) return;
    
    violet.velocity += violet.gravity;
    violet.y += violet.velocity;
    jitterTimer += 0.8;
    
    bgX -= bgSpeed;
    if (bgX <= -canvas.width) bgX = 0;
    
    // Bounds Check
    if (violet.y + violet.height >= canvas.height - 10 || violet.y <= 10) {
        triggerDippedQuizEvent();
    }
    
    score += 1;
    document.getElementById("score-container").innerText = `Score: ${Math.floor(score / 10)}`;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sky
    ctx.fillStyle = "#2c3e50"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Floor track
    ctx.fillStyle = "#34495e";
    ctx.fillRect(bgX, 470, canvas.width, 30);
    ctx.fillRect(bgX + canvas.width, 470, canvas.width, 30);

    let offset = (isGameActive && !isPausedForQuiz && isGameStarted) ? Math.sin(jitterTimer) * 5 : 0;
    
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

// Game Flow Handlers
function triggerDippedQuizEvent() {
    isPausedForQuiz = true;
    violet.y = 220; 
    violet.velocity = 0;
    document.getElementById("quiz-modal").classList.remove("hidden");
    fetchAIQuestion(); 
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
    violet.y = 220;
    violet.velocity = 0;
    document.getElementById("quiz-modal").classList.add("hidden");
}

function endGame() {
    isGameActive = false;
    document.getElementById("quiz-modal").classList.add("hidden");
    document.getElementById("game-over-screen").classList.remove("hidden");
    document.getElementById("final-score").innerText = `You explored Taiwan! Score: ${Math.floor(score / 10)}`;
}

function resetGame() { 
    startGameNow(); 
}

// Start
gameLoop();