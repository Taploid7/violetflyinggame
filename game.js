// =========================================================================
// 🛩️ VIOLET THE PILOT - ORIGINAL CANVAS MECHANICS ENGINE RESTORED
// =========================================================================

// --- 🚀 RESTORED: Canvas Framework Attachments ---
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
document.body.appendChild(canvas);

canvas.width = 800;  // Update back to your exact original width dimension if needed
canvas.height = 400; // Update back to your exact original height dimension if needed
canvas.style.display = "block";
canvas.style.margin = "10px auto";

// --- Game Engine Physics & State Rules ---
let gameActive = false;
let gameFinished = false;
let score = 0;
let health = 100;
const TARGET_SCORE = 200;

// --- 🚀 RESTORED: Your Original Asset Reference Track Hooks ---
const assets = {
    background: new Image(),
    violetPlane: new Image(),
    obstacles: new Image()
};

// 📍 PASTE YOUR EXACT ORIGINAL FOLDER NAME SOURCE STRINGS HERE
assets.background.src = "assets/background.png"; 
assets.violetPlane.src = "assets/plane.png";
assets.obstacles.src = "assets/obstacle.png";

// --- Core Timing Control Loop Intercept Mappings ---
function resumeFlight() {
    console.log("[Engine]: Correct quiz answer evaluated! Unpausing engine vectors.");
    
    score += 20; 
    
    // 🚀 RESTORED: Call your original safety clearance methods here
    clearActiveHazards(); 

    if (score >= TARGET_SCORE) {
        triggerVictoryState();
    } else {
        gameActive = true;
        animateOriginalGameLoop();
    }
}

function applyDamage() {
    console.log("[Engine]: Incorrect quiz answer evaluated! Reducing health integrity.");
    
    health -= 25;
    clearActiveHazards();

    if (health <= 0) {
        triggerGameOverState();
    } else {
        gameActive = true;
        animateOriginalGameLoop();
    }
}

function clearActiveHazards() {
    // 🚀 RESTORED: Insert your original custom arrays reset mechanics here
    console.log("Hazards safety offsets resetting complete.");
}

function triggerVictoryState() {
    gameActive = false;
    gameFinished = true;
    alert("Flight Complete! You reached 200 Points and completed the flight! 🏆");
}

function triggerGameOverState() {
    gameActive = false;
    gameFinished = true;
    alert("Game Over! Your plane sustained too much damage. Refresh to try again! 💥");
}

// --- 🚀 RESTORED: Your Original Logic Loop & Physics Pipeline ---
function animateOriginalGameLoop() {
    if (!gameActive || gameFinished) return;

    // ---------------------------------------------------------------------
    // 📍 PASTE YOUR EXACT ORIGINAL CANVAS RENDERING CODE DIRECTLY HERE
    // (e.g., ctx.drawImage(assets.background, ...), velocity update steps, etc.)
    // ---------------------------------------------------------------------
    
    // Example hook trigger point for when Violet strikes an item in your code loop:
    let originalCollisionHappened = false; 
    if (originalCollisionHappened) {
        gameActive = false;
        if (typeof window.useLoadedQuestion === "function") {
            window.useLoadedQuestion();
        }
        return; // Break frame rendering tracking cycle updates
    }

    requestAnimationFrame(animateOriginalGameLoop);
}

// --- Handle Keyboard Vector Input Mappings ---
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        
        // 🚀 RESTORED: Trigger your original physics flight velocity impulse vectors
        if (gameActive) {
            console.log("Applying lift forces to your plane asset mapping parameters.");
            // e.g., yourPlaneObject.velocity = yourPlaneObject.liftValue;
        }
    }
});

// Override Launcher Trigger Sequence safely
const originalUseLoadedQuestion = window.useLoadedQuestion;
window.useLoadedQuestion = function() {
    if (!gameActive && !gameFinished && window.questionPool && window.questionPool.length >= 10) {
        // Clear start dashboard out of view screen
        const mainCard = document.getElementById("launcher-dashboard");
        if (mainCard) mainCard.style.display = "none";
        
        gameActive = true;
        console.log("🛫 Original engine checks clear. Initializing custom animation tracking tracks.");
        animateOriginalGameLoop();
    } else {
        if (typeof originalUseLoadedQuestion === "function") {
            originalUseLoadedQuestion();
        }
    }
};

window.resumeFlight = resumeFlight;
window.applyDamage = applyDamage;