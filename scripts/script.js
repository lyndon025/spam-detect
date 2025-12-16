/* =========================================
   CONFIGURATION
   ========================================= */
const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCAL 
    ? "http://localhost:5000" 
    : "https://spam-detect-backend.onrender.com"; 

console.log(`🔌 Connected to: ${API_BASE_URL}`);

/* =========================================
   1. GLOBAL THEME LOGIC (Runs on EVERY page)
   ========================================= */
function initApp() {
    // Uses querySelector to match class="theme-btn"
    const themeBtn = document.querySelector('.theme-btn');
    const root = document.documentElement;

    // Safety Check: If there is no button (e.g. hidden navbar), skip logic
    if (themeBtn) {
        // A. Determine startup theme
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        let currentTheme = savedTheme || (systemDark ? 'dark' : 'light');

        // B. Apply immediately
        applyTheme(currentTheme);

        // C. Click Listener
        themeBtn.addEventListener('click', () => {
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });

        // --- Helper Function ---
        function applyTheme(theme) {
            currentTheme = theme;
            root.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            // Update Icon
            themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    // Setup Analyze Button Listener (Home Page Only)
    setupAnalyzeListener();
}

// Robust Initialization: Checks if DOM is already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}


/* =========================================
   2. HOME PAGE LOGIC (Only runs if elements exist)
   ========================================= */

function setupAnalyzeListener() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeMessage);
    }
    
    const askAiBtn = document.getElementById('askAiBtn');
    if (askAiBtn) {
        askAiBtn.addEventListener('click', askGemini);
    }
}

// TABS
function switchTab(mode) {
    const textSection = document.getElementById("textSection");
    const photoSection = document.getElementById("photoSection");
    const tabs = document.querySelectorAll(".tab-btn");

    if (!textSection || !photoSection) return; // Safety check

    if (mode === 'text') {
        textSection.classList.remove("hidden");
        photoSection.classList.add("hidden");
        if(tabs[0]) tabs[0].classList.add("active");
        if(tabs[1]) tabs[1].classList.remove("active");
    } else {
        textSection.classList.add("hidden");
        photoSection.classList.remove("hidden");
        if(tabs[0]) tabs[0].classList.remove("active");
        if(tabs[1]) tabs[1].classList.add("active");
    }
}

// OCR (Image to Text)
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusText = document.getElementById("ocrStatus");
    const textArea = document.getElementById("smsInput");

    if (!statusText || !textArea) return; // Safety check for About page
    
    statusText.classList.remove("hidden");
    statusText.innerText = "⏳ Extracting text...";

    // Check if Tesseract is loaded
    if (typeof Tesseract === 'undefined') {
        statusText.innerText = "❌ Tesseract library not loaded.";
        return;
    }

    Tesseract.recognize(file, 'eng')
    .then(({ data: { text } }) => {
        statusText.innerText = "✅ Done!";
        textArea.value = text;
        setTimeout(() => {
            switchTab('text');
            statusText.classList.add("hidden");
        }, 1000);
    }).catch(err => {
        console.error(err);
        statusText.innerText = "❌ Failed to read image.";
    });
}

// MAIN ANALYZE FUNCTION
async function analyzeMessage() {
    const inputField = document.getElementById("smsInput");
    
    // Safety Check: If input doesn't exist, stop (prevents crash on About page)
    if (!inputField) return;

    const input = inputField.value;
    const loading = document.getElementById("loading");
    const loadingText = document.querySelector("#loading p");
    
    // UI Elements
    const resultCard = document.getElementById("resultCard");
    const linkCard = document.getElementById("linkWarningCard");
    const aiSection = document.getElementById("aiSection");
    const limeSection = document.getElementById("limeSection");
    
    // Reset
    if(resultCard) resultCard.className = "result-card hidden"; 
    if(linkCard) linkCard.classList.add("hidden"); 
    if(aiSection) aiSection.classList.add("hidden");
    if(limeSection) limeSection.classList.add("hidden");

    if (!input.trim()) { alert("Enter text first!"); return; }

    if(loading) loading.classList.remove("hidden");
    if(loadingText) loadingText.innerText = "Analyzing...";

    // Timeout for free Render server waking up
    const slowServerTimer = setTimeout(() => {
        if(loadingText) {
            loadingText.innerHTML = "⏳ Waking up free server...<br><span style='font-size:0.8em'>(This may take up to 50 seconds)</span>";
        }
    }, 3000);

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: input })
        });
        
        clearTimeout(slowServerTimer);
        const data = await response.json();
        
        if(loading) loading.classList.add("hidden");

        if(!resultCard) return;

        // 1. SHOW AI JUDGMENT
        resultCard.classList.remove("hidden");
        resultCard.classList.add("visible");
        
        const title = document.getElementById("resultTitle");
        const details = document.getElementById("details");
        const icon = document.getElementById("icon");
        const conf = document.getElementById("confidenceScore");

        if (data.category === "danger") {
            resultCard.classList.add("danger");
            icon.innerText = "🛡️";
            title.innerText = "High Risk: Potential Scam";
            details.innerText = "Model detected scam patterns.";
        } else if (data.category === "caution") {
            resultCard.classList.add("caution");
            icon.innerText = "📢";
            title.innerText = "Promotional Message";
            details.innerText = "Likely marketing or ads.";
        } else {
            resultCard.classList.add("safe");
            icon.innerText = "✅";
            title.innerText = "Likely Safe";
            details.innerText = "Standard notification patterns.";
        }
        conf.innerText = `Confidence: ${data.confidence}%`;

        // 2. LINK DETECTION OVERRIDE
        if (data.has_link === true) {
            console.log("🔗 Link detected by Backend!");

            if (resultCard.classList.contains("safe")) {
                resultCard.classList.remove("safe");
                resultCard.classList.add("caution");
                icon.innerText = "⚠️"; 
                title.innerText = "Caution: Link Detected";
                details.innerHTML = `
                    <span style="text-decoration: line-through; opacity: 0.7;">This looks like a standard notification.</span>
                    <br><br>
                    <strong>HOWEVER:</strong> A link was detected. Even safe-looking messages can be dangerous if they contain links. Verify the sender.
                `;
            } else {
                details.innerHTML += "<br><br><strong>⚠️ Note:</strong> Contains a clickable link. Be careful.";
            }

            if(linkCard) {
                linkCard.classList.remove("hidden");
                linkCard.classList.add("visible");
            }
        }

        // 3. SHOW SECOND OPINION BUTTON
        if(aiSection) {
            aiSection.classList.remove("hidden");
            document.getElementById("aiResult").classList.add("hidden");
            const askBtn = document.getElementById("askAiBtn");
            if(askBtn) {
                askBtn.disabled = false;
                askBtn.innerText = "🤖 Ask Google Gemini for Analysis";
            }
        }

        // 4. RENDER LIME CHART
        if (data.lime_data && data.lime_data.length > 0 && limeSection) {
            limeSection.classList.remove("hidden");
            // PASS CATEGORY TO FIX COLOR LOGIC
            renderLimeChart(data.lime_data, data.category);
        }

    } catch (error) {
        clearTimeout(slowServerTimer);
        console.error(error);
        if(loading) loading.classList.add("hidden");
        alert("Server Error: The backend might be sleeping or crashed.");
    }
}

// GEN AI CALL
async function askGemini() {
    const inputField = document.getElementById("smsInput");
    if(!inputField) return;

    const input = inputField.value;
    const btn = document.getElementById("askAiBtn");
    const resultBox = document.getElementById("aiResult");
    const resultText = document.getElementById("aiText");
    
    if(btn) {
        btn.disabled = true;
        btn.innerText = "Consulting Gemini...";
    }
    if(resultBox) resultBox.classList.remove("hidden");
    if(resultText) resultText.innerHTML = "<em>Thinking...</em>"; 

    try {
        const response = await fetch(`${API_BASE_URL}/ask-gemini`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: input })
        });
        const data = await response.json();
        
        if(resultText) resultText.innerHTML = parseMarkdown(data.analysis); 
        
    } catch (error) {
        if(resultText) resultText.innerText = "Error contacting AI.";
    }
    
    if(btn) {
        btn.disabled = false;
        btn.innerText = "🤖 Ask Google Gemini for Analysis";
    }
}

// LIME VISUALIZATION
// Added category parameter to determine if Positive Weight = Safe or Spam
function renderLimeChart(features, category) {
    const container = document.getElementById("limeChart");
    if(!container) return; 

    container.innerHTML = ""; 

    // Find the max weight to normalize bars
    const maxWeight = Math.max(...features.map(f => Math.abs(f[1])));

    features.forEach(([word, weight]) => {
        const row = document.createElement("div");
        row.className = "lime-row";
        
        const label = document.createElement("span");
        label.className = "lime-label";
        label.innerText = word;

        const barContainer = document.createElement("div");
        barContainer.className = "lime-bar-container";

        const bar = document.createElement("div");

        // --- NEW LOGIC START ---
        // If category is 'safe', then positive weights (supporting 'safe') should be GREEN.
        // If category is 'danger', then positive weights (supporting 'danger') should be RED.
        
        let isDanger = false;
        
        if (category === 'safe') {
            // Explaining "Safe"
            // weight > 0 (supports Safe) -> Green (isDanger=false)
            // weight < 0 (opposes Safe) -> Red   (isDanger=true)
            if (weight < 0) isDanger = true;
        } else {
            // Explaining "Danger" / "Spam"
            // weight > 0 (supports Danger) -> Red (isDanger=true)
            // weight < 0 (opposes Danger) -> Green (isDanger=false)
            if (weight > 0) isDanger = true;
        }
        
        bar.className = isDanger ? "lime-bar danger-bar" : "lime-bar safe-bar";
        // --- NEW LOGIC END ---
        
        let widthPercentage = (Math.abs(weight) / maxWeight) * 100;
        if (widthPercentage < 5) widthPercentage = 5; 
        
        bar.style.width = `${widthPercentage}%`;
        bar.title = `Weight: ${weight.toFixed(4)}`;

        barContainer.appendChild(bar);
        
        // Value Number
        const valueSpan = document.createElement("span");
        valueSpan.innerText = weight.toFixed(4);
        valueSpan.style.marginLeft = "10px";
        valueSpan.style.fontSize = "0.85em"; 
        valueSpan.style.minWidth = "50px";
        valueSpan.style.textAlign = "right";

        row.appendChild(label);
        row.appendChild(barContainer);
        row.appendChild(valueSpan); 
        container.appendChild(row);
    });
}

function parseMarkdown(text) {
    if (!text) return "";
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/(\d+\.)\s/g, '<br><strong>$1</strong> ');
    if (html.startsWith('<br>')) html = html.substring(4);
    return html;
}
