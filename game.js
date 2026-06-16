const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const violetSprite = new Image();
violetSprite.src = "assets/violet.png"; 

let violet = { x: 100, y: 220, width: 60, height: 60, gravity: 0.10, velocity: 0 };
let score = 0, lives = 3, isGameStarted = false, isGameActive = false, isPausedForQuiz = false;
let bgX = 0, bgSpeed = 2, jitterTimer = 0;

window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && isGameActive && !isPausedForQuiz && isGameStarted) violet.velocity = -3.2;
});

function startGameNow() {
    isGameStarted = true; isGameActive = true; isPausedForQuiz = false; lives = 3; score = 0; violet.y = 220;
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("ui-layer").classList.remove("hidden");
    updateHeartsDisplay();
}

function update() {
    if (!isGameStarted || !isGameActive || isPausedForQuiz) return;
    violet.velocity += violet.gravity;
    violet.y += violet.velocity;
    jitterTimer += 0.8;
    bgX = (bgX - bgSpeed) % canvas.width;
    if (violet.y + violet.height >= canvas.height - 10 || violet.y <= 10) triggerDippedQuizEvent();
    score += 1;
    document.getElementById("score-container").innerText = `Score: ${Math.floor(score / 10)}`;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#2c3e50"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    let offset = (isGameActive && !isPausedForQuiz && isGameStarted) ? Math.sin(jitterTimer) * 5 : 0;
    if (violetSprite.complete) ctx.drawImage(violetSprite, violet.x, violet.y + offset, 60, 60);
    requestAnimationFrame(() => { update(); render(); });
}

function triggerDippedQuizEvent() {
    isPausedForQuiz = true;
    document.getElementById("quiz-modal").classList.remove("hidden");
    fetchAIQuestion(); 
}

function endGame() {
    isGameActive = false;
    document.getElementById("quiz-modal").classList.add("hidden");
    document.getElementById("game-over-screen").classList.remove("hidden");
    document.getElementById("final-score").innerText = `Score: ${Math.floor(score / 10)}`;
}

function resetGame() { startGameNow(); }
function updateHeartsDisplay() { document.getElementById("hearts-container").innerText = "❤️".repeat(lives); }
gameLoop();