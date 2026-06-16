const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const violetSprite = new Image();
violetSprite.src = "assets/violet.png"; 

// --- FIXED PHYSICS VARIABLES ---
// Gravity is much lower (0.04 instead of 0.10) so she dips much slower
let violet = { x: 100, y: 220, width: 60, height: 60, gravity: 0.04, velocity: 0 };
let score = 0, lives = 3;
let isGameStarted = false;
let isGameActive = false;
let isPausedForQuiz = false;
let hasWon = false;

let bgX = 0, bgSpeed = 2, jitterTimer = 0;

window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && isGameActive && !isPausedForQuiz && isGameStarted) {
        // Gentler upward tap so she doesn't rocket out of control
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
    
    // --- FIXED SHAKING ---
    // Slower timer increment = slower frequency. 
    jitterTimer += 0.2; 
    
    bgX -= bgSpeed;
    if (bgX <= -canvas.width) bgX = 0;
    
    if (violet.y + violet.height >= canvas.height - 10 || violet.y <= 10) {
        triggerDippedQuizEvent();
    }
    
    score += 1;
    let finalScore = Math.floor(score / 10);
    document.getElementById("score-container").innerText = `Score: ${finalScore}`;

    // --- VICTORY TRIGGER ---
    if (finalScore >= 100 && !hasWon) { // Wins at 100 points
        triggerVictoryEvent();
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#2c3e50"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#34495e";
    ctx.fillRect(bgX, 470, canvas.width, 30);
    ctx.fillRect(bgX + canvas.width, 470, canvas.width, 30);

    // Reduced multiplier from 5 to 1.5 so the shake is extremely subtle
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
    // --- FIXED ANIMATION ---
    // Instead of resetting her to the middle, we freeze her at the edge she hit!
    if (violet.y > 250) {
        violet.y = canvas.height - violet.height - 10;
    } else {
        violet.y = 11;
    }
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
    // --- FIXED ANIMATION: THE BLAST OFF ---
    // When she answers correctly, we give her a powerful upward velocity boost 
    // so the student literally sees her blast back up into the safe zone!
    if (violet.y > 250) {
        violet.velocity = -4.5; // Blast upwards
    } else {
        violet.velocity = 1.0; // Gentle push down if she hit the ceiling
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