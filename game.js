// =========================================================================
// 🛩️ VIOLET THE PILOT - CORE PHYSICS ENGINE & ASSET RENDERER
// =========================================================================

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

canvas.width = 800;  
canvas.height = 400; 
canvas.style.display = "block";
canvas.style.margin = "10px auto";

// --- Game Engine States ---
let gameActive = false;
let gameFinished = false;
let score = 0;
let health = 100;
const TARGET_SCORE = 200;

// --- 🚀 THE PHYSICS ENGINE (Dipping & Tuning Variables) ---
const violet = {
    x: 100,
    y: 150,
    width: 60,       // Matches standard sprite dimensions
    height: 45,
    gravity: 0.35,   // Pull down force per frame
    velocity: 0,
    lift: -6.5,      // Upward impulse force when space is pressed
    drag: 0.98,      // Air resistance terminal velocity modifier
    angle: 0,        // Rotational pitch for the dynamic "dipping" look
    jitterY: 0       // Engine vibration offset
};

// --- 🚀 THE ASSET LOADER ---
const assets = {
    background: new Image(),
    violetPlane: new Image(),
    obstacle: new Image()
};

// Pulling directly from your local assets folder structure
assets.background.src = "assets/background.png"; 
assets.violetPlane.src = "assets/plane.png";
assets.obstacle.src = "assets/obstacle.png";

// Scrolling background tracking x-coordinate
let bgX = 0;
const bgSpeed = 2;

// --- Obstacles/Hazards Tracker ---
let hazards = [];
let spawnTimer = 0;
const hazardSpeed = 4;

function spawnHazard() {
    const gap = 130;
    const minY = 30;
    const maxY = canvas.height - gap - minY;
    const topHeight = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

    hazards.push({
        x: canvas.width,
        top: topHeight,
        bottom: canvas.height - topHeight - gap,
        width: 60,
        passed: false
    });
}

// --- 🚀 INTERACTIVE FLIGHT LOOPS & PHYSICS UPDATES ---
function updatePhysics() {
    // 1. Apply gravity & air drag friction (Creates the "heavy" realistic drop)
    violet.velocity += violet.gravity;
    violet.velocity *= violet.drag; 
    violet.y += violet.velocity;

    // 2. 🤖 THE JITTERING EFFECT (Simulates engine rattle/vibration)
    if (gameActive) {
        violet.jitterY = (Math.random() - 0.5) * 2.5; // High-frequency vibration offset
    } else {
        violet.jitterY = Math.sin(Date.now() * 0.01) * 3; // Smooth gentle hover idle
    }

    // 3. 📉 THE DIPPING EFFECT (Rotates plane down when falling, up when climbing)
    // Maps velocity directly to angle rotation radians
    violet.angle = violet.velocity * 0.04; 
    if (violet.angle > 0.4) violet.angle = 0.4;   // Cap maximum downward nose dive
    if (violet.angle < -0.3) violet.angle = -0.3; // Cap maximum upward climb pitch

    // Boundary containment checks
    if (violet.y < 0) { violet.y = 0; violet.velocity = 0; }
    if (violet.y + violet.height > canvas.height) { triggerQuizChallenge(); }
}

// --- 🚀 THE RENDER GRAPHICS PIPELINE ---
function renderOriginalGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw continuous scrolling background layer
    if (gameActive) bgX -= bgSpeed;
    if (bgX <= -canvas.width) bgX = 0;
    
    ctx.drawImage(assets.background, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(assets.background, bgX + canvas.width, 0, canvas.width, canvas.height);

    // 2. Move & Draw Obstacles directly using your asset sprite
    if (gameActive) {
        spawnTimer++;
        if (spawnTimer >= 90) { spawnHazard(); spawnTimer = 0; }
    }

    for (let i = hazards.length - 1; i >= 0; i--) {
        if (gameActive) hazards[i].x -= hazardSpeed;

        // Draw top obstruction asset column strip
        ctx.drawImage(assets.obstacle, hazards[i].x, 0, hazards[i].width, hazards[i].top);
        // Draw bottom obstruction asset column strip
        ctx.drawImage(assets.obstacle, hazards[i].x, canvas.height - hazards[i].bottom, hazards[i].width, hazards[i].bottom);

        // Collision box intersections evaluations
        if (gameActive &&
            violet.x + 5 < hazards[i].x + hazards[i].width &&
            violet.x + violet.width - 5 > hazards[i].x &&
            (violet.y + 5 < hazards[i].top || violet.y + violet.height - 5 > canvas.height - hazards[i].bottom)) {
            triggerQuizChallenge();
        }

        // Pass point collection detection tracking
        if (!hazards[i].passed && hazards[i].x + hazards[i].width < violet.x) {
            hazards[i].passed = true;
            score += 4;
            if (score >= TARGET_SCORE) triggerVictoryState();
        }

        if (hazards[i].x + hazards[i].width < 0) hazards.splice(i, 1);
    }

    // 3. Draw Violet's Plane with Jitter position offset & Dynamic Rotation Dipping
    ctx.save();
    // Move coordinate anchor center point onto Violet to execute localized rotations
    ctx.translate(violet.x + violet.width / 2, violet.y + violet.height / 2 + violet.jitterY);
    ctx.rotate(violet.angle);
    
    // Draw the image centered over the matrix space location point
    ctx.drawImage(assets.violetPlane, -violet.width / 2, -violet.height / 2, violet.width, violet.height);
    ctx.restore();

    // HUD overlays text displays
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText(`Score: ${score} / ${TARGET_SCORE}`, 20, 35);
    ctx.fillText(`Plane Integrity: ${health}%`, 20, 60);
    ctx.shadowBlur = 0; // Clear shadow layer properties
}

// --- Frame Animation Pipeline Ticker ---
function runEngineLoop() {
    updatePhysics();
    renderOriginalGame();
    requestAnimationFrame(runEngineLoop);
}

// --- Game Logic Controls Intercept Mappings ---
function triggerQuizChallenge() {
    if (!gameActive) return;
    gameActive = false; 
    console.log("💥 Collision detected! Triggering Gemini API quiz lookup window.");
    if (typeof window.useLoadedQuestion === "function") window.useLoadedQuestion();
}

function resumeFlight() {
    score += 20;
    violet.y = 150;
    violet.velocity = 0;
    hazards = [];
    if (score >= TARGET_SCORE) { triggerVictoryState(); } else { gameActive = true; }
}

function applyDamage() {
    health -= 25;
    violet.y = 150;
    violet.velocity = 0;
    hazards = [];
    if (health <= 0) { triggerGameOverState(); } else { gameActive = true; }
}

function triggerVictoryState() { gameActive = false; gameFinished = true; alert("Mission accomplished! Violet made it! 🏆"); }
function triggerGameOverState() { gameActive = false; gameFinished = true; alert("Crash landing. Flight systems offline. 💥"); }

// --- Key Event Listeners ---
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        if (gameActive) violet.velocity = violet.lift; // Lift impulse calculations
    }
});

// Override standard preloader launcher entry hooks
const originalUseLoadedQuestion = window.useLoadedQuestion;
window.useLoadedQuestion = function() {
    if (!gameActive && !gameFinished && window.questionPool && window.questionPool.length >= 10) {
        const mainCard = document.getElementById("launcher-dashboard");
        if (mainCard) mainCard.style.display = "none";
        gameActive = true;
        console.log("🛫 Systems check verified. Takeoff authorized!");
    } else {
        if (typeof originalUseLoadedQuestion === "function") originalUseLoadedQuestion();
    }
};

window.resumeFlight = resumeFlight;
window.applyDamage = applyDamage;

// Turn engine core systems on
runEngineLoop();