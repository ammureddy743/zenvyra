# Zenvyra — AI Photo Editing Platform

**Zenvyra** is a fast, clean, full-resolution AI photo-editing platform built with **Next.js + Tailwind CSS**, **Python FastAPI**, and **Supabase**.

> **Current Status — Step 1 Complete**: Background Remover (`rembg` with `birefnet-general` & `isnet-general-use`), drag-and-drop upload (up to 20 MB), full-resolution processing, before/after comparison slider with zoom, edge refinement sliders (feather, smooth, shift edge), manual touch-up brush (restore/erase) with undo/redo, and PNG/JPEG (96% quality) export.

---

## Folder Structure

```text
Zenvyra/
├── .env.example                 # Shared environment variable reference
├── DEPLOYMENT.md                # Vercel, Render/HF Spaces, and Supabase guide
├── README.md                    # Local setup & architecture overview
├── supabase/
│   └── schema.sql               # Profiles, credits, edit_jobs, 24h expiry, admin view
├── backend/
│   ├── Dockerfile               # Production container for Render / HF Spaces
│   ├── requirements.txt         # FastAPI, rembg, Pillow, NumPy, SciPy
│   └── app/
│       ├── main.py              # FastAPI endpoints & CORS
│       ├── config.py            # Environment settings
│       └── services/
│           ├── bg_remover.py    # Full-res rembg + edge refinement + quality check
│           └── cleanup.py       # 24-hour automatic temp file purge
└── frontend/
    ├── package.json
    └── src/
        ├── app/                 # Next.js App Router pages & layouts
        │   ├── page.tsx         # Landing page (Hero, demo, tools, pricing, FAQ)
        │   └── tools/
        │       └── background-remover/
        │           └── page.tsx # Background Remover Studio
        └── components/          # Navbar, ThemeProvider, BeforeAfterSlider, Studio
```

---

## Local Setup

### 1. Backend (FastAPI + rembg)

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify the API is running at `http://localhost:8000/health`.

### 2. Frontend (Next.js)

```bash
cd frontend
cp ../.env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.
