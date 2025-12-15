const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const API_BASE_URL = IS_LOCAL 
    ? "http://localhost:5000" 
    : "https://spam-detect-backend.onrender.com"; // <--- PASTE YOUR RENDER URL HERE

console.log(`🔌 Connected to: ${API_BASE_URL}`);

// THEME & TABS
function toggleTheme() {
    const body = document.body;
    const newTheme = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", newTheme);
    document.getElementById("themeToggle").innerText = newTheme === "dark" ? "☀️" : "🌙";
}

function switchTab(mode) {
    const textSection = document.getElementById("textSection");
    const photoSection = document.getElementById("photoSection");
    const tabs = document.querySelectorAll(".tab-btn");

    if (mode === 'text') {
        textSection.classList.remove("hidden");
        photoSection.classList.add("hidden");
        tabs[0].classList.add("active");
        tabs[1].classList.remove("active");
    } else {
        textSection.classList.add("hidden");
        photoSection.classList.remove("hidden");
        tabs[0].classList.remove("active");
        tabs[1].classList.add("active");
    }
}

// OCR
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusText = document.getElementById("ocrStatus");
    const textArea = document.getElementById("smsInput");
    
    statusText.classList.remove("hidden");
    statusText.innerText = "⏳ Extracting text...";

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

// MAIN ANALYZE
async function analyzeMessage() {
    const input = document.getElementById("smsInput").value;
    const loading = document.getElementById("loading");
    
    // UI Elements
    const resultCard = document.getElementById("resultCard");
    const linkCard = document.getElementById("linkWarningCard");
    const aiSection = document.getElementById("aiSection");
    const limeSection = document.getElementById("limeSection");
    
    // Reset
    resultCard.className = "result-card hidden"; 
    linkCard.classList.add("hidden"); 
    aiSection.classList.add("hidden");
    limeSection.classList.add("hidden");

    if (!input.trim()) { alert("Enter text first!"); return; }

    loading.classList.remove("hidden");

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: input })
        });
        const data = await response.json();
        
        loading.classList.add("hidden");

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

               // B. LINK DETECTION OVERRIDE
        if (data.has_link === true) {
            console.log("🔗 Link detected by Backend!");

            // Case 1: If the AI said it was SAFE (Green), we must OVERRIDE it
            if (resultCard.classList.contains("safe")) {
                
                // 1. Force visual change from Green -> Orange
                resultCard.classList.remove("safe");
                resultCard.classList.add("caution");
                
                // 2. Update Icon & Title
                icon.innerText = "⚠️"; 
                title.innerText = "Caution: Link Detected";
                
                // 3. Strikethrough the original "Likely Safe" message
                // We keep the original text but cross it out, then add the warning
                details.innerHTML = `
                    <span style="text-decoration: line-through; opacity: 0.7;">This looks like a standard notification.</span>
                    <br><br>
                    <strong>HOWEVER:</strong> A link was detected. Even safe-looking messages can be dangerous if they contain links. Verify the sender.
                `;
            }
            
            // Case 2: If it was already Caution/Danger, just append a note
            else {
                details.innerHTML += "<br><br><strong>⚠️ Note:</strong> Contains a clickable link. Be careful.";
            }

            // Show the separate red Link Warning card too
            linkWarningCard.classList.remove("hidden");
            linkWarningCard.classList.add("visible");
        }


        // 3. SHOW SECOND OPINION BUTTON
        aiSection.classList.remove("hidden");
        document.getElementById("aiResult").classList.add("hidden"); // Reset previous AI text
        document.getElementById("askAiBtn").disabled = false;
        document.getElementById("askAiBtn").innerText = "🤖 Ask Google Gemini for Analysis";

        // 4. RENDER LIME CHART
        if (data.lime_data && data.lime_data.length > 0) {
            limeSection.classList.remove("hidden");
            renderLimeChart(data.lime_data);
        }

    } catch (error) {
        console.error(error);
        loading.classList.add("hidden");
        alert("Server Error");
    }
}

// GEN AI CALL
async function askGemini() {
    const input = document.getElementById("smsInput").value;
    const btn = document.getElementById("askAiBtn");
    const resultBox = document.getElementById("aiResult");
    const resultText = document.getElementById("aiText");
    
    btn.disabled = true;
    btn.innerText = "Consulting Gemini...";
    resultBox.classList.remove("hidden");
    resultText.innerHTML = "<em>Thinking...</em>"; // Use innerHTML for styling

    try {
        const response = await fetch(`${API_BASE_URL}/ask-gemini`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: input })
        });
        const data = await response.json();
        
        // USE THE PARSER HERE
        resultText.innerHTML = parseMarkdown(data.analysis); 
        
    } catch (error) {
        resultText.innerText = "Error contacting AI.";
    }
    btn.disabled = false;
    btn.innerText = "🤖 Ask Google Gemini for Analysis";
}

// LIME VISUALIZATION
function renderLimeChart(features) {
    const container = document.getElementById("limeChart");
    container.innerHTML = ""; // Clear old

    // 1. Find the maximum absolute weight to normalize against
    // This ensures the biggest bar is always full width
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
        
        // Color Logic
        const isSpamIndicator = weight > 0; 
        bar.className = isSpamIndicator ? "lime-bar danger-bar" : "lime-bar safe-bar";
        
        // Scaling Logic (Relative to max weight)
        // If weight is 0.01 and max is 0.02, width will be 50%
        // We add a minimum of 5% so tiny bars are still visible
        let widthPercentage = (Math.abs(weight) / maxWeight) * 100;
        if (widthPercentage < 5) widthPercentage = 5; // Minimum visibility
        
        bar.style.width = `${widthPercentage}%`;

        // Optional: Tooltip on hover to see exact value
        bar.title = `Weight: ${weight.toFixed(4)}`;

        barContainer.appendChild(bar);
        row.appendChild(label);
        row.appendChild(barContainer);
        container.appendChild(row);
    });
}


function parseMarkdown(text) {
    if (!text) return "";

    // Convert **bold** to <strong>bold</strong>
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert *italic* to <em>italic</em>
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert numbered lists "1. " to <br>1. 
    html = html.replace(/(\d+\.)\s/g, '<br><strong>$1</strong> ');

    // Clean up leading breaks
    if (html.startsWith('<br>')) html = html.substring(4);

    return html;
}