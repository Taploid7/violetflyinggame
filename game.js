// --- 1. BUILD ON-SCREEN DEBUG TERMINAL ---
const debugPanel = document.createElement("div");
debugPanel.style.cssText = "position:absolute; top:10px; left:10px; background:rgba(0,0,0,0.85); color:#0f0; font-family:monospace; font-size:11px; padding:10px; border-radius:8px; z-index:9999; pointer-events:none; width:280px; max-height:120px; overflow:hidden; border:1px solid #0a0;";
document.body.appendChild(debugPanel);

window.logDebug = function(msg) {
    console.log(msg);
    debugPanel.innerHTML += `> ${msg}<br>`;
    const lines = debugPanel.innerHTML.split("<br>");
    if (lines.length > 6) debugPanel.innerHTML = lines.slice(lines.length - 6).join("<br>");
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const violetSprite = new Image();
violetSprite.src = "assets/violet.png"; 

// --- 2. CORS SECURITY COMPLIANT DYNAMIC BACKGROUND INITIALIZATION ---
const bgImage = new Image();
bgImage.crossOrigin = "Anonymous"; // Allows secure image array scanning
bgImage.src = "assets/background.png";

let violet = { x: 100, y: 180, width: 60, height: 60, gravity: 0.04, velocity: 0 };
let score = 0, lives = 3;
let isGameStarted = false;
let isGameActive = false;
let isPausedForQuiz = false;
let hasWon = false;

let bgX = 0, bgSpeed = 1.5, jitterTimer = 0;
let dynamicThemeColor = "#70c5ce"; 

bgImage.onload = function() {
    window.logDebug("🖼️ Background loaded. Calculating ambient accent color...");
    dynamicThemeColor = getAverageRGB(bgImage);
    window.logDebug(`🎨 Canvas fall-back color synchronized: ${dynamicThemeColor}`);
};

// --- 3. EXPLICIT PRELOAD GATE & SECURITY ASSIGNMENT ---
document.addEventListener("DOMContentLoaded", async () => {
    window.logDebug("🚀 Loading game modules...");
    
    const startBtn = document.getElementById("start-btn");
    const startScreen = document.getElementById("start-screen");
    
    // Dynamically inject 200 Score Target layout directly into menu rules text
    if (startScreen) {
        let textContainer = startScreen.querySelector("p");
        if (textContainer) {
            textContainer.innerHTML = "Help Violet navigate Taiwan! Press Spacebar to fly up.<br><b>Target Goal: Reach a score of 200 to win!</b>";
        }
    }
    
    if (startBtn) {
        startBtn.innerText = "Loading AI Questions... ⏳";
        startBtn.disabled = true;
        startBtn.style.opacity = "0.6";
        startBtn.style.cursor = "not-allowed";
        
        // Setup direct secure click binding
        startBtn.addEventListener("click", startGameNow);
    }

    // Force engine to completely load first questions before continuing
    const prefetchSuccess = await prefetchNextQuestion();

    if (startBtn && prefetchSuccess) {
        startBtn.innerText = "Start Flight 🛫";
        startBtn.disabled = false;
        startBtn.style.opacity = "1";
        startBtn.style.cursor = "pointer";
        window.logDebug("✅ AI Connection secure. System ready.");
    }
});

window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && isGameActive && !isPausedForQuiz && isGameStarted) {
        violet.velocity = -2.0;
    }
});

function getAverageRGB(imgEl) {
    const blockSize = 5;
    const defaultColor = "#70c5ce";
    let canvasTmp = document.createElement('canvas');
    let ctxTmp = canvasTmp.getContext && canvasTmp.getContext('2d');
    let data, width, height, i = -4, length, count = 0;
    let rgb = { r: 0, g: 0, b: 0 };

    if (!ctxTmp) return defaultColor;
    height = canvasTmp.height = imgEl.naturalHeight || imgEl.height;
    width = canvasTmp.width = imgEl.naturalWidth || imgEl.width;
    ctxTmp.drawImage(imgEl, 0, 0);

    try {
        data = ctxTmp.getImageData(0, 0, width, height);
    } catch(e) {
        window.logDebug("❌ Canvas color check blocked by local CORS wrapper.");
        return defaultColor;
    }

    length = data.data.length;
    while ((i += blockSize * 4) < length) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i+1];
        rgb.b += data.data[i+2];
    }
    rgb.r = Math.floor(rgb.r / count);
    rgb.g = Math.floor(rgb.g / count);
    rgb.b = Math.floor(rgb.b / count);

    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function startGameNow() {
    window.logDebug("🛫 Engine active. Flight started!");
    isGameStarted = true; 
    isGameActive = true; 
    isPausedForQuiz = false; 
    hasWon = false;
    lives = 3; 
    score = 0; 
    violet.y = 180;
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
        if (bgX <= -scaledWidth) bgX = 0;
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

    // --- 4. WIN TARGET AT 200 POINTS SCORE ---
    if (finalScore >= 200 && !hasWon) {
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
        ctx.fillStyle = dynamicThemeColor; 
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
    window.logDebug("💥 Boundary hit! Pausing flight engine...");
    isPausedForQuiz = true;
    if (violet.y > 250) {
        violet.y = canvas.height - violet.height - 35;
    } else {
        violet.y = 15;
    }
    violet.velocity = 0;
    
    document.getElementById("quiz-modal").classList.remove("hidden");
    useLoadedQuestion(); 
}

function deductHeart() {
    lives--;
    updateHeartsDisplay();
    if (lives <= 0) {
        endGame();
    } else {
        useLoadedQuestion();
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
    window.logDebug("💀 Health empty. Game Over.");
    isGameActive = false;
    document.getElementById("quiz-modal").classList.add("hidden");
    document.getElementById("game-over-screen").classList.remove("hidden");
    document.getElementById("final-score").innerText = `You explored Taiwan! Score: ${Math.floor(score / 10)}`;
}

function triggerVictoryEvent() {
    window.logDebug("🏆 Target reached! Victory recorded.");
    isGameActive = false;
    hasWon = true;
    document.getElementById("ui-layer").classList.add("hidden");
    document.getElementById("victory-screen").classList.remove("hidden");
}

function resetGame() { 
    startGameNow(); 
}

gameLoop();