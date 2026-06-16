// =========================================================================
// 🛩️ VIOLET THE PILOT - CORE GAME ENGINE (BATCH PRELOAD STABLE)
// =========================================================================

// --- HTML Canvas Setup ---
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

// Responsively size the interactive game window layout
canvas.width = 800;
canvas.height = 400;
canvas.style.display = "block";
canvas.style.margin = "10px auto";
canvas.style.background = "linear-gradient(#70c5ce, #90d5de)";
canvas.style.border = "4px solid #34495e";
canvas.style.borderRadius = "8px";

// --- Game Engine Variables ---
let gameActive = false;
let gameFinished = false;
let score = 0;
let health = 100;
const TARGET_SCORE = 200;

// --- Violet Aircraft Physics Variables ---
const violet = {
    x: 100,
    y: 150,
    width: 40,
    height: 30,
    gravity: 0.4,
    velocity: 0,
    lift: -7,
    draw: function() {
        ctx.fillStyle = "#e74c3c"; // Crimson aircraft body base color
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Window
        ctx.fillStyle = "#e0f7fa";
        ctx.fillRect(this.x + 25, this.y + 5, 10, 10);
        
        // Tail wing
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(this.x, this.y - 10, 10, 15);
    }
};

// --- Obstacles Array Management ---
let obstacles = [];
let spawnTimer = 0;
const obstacleSpeed = 3.5;

function spawnObstacle() {
    const gapHeight = 120;
    const minHeight = 40;
    const maxHeight = canvas.height - gapHeight - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    const bottomHeight = canvas.height - topHeight - gapHeight;

    obstacles.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomHeight: bottomHeight,
        width: 50,
        passed: false
    });
}

function drawObstacles() {
    ctx.fillStyle = "#27ae60"; // Mountain terrain obstacle column tracking colors
    obstacles.forEach(obs => {
        // Top obstacle column block
        ctx.fillRect(obs.x, 0, obs.width, obs.topHeight);
        // Bottom obstacle column block
        ctx.fillRect(obs.x, canvas.height - obs.bottomHeight, obs.width, obs.bottomHeight);
    });
}

// --- Collision Engine Verification ---
function checkCollisions() {
    // Floor or Ceiling boundaries breach limits check
    if (violet.y < 0 || violet.y + violet.height > canvas.height) {
        triggerQuizChallenge();
    }

    // Geometry box coordinates overlap checking loop
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        if (violet.x + violet.width > obs.x && violet.x < obs.x + obs.width) {
            // Check top collision coordinates
            if (violet.y < obs.topHeight) {
                triggerQuizChallenge();
                break;
            }
            // Check bottom collision coordinates
            if (violet.y + violet.height > canvas.height - obs.bottomHeight) {
                triggerQuizChallenge();
                break;
            }
        }
    }
}

// --- Game State Flow Handlers ---
function triggerQuizChallenge() {
    if (!gameActive) return;
    gameActive = false; // Pause the interactive physics frame ticker loop
    
    console.log("[Engine Log]: Collision detected! Launching Gemini Quiz Intercept Layer.");
    if (typeof window.useLoadedQuestion === "function") {
        window.useLoadedQuestion();
    } else {
        console.warn("Quiz orchestrator missing fallback logic running instead.");
        resumeFlight();
    }
}

// --- 🚀 UPDATED SCORE & STATE HOOKS ---
function resumeFlight() {
    console.log("[Engine Log]: Correct response registered! Jet streams restoring altitude values.");
    
    // Add points up to winning target ceiling threshold
    score += 20; 
    
    // Reposition Violet safely away from current obstacles to avoid instant re-collision
    violet.y = 150;
    violet.velocity = 0;
    obstacles = []; 
    
    if (score >= TARGET_SCORE) {
        triggerVictoryState();
    } else {
        gameActive = true; // Unpause engine cycle loop
    }
}

function applyDamage() {
    console.log("[Engine Log]: Incorrect response validation. Deducting aircraft structural health values.");
    health -= 25; // Take away health, lower speed metrics, etc.
    
    violet.y = 150;
    violet.velocity = 0;
    obstacles = [];

    if (health <= 0) {
        triggerGameOverState();
    } else {
        gameActive = true;
    }
}

function triggerVictoryState() {
    gameActive = false;
    gameFinished = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log("[Engine Log]: Victory conditions reached! Mission complete.");
}

function triggerGameOverState() {
    gameActive = false;
    gameFinished = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log("[Engine Log]: Aircraft frame structural downing. Mission Terminated.");
}

// --- Universal Controls Registration ---
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        if (gameActive) {
            violet.velocity = violet.lift;
        } else if (!gameActive && !gameFinished && typeof questionPool !== "undefined" && questionPool.length >= 10) {
            // Shortcut allowance to jump directly into flight once batch cache loads completely
            const actionBtn = document.getElementById("action-button");
            if (actionBtn && !actionBtn.disabled) {
                actionBtn.click();
            }
        }
    }
});

// --- Main Engine Frame Animation Update Loop Ticker ---
function updateGameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameActive && !gameFinished) {
        // Apply gravitational acceleration downforce pulls
        violet.velocity += violet.gravity;
        violet.y += violet.velocity;
        violet.draw();

        // Spawn rhythm spacing counter check
        spawnTimer++;
        if (spawnTimer >= 100) {
            spawnObstacle();
            spawnTimer = 0;
        }

        // Advance layout coordinate array elements positions
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= obstacleSpeed;

            // Score evaluation tracker checks
            if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < violet.x) {
                obstacles[i].passed = true;
                // Minor score tracking points for clearing columns
                score += 2;
                if (score >= TARGET_SCORE) triggerVictoryState();
            }

            // Garbage collection array optimizations
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
            }
        }

        drawObstacles();
        checkCollisions();

        // On-Canvas UI Status Text Displays HUD Overlays
        ctx.fillStyle = "#2c3e50";
        ctx.font = "bold 16px Arial";
        ctx.fillText(`Flight Score: ${score} / ${TARGET_SCORE}`, 20, 30);
        ctx.fillText(`Hull Integrity: ${health}%`, 20, 55);

    } else if (gameFinished) {
        // End State Canvas Screen Render Cards Layer Blocks
        ctx.fillStyle = "rgba(44, 62, 80, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        
        if (score >= TARGET_SCORE) {
            ctx.font = "bold 36px Arial";
            ctx.fillText("FLIGHT MISSION COMPLETE! 🏆", canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = "18px Arial";
            ctx.fillText(`Violet successfully navigated across Taiwan with a final score of ${score}!`, canvas.width / 2, canvas.height / 2 + 20);
        } else {
            ctx.font = "bold 36px Arial";
            ctx.fillText("CRASH LANDING 💥", canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = "18px Arial";
            ctx.fillText("Aircraft sustained catastrophic structural damage. Refresh the browser to try again.", canvas.width / 2, canvas.height / 2 + 20);
        }
    } else {
        // Idle System state logic holding frame indicators
        violet.draw();
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(updateGameLoop);
}

// Modify global accessibility mappings so hooks interface correctly with external modules execution contexts
window.resumeFlight = resumeFlight;
window.applyDamage = applyDamage;

// Launch the rendering loop pipeline
updateGameLoop();

// Override the main button click handler to instantly kickstart the canvas when clicked
const originalUseLoadedQuestion = window.useLoadedQuestion;
window.useLoadedQuestion = function() {
    if (!gameActive && !gameFinished && typeof questionPool !== "undefined" && questionPool.length >= 10) {
        // If the game hasn't started yet, hide the menu card and activate flight mode!
        const mainCard = document.querySelector(".main-card");
        if (mainCard) mainCard.style.display = "none";
        gameActive = true;
        console.log("[Engine Log]: Flight pattern loops authorized. Takeoff initiated!");
    } else {
        // If the game is already running, run the normal quiz overlay handling setup instead
        if (typeof originalUseLoadedQuestion === "function") {
            originalUseLoadedQuestion();
        }
    }
};