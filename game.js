const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load Visuals Assets
const violetSprite = new Image();
violetSprite.src = "assets/violet.png"; 

// Game Values
let violet = { x: 100, y: 200, width: 50, height: 50, gravity: 0.25, velocity: 0 };
let score = 0;
let lives = 3;
let isGameActive = true;
let isPausedForQuiz = false;

// Continuous Map Settings
let bgX = 0;
const bgSpeed = 2;

// --- JITTER EFFECT VARIABLES ---
let jitterTimer = 0;
const jitterSpeed = 0.5; // How fast she vibrates
const jitterAmount = 3;  // How many pixels she vibrates up and down

// Track user key configurations
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && isGameActive && !isPausedForQuiz) {
        violet.velocity = -5.5; 
    }
});

function update() {
    if (!isGameActive || isPausedForQuiz) return;

    // Apply standard engine physics gravity
    violet.velocity += violet.gravity;
    violet.y += violet.velocity;

    // Advance the jitter timer animation frame when the game is running
    jitterTimer += jitterSpeed;

    // Move the infinite looping background map framework coordinates leftward
    bgX -= bgSpeed;
    if (bgX <= -canvas.width) {
        bgX = 0;
    }

    // Checking Bottom Collision or dipping under threshold lines
    if (violet.y + violet.height >= canvas.height || violet.y <= 0) {
        triggerDippedQuizEvent();
    }

    score += 1;
    document.getElementById("score-container").innerText = `Score: ${Math.floor(score / 10)}`;
}

function render() {
    // Clear canvas setup
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Continuous background generation render pipeline loop
    ctx.fillStyle = "#87CEEB"; 
    ctx.fillRect(bgX, 0, canvas.width, canvas.height);
    ctx.fillRect(bgX + canvas.width, 0, canvas.width, canvas.height);

    // Calculate engine jitter offset position
    // If paused, stop jittering so the screen looks stable
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
    violet.y = 200; 
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
    let heartsStr = "";
    for(let i=0; i<lives; i++) { heartsStr += "❤️"; }
    document.getElementById("hearts-container").innerText = heartsStr;
}

function resumeGameAfterSave() {
    isPausedForQuiz = false;
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
    violet.y = 200;
    violet.velocity = 0;
    isGameActive = true;
    isPausedForQuiz = false;
    updateHeartsDisplay();
    document.getElementById("game-over-screen").classList.add("hidden");
}

// Start Game Engine Lifecycle Execution
gameLoop();