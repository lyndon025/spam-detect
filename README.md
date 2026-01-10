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
- **Deployment:** Vercel (Frontend) + Fly.io (Backend)

## 🚀 Deployment Guide

### Frontend (Vercel)
The frontend is deployed on Vercel: [https://spam-detectph.vercel.app/](https://spam-detectph.vercel.app/)

1. Push code to GitHub.
2. Import repo in Vercel.
3. Deploy (no special build settings needed for static config).

### Backend Connection
The frontend automatically connects to the backend:
- **Local:** `http://localhost:5000`
- **Production:** `https://spam-detect-backend.fly.dev`

*Note: The backend is hosted on Fly.io with 24/7 uptime enabled to ensure fast response times.*

## 🔗 Live Demo
- **Frontend:** [https://spam-detectph.vercel.app/](https://spam-detectph.vercel.app/)
- **Backend API:** [https://spam-detect-backend.fly.dev/](https://spam-detect-backend.fly.dev/)
