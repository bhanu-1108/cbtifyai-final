# 🚀 CBTifyAI-Final — AI-Powered CBT Exam Platform

CBTifyAI-Final is a production-ready, full-stack MERN application integrated with Python FastAPI OCR (PaddleOCR + PyMuPDF) and Hugging Face AI (`Qwen/Qwen2.5-7B-Instruct`) for converting study PDFs and images into Computer-Based Test (CBT) exams.

---

## 🏗️ Architecture & AI Pipeline Flow

```text
Upload PDF/JPG/PNG
      ↓
Express Backend (Node.js)
      ↓
Python FastAPI OCR Microservice
      ├── Text PDF  →  Extract using PyMuPDF (fitz)
      └── Scanned PDF / Image  →  Use PaddleOCR
      ↓
Text Cleaning (Noise removal, page numbers, duplicate line strip)
      ↓
Chunking (2000–3500 char paragraph-aware chunks)
      ↓
Hugging Face Inference API (Qwen/Qwen2.5-7B-Instruct)
      ↓
Generate Structured JSON Array
      ↓
Question Schema Validation
      ↓
Store Test & Documents in MongoDB Atlas
      ↓
Generate Interactive CBT Test
      ↓
Student / Admin Dashboard Analytics & Roster
```

---

## 📁 Directory Structure

```text
CBTifyAI-Final/
├── frontend/                     # React + Vite + TailwindCSS Frontend
│   ├── public/                   # Favicon and static icons
│   ├── src/
│   │   ├── components/           # GlassCard, Navbar, Sidebar
│   │   ├── context/              # AppContext.jsx (State & DB sync)
│   │   ├── pages/                # Landing, Login, Register, Dashboard, Upload, Test, Analytics, OrgPortal, AdminAnalytics
│   │   ├── App.jsx               # Routes & Layout wrappers
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Glassmorphism & Custom styling
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/                      # Node.js Express Backend
│   ├── python/                   # Python FastAPI OCR Microservice
│   │   ├── main.py               # FastAPI endpoints (/ocr/image, /ocr/pdf)
│   │   ├── ocr.py                # PaddleOCR & PyMuPDF logic
│   │   └── requirements.txt      # Python dependencies
│   ├── services/
│   │   ├── ocrService.js         # Calls FastAPI OCR microservice
│   │   ├── huggingfaceService.js # Qwen2.5-7B-Instruct generator
│   │   ├── chunkService.js       # Text chunking logic
│   │   ├── validatorService.js   # Question schema validator
│   │   └── questionGenerationService.js # Full pipeline orchestrator
│   ├── utils/
│   │   └── textCleaner.js        # Text cleaning and normalisation
│   ├── db.js                     # MongoDB connection & initial seeding
│   ├── index.js                  # Main Express server entry point
│   ├── package.json
│   └── .env
├── .env.example
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Node.js**: v18+
- **Python**: 3.9–3.11 (with `pip`)
- **MongoDB Atlas Connection URI**

---

### 2. Python FastAPI OCR Microservice Setup

```bash
cd backend/python
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
```

Run FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```
*FastAPI OCR will run on http://localhost:8000*

---

### 3. Node.js Express Backend Setup

```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
MONGODB_URI=mongodb+srv://bhanusaran5002:wB3utSSgmS2z3N2V@cluster0.km5bvpl.mongodb.net/
PORT=5000
HF_API_KEY=hf_your_hugging_face_token_here
PYTHON_OCR_URL=http://localhost:8000
CLIENT_ORIGIN=http://localhost:5173
```

Run Express backend:
```bash
npm start
# or for development:
npm run dev
```
*Express backend will run on http://localhost:5000*

---

### 4. React Frontend Setup

```bash
cd frontend
npm install
```

Configure `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

Run React Vite dev server:
```bash
npm run dev
```
*React frontend will run on http://localhost:5173*

---

## 🚀 Key Features

1. **Zero Gemini References**: Fully decoupled from Gemini API; powered by Hugging Face `Qwen/Qwen2.5-7B-Instruct`.
2. **Dual OCR System**: PyMuPDF fast-parsing for text PDFs, PaddleOCR fallback for scanned/image PDFs and images.
3. **Automatic Question Validation**: Strict JSON schema validation ensuring 4 options, valid zero-based correct index, difficulty rating, and Bloom taxonomy tags.
4. **MongoDB Persistence**: Stores generated CBT tests, documents metadata, student rosters, exam schedules, and submission attempts.
5. **Role-Based Views**: Student Dashboard with progress charts & practice presets, plus Organization Portal with roster exports, test links, and student heatmaps.
