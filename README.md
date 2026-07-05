# 🌿 CropCare AI Agent

> **Autonomous Agricultural Intelligence** — powered by Google Gemini 2.5 Flash

CropCare AI Agent is a full-stack web application that provides farmers and agronomists with three AI-driven tools: leaf disease diagnostics, region-aware crop & fertilizer recommendations, and agronomic yield prediction.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔬 **Leaf Disease Diagnostics** | Upload a crop leaf image and get instant AI-powered disease identification, severity assessment, confidence score, and step-by-step treatment plan |
| 🌱 **Crop & Fertilizer Advisor** | Describe your region and query — the AI agent autonomously calls a soil knowledge-base tool, then generates tailored crop recommendations and a fertilizer prescription |
| 📊 **Yield Predictor** | Input crop type, farm area (hectares), and growing season to receive a scientifically reasoned yield estimate |

---

## 🏗️ Architecture

```
CropCare-AI-Agent/
├── backend/               # FastAPI + Google Gemini 2.5 Flash
│   ├── main.py            # 3 AI endpoints + agentic tool dispatch loop
│   ├── requirements.txt   # Python dependencies
│   └── .env               # 🔒 API key (git-ignored)
│
└── frontend/              # React 18 + Vite
    ├── src/
    │   ├── App.jsx                        # Tab navigation shell
    │   └── components/
    │       ├── DiagnosticsTab.jsx         # Leaf image upload & results
    │       ├── RecommendTab.jsx           # Region-based crop advisor
    │       └── YieldTab.jsx              # Yield estimation form
    ├── index.html
    └── vite.config.js
```

**Stack:**

- **Backend:** Python 3.13 · FastAPI · Uvicorn · `google-genai` SDK · `python-dotenv`
- **Frontend:** React 18 · Vite 5 · Axios · Vanilla CSS
- **AI Model:** Gemini 2.5 Flash (multimodal — vision + text)

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

### 1. Clone the repository

```bash
git clone https://github.com/ShantanuKundu/CropCare-AI-Agent.git
cd CropCare-AI-Agent
```

---

### 2. Backend setup

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your `.env` file:

```bash
# backend/.env
GEMINI_API_KEY="your_gemini_api_key_here"
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

Start the backend server:

```bash
python -m uvicorn main:app --reload
```

The API will be live at **http://127.0.0.1:8000**

---

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be live at **http://localhost:5173**

---

## 🔌 API Reference

Base URL: `http://127.0.0.1:8000`

### `GET /api/health`
Health check — returns service status.

---

### `POST /api/diagnose`
Analyze a crop leaf image for disease.

**Request body:**
```json
{
  "image_b64": "<base64-encoded image string>",
  "mime_type": "image/jpeg"
}
```

**Response:**
```json
{
  "crop": "Tomato",
  "disease": "Late Blight",
  "severity": "Moderate",
  "confidence": "91%",
  "treatment": ["Step 1...", "Step 2...", "Step 3..."],
  "reasoning": "Step-by-step diagnostic reasoning..."
}
```

**Supported crops:** Apple, Corn, Grape, Pepper, Potato, Tomato

---

### `POST /api/recommend`
Region-aware crop & fertilizer advisor (agentic — invokes soil database tool).

**Request body:**
```json
{
  "region": "Punjab",
  "query": "What should I grow this Rabi season?"
}
```

**Response:**
```json
{
  "soil_profile": "Soil: Alluvial | pH: 6.8 | ...",
  "crop_recommendations": ["Wheat", "Barley", "Mustard"],
  "fertilizer_plan": "Detailed NPK schedule...",
  "reasoning": "Step-by-step agronomic reasoning..."
}
```

---

### `POST /api/predict-yield`
Estimate crop yield for a given area and season.

**Request body:**
```json
{
  "crop": "Wheat",
  "area_ha": 5.0,
  "season": "Rabi"
}
```

**Response:**
```json
{
  "crop": "Wheat",
  "area_ha": 5.0,
  "season": "Rabi",
  "estimated_yield_mt": 17.5,
  "yield_per_ha": 3.5,
  "confidence": "Moderate",
  "notes": "Based on national average of 3.5 t/ha for Rabi wheat..."
}
```

---

## 🤖 How the Agentic Advisor Works

The `/api/recommend` endpoint uses a **multi-turn agentic loop**:

1. User sends region + query
2. Gemini is given the `query_soil_database` tool and instructed to call it first
3. The model emits a `function_call` — the backend dispatches it to the local Python function
4. The soil profile result is fed back as a `function_response`
5. Gemini synthesises the final crop & fertilizer plan grounded in real soil data

This follows the **ReAct (Reason + Act)** paradigm — the model reasons, calls tools, observes results, and then responds.

---

## 🔒 Security Notes

- `backend/.env` is **git-ignored** — your API key is never committed
- The backend CORS policy is restricted to `localhost:5173` and `localhost:3000`
- Never expose the backend directly to the internet without adding authentication

---

## 📦 Dependencies

### Backend (`requirements.txt`)
| Package | Version |
|---|---|
| `fastapi` | 0.115.0 |
| `uvicorn[standard]` | 0.30.6 |
| `google-genai` | ≥ 1.0.0 |
| `pydantic` | ≥ 2.0.0 |
| `python-multipart` | ≥ 0.0.9 |
| `python-dotenv` | ≥ 1.0.0 |

### Frontend
| Package | Version |
|---|---|
| `react` | ^18.3.1 |
| `react-dom` | ^18.3.1 |
| `axios` | ^1.7.2 |
| `vite` | ^5.3.4 |

---

## 📄 License

MIT License — feel free to fork, extend, and deploy.

---

<p align="center">Built with ❤️ using <a href="https://deepmind.google/technologies/gemini/">Google Gemini 2.5 Flash</a></p>
