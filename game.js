const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load Visuals Assets
const violetSprite = new Image();
violetSprite.src = "assets/violet.png"; 

// Game Values (Calibrated safely for center placement)
let violet = { x: 100, y: 220, width: 60, height: 60, gravity: 0.10, velocity: 0 };
let score = 0;
let lives = 3;
let isGameActive = true;
let isPausedForQuiz = false;

// Continuous Map Settings
let bgX = 0;
const bgSpeed = 2;

// --- DYNAMIC ENGINE SHAKING VARIABLES ---
let jitterTimer = 0;
const jitterSpeed = 0.8; 
const jitterAmount = 5;  

// Track spacebar inputs
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && isGameActive && !isPausedForQuiz) {
        violet.velocity = -3.2; 
    }
});

function update() {
    if (!isGameActive || isPausedForQuiz) return;

    // Apply standard engine physics gravity
    violet.velocity += violet.gravity;
    violet.y += violet.velocity;

    // Advance engine rumble clock frame
    jitterTimer += jitterSpeed;

    // Move the infinite looping background map framework coordinates leftward
    bgX -= bgSpeed;
    if (bgX <= -canvas.width) {
        bgX = 0;
    }

    // Checking Bottom/Top Collision boundaries safely (Leaves 10px breathing room)
    if (violet.y + violet.height >= canvas.height - 10 || violet.y <= 10) {
        triggerDippedQuizEvent();
    }

    score += 1;
    document.getElementById("score-container").innerText = `Score: ${Math.floor(score / 10)}`;
}

function render() {
    // Clear canvas setup
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Continuous background sky generation
    ctx.fillStyle = "#2c3e50"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw running track floor ground base indicators
    ctx.fillStyle = "#34495e";
    ctx.fillRect(bgX, 470, canvas.width, 30);
    ctx.fillRect(bgX + canvas.width, 470, canvas.width, 30);

    // Calculate engine jitter offset position
    let currentJitter = (isGameActive && !isPausedForQuiz) ? Math.sin(jitterTimer) * jitterAmount : 0;
    let renderedY = violet.y + currentJitter;

    // Render Violet Character Image Asset Layer with Jitter
    if (violetSprite.complete && violetSprite.naturalWidth !== 0) {
        ctx.drawImage(violetSprite, violet.x, renderedY, violet.width, violet.height);
    } else {
        // Development backup square indicator
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(violet.x, renderedY, violet.width, violet.height);
    }
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function triggerDippedQuizEvent() {
    isPausedForQuiz = true;
    violet.y = 220; // Safe midpoint reset
    violet.velocity = 0;
    
    // Explicitly hide Game Over card when quiz shows up
    document.getElementById("game-over-screen").classList.add("hidden");
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
    let heartsStr = "";
    for(let i=0; i<lives; i++) { heartsStr += "❤️"; }
    document.getElementById("hearts-container").innerText = heartsStr;
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
    document.getElementById("final-score").innerText = `You flew across Taiwan with a score of: ${Math.floor(score / 10)}!`;
}

function resetGame() {
    lives = 3;
    score = 0;
    violet.y = 220;
    violet.velocity = 0;
    isGameActive = true;
    isPausedForQuiz = false;
    updateHeartsDisplay();
    document.getElementById("quiz-modal").classList.add("hidden");
    document.getElementById("game-over-screen").classList.add("hidden");
}

// Start Game Engine Lifecycle Execution
gameLoop();