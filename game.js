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
violetImage.src = 'assets/violet.png'; // Your custom Violet asset path

const backgroundImage = new Image();
backgroundImage.src = 'assets/background.png'; // Your custom parallax scrolling background asset path

// --- Parallax Background Tracker ---
let backgroundX = 0;
const BACKGROUND_SPEED = 2; // Exact speed of your moving background track

// --- Pilot Physics Entities ---
let violet = {
    x: 100,
    y: 200,
    width: 65,   // Dimension adjustment matching your standard sprite proportions
    height: 50,  // Dimension adjustment matching your standard sprite proportions
    gravity: 0.35,
    lift: -6.5,
    velocity: 0
};

// --- Obstacles Array Trackers ---
let obstacles = [];
const OBSTACLE_SPAWN_RATE = 110; // Frames between obstacles
let frameCount = 0;

// =========================================================================
// 🚀 INJECT INTERACTIVE CLICK EVENT HANDLERS (Fixes Unclickable Button)
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
    // Reset core states
    score = 0;
    lives = 3;
    violet.y = 200;
    violet.velocity = 0;
    obstacles = [];
    frameCount = 0;
    backgroundX = 0;
    isGameRunning = true;
    isQuizActive = false;

    // Direct interface viewport updates
    updateLiveHUD();
    
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("game-over-screen").classList.add("hidden");
    document.getElementById("victory-screen").classList.add("hidden");
    document.getElementById("quiz-modal").classList.add("hidden");

    // Clear old loops and kickstart physics loop iteration
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    runGameCycle();
}

function updateLiveHUD() {
    const scoreContainer = document.getElementById("score-container");
    const heartsContainer = document.getElementById("hearts-container");

    if (scoreContainer) scoreContainer.innerText = `Score: ${score}`;
    if (heartsContainer) {
        // Render exactly matching hearts strings matching live life count integers
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
    // 🌅 PARALLAX MOVING CANVAS FORMULA: Draws two images seamlessly looping back-to-back
    backgroundX -= BACKGROUND_SPEED;
    if (backgroundX <= -canvas.width) {
        backgroundX = 0;
    }

    // Draw primary background layer frame
    ctx.drawImage(backgroundImage, backgroundX, 0, canvas.width, canvas.height);
    // Draw trailing background layer frame to prevent white spaces
    ctx.drawImage(backgroundImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);
}

function updateGameObjects() {
    frameCount++;

    // Apply physics gravity vectors on the plane entity
    violet.velocity += violet.gravity;
    violet.y += violet.velocity;

    // Generate random obstacles
    if (frameCount % OBSTACLE_SPAWN_RATE === 0) {
        const minHeight = 50;
        const maxHeight = 280;
        const obstacleHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        const gap = 150; // Passing clearing allowance space for smooth flying

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

    // Move obstacles westward across player coordinates
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 3.5; // Custom flight speed mapping matching your original assets

        // Score tracker rules calculations
        if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < violet.x) {
            obstacles[i].passed = true;
            if (obstacles[i].type === "top") {
                score += 10;
                updateLiveHUD();

                // Trigger victory cards once achieving high milestone scores
                if (score >= 100) {
                    triggerVictorySequence();
                }
            }
        }

        // Clean out memory parameters for frames that exited view boundaries
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function drawGameObjects() {
    // 🛩️ Draw Violet the Pilot PNG Asset Sprite
    ctx.drawImage(violetImage, violet.x, violet.y, violet.width, violet.height);

    // ⛰️ Draw Obstacles
    ctx.fillStyle = "#2ecc71"; // Emerald green mountain terrain vectors
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });
}

function checkCollisionBoundaries() {
    // Ceiling or Floor boundary collision rules
    if (violet.y + violet.height > canvas.height || violet.y < 0) {
        triggerTurbulenceIntercept();
    }

    // Obstacle intersection math metrics
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

// =========================================================================
// ⚠️ INTERCEPTORS & STATE HANDLING
// =========================================================================
function triggerTurbulenceIntercept() {
    isQuizActive = true;
    violet.y = 200; // Snap violet cleanly back to the center line safely
    violet.velocity = 0;
    obstacles = []; // Flush active obstacles on loop reset boundaries

    console.log("[Engine]: Intercepting loop execution. Firing recovery quiz...");
    
    // Call globally declared fallback function located in chat.js
    if (typeof window.useLoadedQuestion === "function") {
        window.useLoadedQuestion();
    } else {
        console.error("Critical: useLoadedQuestion function link absent inside chat.js module profile context.");
        resumeGameAfterSave();
    }
}

function resumeGameAfterSave() {
    isQuizActive = false;
    console.log("[Engine]: Quiz cleared. Resuming primary physics flight timeline updates.");
}

function deductHeart() {
    lives--;
    updateLiveHUD();

    if (lives <= 0) {
        triggerGameOverSequence();
    } else {
        // If they still have lives remaining, resume flight timeline configurations
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