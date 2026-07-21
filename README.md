# ShifraAI — Voice AI Assistant Platform for Websites

ShifraAI is a full-stack SaaS platform that lets any website owner add a voice-controlled AI assistant to their site by pasting in a single script tag — no coding required. Visitors can speak to the assistant, get spoken answers powered by Google Gemini, and even be voice-navigated to specific pages on the site.

Live demo: https://aivoice-assistant-1.onrender.com

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [How the Embeddable Widget Works](#how-the-embeddable-widget-works)
- [Folder Structure](#folder-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Routes](#api-routes)
- [Database Models](#database-models)
- [Design Decisions](#design-decisions)
- [Known Limitations](#known-limitations--future-improvements)

---

## Overview

Small business websites usually have no easy way to answer visitor questions or guide them around the site in real time. Building a custom voice/chat assistant is normally expensive and slow. ShifraAI solves this by letting a business owner:

1. Sign up and configure an AI assistant's name, tone, and business context
2. Add page navigation shortcuts (e.g., "pricing" → `/pricing`)
3. Copy a single `<script>` tag into their website
4. Instantly have a working, branded voice assistant live on their site

---

## Features

- 🔐 Google Sign-In authentication (Firebase + JWT sessions)
- 🛠️ Assistant Builder — customize name, business details, tone, and theme
- 🎙️ Voice-based conversation using the browser's native Speech Recognition & Speech Synthesis APIs
- 🧭 Voice-controlled page navigation via keyword matching
- 🤖 AI responses powered by Google Gemini, contextualized to each business
- 💳 Subscription billing via Razorpay with server-side payment verification
- 📊 Usage tracking and plan limits (Free vs Pro)
- 🔌 One-line embeddable widget script for any website

---

## Tech Stack

**Frontend:** React 19, Vite, React Router v7, Tailwind CSS v4, Axios, Firebase Auth, react-hot-toast, react-icons

**Backend:** Node.js, Express 5, MongoDB, Mongoose, JWT, cookie-parser, cors, dotenv

**Integrations:** Google Gemini API (AI responses), Razorpay (payments), Firebase (Google OAuth), Web Speech API (voice input/output)

**Deployment:** Render

---

## Architecture

The project has three main parts:

1. **Dashboard (React app)** — where business owners sign in, configure their assistant, manage billing, and get their embed code.
2. **Embeddable Widget (`assistant.js`)** — a vanilla JS script that runs on the business's live website, rendering the mic UI and talking to the backend.
3. **Backend API (Express + MongoDB)** — handles auth, assistant configuration, AI responses, navigation logic, and billing.

```
Website Visitor
      │  (speaks)
      ▼
assistant.js (embedded widget)
      │  fetch config + POST /api/assistant/ask
      ▼
Express Backend ──► MongoDB (User, Billing)
      │
      ├─► Navigation keyword match (no AI call)
      └─► Gemini API (contextual AI reply)
      │
      ▼
Spoken response back to visitor (Speech Synthesis)
```

---

## How the Embeddable Widget Works

1. Business owner pastes:
   ```html
   <script src="https://aivoice-assistant-1.onrender.com/assistant.js" data-user-id="USER_ID"></script>
   ```
2. The script reads `data-user-id`, injects the widget's HTML/CSS into the host page, and fetches that user's assistant config from a **public** endpoint (`/api/assistant/config/:userId`) — public because the widget runs on domains the backend doesn't control.
3. On mic click, the browser's `SpeechRecognition` API converts speech to text.
4. The text is sent to `/api/assistant/ask`, where the backend:
   - Checks if it's a navigation command (keyword match against configured pages) — if so, returns a redirect path instantly, no AI call needed.
   - Otherwise builds a prompt with the business's name, description, and tone, and calls Gemini for a short, voice-friendly reply.
5. The response is spoken back using `SpeechSynthesisUtterance`.

---

## Folder Structure

```
project3/
├── Client/                     # React frontend (Vite)
│   ├── public/
│   │   ├── assistant.js        # Embeddable widget script
│   │   └── assistant.css       # Widget styles
│   └── src/
│       ├── Components/         # Navbar, ProtectedRoute, AssistantPreview
│       ├── pages/               # Home, Login, Builder, Billing
│       ├── utils/firebase.js    # Firebase Auth config
│       └── App.jsx
│
└── Server/                     # Express backend
    ├── Configs/                 # DB, Gemini, Razorpay, JWT configs
    ├── Controllers/              # auth, user, assistant, billing logic
    ├── Middleware/isAuth.js      # JWT verification middleware
    ├── Models/                   # User, Billing schemas
    ├── Routes/                   # auth, user, assistant, billing routes
    └── index.js                  # App entry point
```

---

## Environment Variables

**Server (`.env`)**
```
PORT=
MONGODB_URL=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

**Client (`.env`)**
```
VITE_FIREBASE_API_KEY=
VITE_RAZORPAY_KEY_ID=
```

---

## Getting Started

### Backend
```bash
cd Server
npm install
npm run dev
```

### Frontend
```bash
cd Client
npm install
npm run dev
```

---

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/google` | Public | Google login — creates or finds user, issues JWT cookie |
| GET | `/api/auth/logout` | Public | Clears session cookie |
| GET | `/api/user/current-user` | Private | Get logged-in user's data |
| POST | `/api/user/save-assistant` | Private | Save/update assistant configuration |
| GET | `/api/assistant/config/:userId` | Public | Widget fetches assistant config (no API key exposed) |
| POST | `/api/assistant/ask` | Public | Widget sends visitor's message, gets AI/navigation response |
| POST | `/api/billing/order` | Private | Create a Razorpay order |
| POST | `/api/billing/verify` | Private | Verify payment signature and upgrade plan |

---

## Database Models

**User**
- Identity: `name`, `email`
- Assistant config: `assistantName`, `businessName`, `businessType`, `businessDescription`, `tone`, `theme`
- Navigation: `pages` (array of `{ name, path, keywords[] }`)
- AI: `geminiApiKey`, `geminiStatus` (active / invalid / quota_exceeded)
- Usage: `totalMessages`, `requestLimit`
- Billing: `plan` (free / pro), `proExpiresAt`
- `isSetupComplete`

**Billing**
- `userId`, `amount`, `plan`, `paymentId`, `orderId`, `status` (created / paid / failed)

---

## Design Decisions

- **Bring-your-own Gemini API key** — shifts AI usage cost to the customer instead of the platform, a common AI-SaaS cost model.
- **Rule-based navigation before AI** — voice commands like "open pricing" are matched against keywords first; only non-navigation queries hit the Gemini API, saving cost and latency.
- **Split CORS policy** — dashboard routes are locked to the app's own frontend origin with credentials; the assistant's public routes allow any origin since the widget runs on third-party sites.
- **Server-side payment verification** — Razorpay payments are verified via HMAC-SHA256 signature check on the backend rather than trusting the frontend's success callback.
- **Native browser Speech APIs** — no external speech-to-text/text-to-speech service required, keeping the widget lightweight and free to run.

---

## Known Limitations & Future Improvements

- Free-tier message limit check-and-increment is not atomic — possible race condition under concurrent requests.
- Gemini API keys are stored in plaintext — should be encrypted at rest.
- Pro plan expiry check has a logic bug (comparison instead of assignment) — should be fixed and paired with a scheduled downgrade job.
- Public assistant endpoints could be hardened with domain/referrer validation to prevent abuse.
- No caching layer for repeated FAQ-style AI responses.
