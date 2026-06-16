const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const violetSprite = new Image();
violetSprite.src = "assets/violet.png"; 

// --- 1. SECURE IMAGE INITIALIZATION ---
const bgImage = new Image();
bgImage.crossOrigin = "Anonymous"; // <-- This tells the browser it is safe to read these pixels!
bgImage.src = "assets/background.png";

let bgX = 0, bgSpeed = 1.5;
let dynamicThemeColor = "#70c5ce"; // Our safe default backdrop color

// --- 2. AUTOMATIC COLOR TRIGGER ---
bgImage.onload = function() {
    if (window.logDebug) window.logDebug("🖼️ Background asset loaded. Analyzing image pixels...");
    dynamicThemeColor = getAverageRGB(bgImage);
    if (window.logDebug) window.logDebug(`🎨 Success! Majority color detected: ${dynamicThemeColor}`);
};

// --- 3. THE MATHEMATICAL AVERAGE ENGINE ---
function getAverageRGB(imgEl) {
    const blockSize = 5; // Samples every 5th pixel to ensure excellent performance and zero game lag
    const defaultColor = "#70c5ce";
    
    let canvasTmp = document.createElement('canvas');
    let ctxTmp = canvasTmp.getContext && canvasTmp.getContext('2d');
    let data, width, height, i = -4, length, count = 0;
    let rgb = { r: 0, g: 0, b: 0 };

    if (!ctxTmp) return defaultColor;
    
    // Scale the temporary analyzer dimensions to match the image assets
    height = canvasTmp.height = imgEl.naturalHeight || imgEl.height;
    width = canvasTmp.width = imgEl.naturalWidth || imgEl.width;
    ctxTmp.drawImage(imgEl, 0, 0);

    try {
        // Grab the raw numerical RGBA grid array of the image file
        data = ctxTmp.getImageData(0, 0, width, height);
    } catch(e) {
        if (window.logDebug) window.logDebug("❌ Color dynamic block blocked by browser CORS policy. Using default.");
        return defaultColor;
    }

    length = data.data.length;
    
    // Loop through the red, green, and blue values to tally them up
    while ((i += blockSize * 4) < length) {
        ++count;
        rgb.r += data.data[i];     // Red
        rgb.g += data.data[i+1];   // Green
        rgb.b += data.data[i+2];   // Blue
    }

    // Average Math: Sum of Color Channels / Total Sampled Pixels
    rgb.r = Math.floor(rgb.r / count);
    rgb.g = Math.floor(rgb.g / count);
    rgb.b = Math.floor(rgb.b / count);

    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}