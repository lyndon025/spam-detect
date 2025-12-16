# 🇵🇭 Spam Detect PH - Frontend

The official user interface for the **Spam Detect PH** project. A clean, mobile-responsive web app to detect SMS spam, scams, and smishing attempts.

## ✨ Features
- **AI Analysis:** Checks SMS against a trained Neural Network.
- **Traffic Light System:** 🟢 Safe | 🟡 Caution (Ads) | 🔴 Danger (Scam).
- **OCR Integration:** Scan screenshots using Tesseract.js (runs in-browser, does not store images).
- **Second Opinion:** "Ask Gemini" button for Generative AI analysis.
- **Explainability:** Visual LIME charts showing why a message was flagged.

## 🛠️ Tech Stack
- **Core:** HTML5, CSS3, Vanilla JavaScript.
- **Libraries:** Tesseract.js (OCR), Google Fonts (Segoe UI).
- **Deployment:** Vercel.

## 🚀 Deployment Guide (Vercel)

This frontend is static (HTML/JS/CSS) and can be deployed for free on Vercel.

1.  **Push to GitHub:** Ensure your code is in a GitHub repository.
2.  **Login to Vercel:** Go to [Vercel.com](https://vercel.com) and sign in.
3.  **Add New Project:** Click "Add New..." > "Project" and import your GitHub repo.
4.  **Configure Build:**
    *   **Framework Preset:** Other (or leave default).
    *   **Root Directory:** `./` (default).
    *   **Build Command:** (None needed).
    *   **Output Directory:** (None needed).
5.  **Deploy:** Click **Deploy**. Vercel will build your site and give you a live URL.

**Note:** Ensure your `script.js` points to your live backend URL (e.g., Render) instead of `localhost` when deploying.

## 🔗 Live Demo
https://spam-detectph.vercel.app/
