// =========================================================================
// 🎮 VIOLET THE PILOT - CORE PHYSICS ENGINE & LAYOUT ENGINE CONTEXT
// =========================================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Game State Tracking ---
let isGameRunning = false;
let isQuizActive = false;
let score = 0;
let lives = 3;
let animationFrameId = null;

// --- 🖼️ CUSTOM GAME ASSETS ---
const violetImage = new Image();
violetImage.src = 'assets/violet.png'; 

const backgroundImage = new Image();
backgroundImage.src = 'assets/background.png'; 

// --- Parallax Background Tracker ---
let backgroundX = 0;
const BACKGROUND_SPEED = 2; 

// --- Pilot Physics Entities ---
let violet = {
    x: 100,
    y: 200,
    width: 65,   
    height: 50,  
    gravity: 0.35,
    lift: -6.5,
    velocity: 0
};

// --- Obstacles Array Trackers ---
let obstacles = [];
// ⏱️ Flying Time Calibration: 360 frames at 60fps = Exactly 6 seconds between obstacles!
const OBSTACLE_SPAWN_RATE = 360; 
let frameCount = 1; // Starts at 1 to prevent the '0 modulo' instant-spawn bug

// =========================================================================
// 🚀 INJECT INTERACTIVE CLICK EVENT HANDLERS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("start-btn");
    const restartBtn = document.getElementById("restart-btn");
    const winRestartBtn = document.getElementById("win-restart-btn");

    if (startBtn) {
        startBtn.onclick = () => {
            console.log("[Engine]: Launching game instance...");
            initializeNewGame();
        };
    }

    if (restartBtn) {
        restartBtn.onclick = () => {
            initializeNewGame();
        };
    }

    if (winRestartBtn) {
        winRestartBtn.onclick = () => {
            initializeNewGame();
        };
    }

    // Capture Pilot Controls (Spacebar / Up Arrow or Clicks)
    window.addEventListener("keydown", (e) => {
        if (!isGameRunning || isQuizActive) return;
        if (e.code === "Space" || e.code === "ArrowUp") {
            violet.velocity = violet.lift;
        }
    });

    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        if (!isGameRunning || isQuizActive) return;
        violet.velocity = violet.lift;
    });
    
    canvas.addEventListener("mousedown", () => {
        if (!isGameRunning || isQuizActive) return;
        violet.velocity = violet.lift;
    });
});

// =========================================================================
// ⚙️ ENGINE CONTROLLERS
// =========================================================================
function initializeNewGame() {
    score = 0;
    lives = 3;
    violet.y = 200;
    violet.velocity = 0;
    obstacles = [];
    
    // Set to 1 so the game guarantees a full 6 seconds before the first pipe
    frameCount = 1; 
    backgroundX = 0;
    isGameRunning = true;
    isQuizActive = false;

    updateLiveHUD();
    
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("game-over-screen").classList.add("hidden");
    document.getElementById("victory-screen").classList.add("hidden");
    document.getElementById("quiz-modal").classList.add("hidden");

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    runGameCycle();
}

function updateLiveHUD() {
    // Aggressively target multiple possible HTML IDs to ensure the score visually updates
    const scoreContainer = document.getElementById("score-container");
    const scoreDisplay = document.getElementById("score");
    const heartsContainer = document.getElementById("hearts-container");

    if (scoreContainer) scoreContainer.innerText = `Score: ${score}`;
    if (scoreDisplay) scoreDisplay.innerText = `Score: ${score}`;
    
    if (heartsContainer) {
        heartsContainer.innerText = "❤️".repeat(Math.max(0, lives)) || "☠️";
    }
}

// =========================================================================
// 🔄 CORE LOOP LIFECYCLE
// =========================================================================
function runGameCycle() {
    if (!isGameRunning) return;

    if (!isQuizActive) {
        clearAndDrawBackground();
        updateGameObjects();
        drawGameObjects();
        checkCollisionBoundaries();
    }

    animationFrameId = requestAnimationFrame(runGameCycle);
}

function clearAndDrawBackground() {
    backgroundX -= BACKGROUND_SPEED;
    if (backgroundX <= -canvas.width) {
        backgroundX = 0;
    }
    ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);
}

function updateGameObjects() {
    frameCount++;

    violet.velocity += violet.gravity;
    violet.y += violet.velocity;

    // Spawn layout rules based on calibrated fly timing
    if (frameCount % OBSTACLE_SPAWN_RATE === 0) {
        const minHeight = 50;
        const maxHeight = 280;
        const obstacleHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        const gap = 150; 

        obstacles.push({
            x: canvas.width,
            y: 0,
            width: 65,
            height: obstacleHeight,
            passed: false,
            type: "top"
        });

        obstacles.push({
            x: canvas.width,
            y: obstacleHeight + gap,
            width: 65,
            height: canvas.height - (obstacleHeight + gap),
            passed: false,
            type: "bottom"
        });
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 3.5; 

        // Score logic: If the mountain passes Violet's X coordinate
        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < violet.x) {
            obstacles[i].passed = true;
            if (obstacles[i].type === "top") {
                score += 10;
                updateLiveHUD(); // Instantly update the DOM to reflect the new score

                if (score >= 100) {
                    triggerVictorySequence();
                }
            }
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function drawGameObjects() {
    ctx.drawImage(violetImage, violet.x, violet.y, violet.width, violet.height);

    ctx.fillStyle = "#2ecc71"; 
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
}

// =========================================================================
// ⚠️ COLLISION & ENGINE INTERCEPTS
// =========================================================================
function checkCollisionBoundaries() {
    if (violet.y + violet.height > canvas.height || violet.y < 0) {
        triggerTurbulenceIntercept();
    }

    for (let obs of obstacles) {
        if (
            violet.x < obs.x + obs.width &&
            violet.x + violet.width > obs.x &&
            violet.y < obs.y + obs.height &&
            violet.y + violet.height > obs.y
        ) {
            triggerTurbulenceIntercept();
            break;
        }
    }
}

function triggerTurbulenceIntercept() {
    isQuizActive = true;
    violet.y = 200; 
    violet.velocity = 0;
    obstacles = []; 

    console.log("[Engine]: Intercepting loop execution. Firing recovery quiz...");
    if (typeof window.useLoadedQuestion === "function") {
        window.useLoadedQuestion();
    } else {
        resumeGameAfterSave();
    }
}

function resumeGameAfterSave() {
    isQuizActive = false;
    
    // CRITICAL FIX: Set frameCount to 1, NOT 0. 
    // This forces the game to count all 360 frames (6 seconds) before spawning the next pipe!
    frameCount = 1; 
    console.log("[Engine]: Quiz cleared. Resuming primary physics flight timeline updates.");
}

function deductHeart() {
    lives--;
    updateLiveHUD();

    if (lives <= 0) {
        triggerGameOverSequence();
    } else {
        resumeGameAfterSave();
    }
}

function triggerGameOverSequence() {
    isGameRunning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    document.getElementById("final-score").innerText = `Your Score: ${score}`;
    document.getElementById("game-over-screen").classList.remove("hidden");
}

function triggerVictorySequence() {
    isGameRunning = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    document.getElementById("victory-screen").classList.remove("hidden");
}

// Global window assignments for tracking context bindings cleanly cross-module
window.resumeGameAfterSave = resumeGameAfterSave;
window.deductHeart = deductHeart;