# Deployment Guide — Zenvyra

This guide covers deploying the three parts of **Zenvyra**:
1. **Database & Auth**: Supabase
2. **AI Backend (FastAPI + rembg)**: Render or Hugging Face Spaces
3. **Frontend (Next.js + Tailwind CSS)**: Vercel

---

## 1. Supabase Setup (Database, Auth & Storage)

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.
3. In **Authentication → Providers**:
   - Ensure **Email** is enabled.
   - Enable **Google** OAuth (add your Google Client ID & Secret and set the callback URL to `https://<your-project>.supabase.co/auth/v1/callback`).
4. In **Storage**:
   - Create a private bucket named `zenvyra-uploads`.
   - Configure a lifecycle rule or scheduled Edge Function to delete objects older than 24 hours.
5. Copy your **Project URL**, **anon public key**, and **service_role key** from **Settings → API**.

---

## 2. Backend Deployment (FastAPI AI Service)

### Option A: Render
1. Push this repository to GitHub.
2. In Render, click **New → Web Service** and connect your repo.
3. Set **Root Directory** to `backend`.
4. Set **Runtime** to **Docker** (uses `backend/Dockerfile`).
5. Choose an instance with at least **2 GB–4 GB RAM** (BiRefNet / IS-Net ONNX models require ~1.5–2.5 GB RAM).
6. Add environment variables:
   - `ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app`
   - `MAX_UPLOAD_MB=20`
   - `FILE_RETENTION_HOURS=24`
   - `DEFAULT_BG_MODEL=birefnet-general`
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...`
7. Deploy and note your Render URL (e.g., `https://zenvyra-api.onrender.com`).

### Option B: Hugging Face Spaces (16 GB RAM Free Tier)
1. Create a new **Space** on [huggingface.co/spaces](https://huggingface.co/spaces) with **Docker** SDK.
2. Upload the contents of `backend/` to the Space.
3. Update `PORT` to `7860` in Space variables (HF Spaces expects port `7860`).
4. Set `ALLOWED_ORIGINS` to your Vercel frontend URL.
5. Copy the Space direct URL (e.g., `https://<username>-zenvyra-api.hf.space`).

---

## 3. Frontend Deployment (Vercel)

1. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url`
   - `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key`
4. Click **Deploy**.
5. After deployment, add your Vercel URL to `ALLOWED_ORIGINS` on your backend and to **Authentication → URL Configuration** in Supabase.
