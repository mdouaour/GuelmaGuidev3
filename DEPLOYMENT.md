# 🚀 Deployment Guide: Production & Scalability

This document provides the **CRITICAL** steps to take the Guelma platform from development to a professional production environment (Vercel, Railway, Cloud Run).

## 1. Prerequisites
- **GitHub Account**: To host your source code.
- **Vercel/Railway Account**: Or any cloud provider supporting Node.js.
- **PostgreSQL Database**: A managed instance (e.g., Neon or Railway DB).
- **Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/).

---

## 2. Environment Configuration (FULL LIST)
You must set these variables in your deployment dashboard (e.g., Vercel Project Settings).

| Variable | Required | Example | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://guelma.guide` | Public URL of your site. |
| `API_BASE_URL` | Yes | `https://api.guelma.guide/api/v1` | URL of the Python backend. |
| `DATABASE_URL` | Yes | `postgresql://...` | Connection string for Postgres. |
| `JWT_SECRET_KEY` | Yes | `random_32_char_string` | Used to sign your tokens. |
| `NEXT_PUBLIC_GEMINI_API_KEY` | No | `AIzaSy...` | Enables client-side AI Guide. |
| `SENTRY_DSN` | No | `https://...` | For real-time error tracking. |

---

## 3. Deployment Steps

### Step A: Database & Backend
1. **Provision Database**: Create a new PostgreSQL instance on Railway.
2. **Apply Migrations**: 
   - Connect to the backend folder (`/backend`).
   - Run `alembic upgrade head`.
3. **Deploy Backend**: 
   - Point your hosting provider to the `/backend` directory.
   - Ensure the `API_BASE_URL` matches where this is hosted.

### Step B: Frontend (Next.js)
1. **Import Project**: Link your GitHub repository to Vercel.
2. **Framework Preset**: Ensure "Next.js" is selected.
3. **Environment Variables**: Paste all variables from section 2 into the Vercel "Environment Variables" tab.
4. **Build & Deploy**: Click Deploy!

---

## 4. Verification & Testing
Once deployed, perform these checks:
1. **i18n Check**: Visit `/ar` and `/en` to ensure translations load.
2. **Auth Check**: Attempt to Register and Login. Verify you receive the session cookie.
3. **AI Guide**: Ask the AI Guide for a "Historical tour of Guelma". It should respond using your Gemini Key.
4. **Map Check**: Ensure the map renders and you can click on landmarks.

---

## 5. Common Errors & Fixes
- **401 Unauthorized**: Ensure `JWT_SECRET_KEY` matches exactly on both Frontend and Backend.
- **CORS Error**: Update `BACKEND_CORS_ORIGINS` in your backend variables to include your Vercel domain.
- **Map Not Loading**: Check if `NEXT_PUBLIC_API_BASE_URL` is correct and accessible.

---

## 6. How it Scrapes: Scaling to Other Cities
To scale to Annaba or Constantine:
1. **Update Data**: Add new entries to the `places` table with their city tags.
2. **Multitenancy**: The frontend will automatically show them if you filter by city in the API request.
3. **SEO**: Update `src/app/sitemap.ts` to include city-specific paths.

