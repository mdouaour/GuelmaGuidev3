# 🚀 Complete Deployment Guide: Step-by-Step

This guide walks you through the entire process of deploying GuelmaGuide to a production environment.

## 1. Database & Infrastructure

### 🗄 PostgreSQL (Relational Data)
We recommend **Railway** or **Neon**.
1. Create a PostgreSQL instance.
2. Copy the `DATABASE_URL`.
3. In your backend terminal, run migrations: `cd backend && alembic upgrade head`.

### ⚡ Redis (Caching & Rate Limiting)
Required for high-performance data loading and security.
1. Provision a Redis instance (Railway, Upstash, or Redis Cloud).
2. Set the `REDIS_URL`.

---

## 2. Third-Party Service Setup

### ☁️ Cloudflare R2 (Image Storage)
1. Log in to Cloudflare > R2 > Create Bucket.
2. In Bucket Settings, enable "Public Access via Managed Subdomain" or link a custom domain.
3. In **My Profile > API Tokens**, create a token with `R2 Read/Write` permissions.
4. Copy `Account ID`, `Access Key ID`, and `Secret Access Key`.

### 🤖 Google AI Studio (AI Guide)
1. Go to [AI Studio](https://aistudio.google.com/).
2. Create an API Key.
3. Set `NEXT_PUBLIC_GEMINI_API_KEY` and `AI_API_KEY`.

### 🔐 Google OAuth (Social Login)
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project.
3. In **APIs & Services > OAuth consent screen**, configure your app.
4. In **Credentials**, create an "OAuth 2.0 Client ID".
   - **Authorized JavaScript origins**: `https://guelma.guide`
   - **Authorized redirect URIs**: `https://api.guelma.guide/api/v1/auth/google/callback`
5. Copy `Client ID` and `Client Secret`.

### 💳 Stripe (Pro Subscriptions)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/).
2. Create a **Subscription Product** for "Pro Organizers".
3. Copy the **Price ID**.
4. Set `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID`.

---

## 3. Deploying the Backend (FastAPI)

1. Set the deployment directory to `/backend`.
2. Configure **Environment Variables** (see `ENVIRONMENT.md`).
3. **Build Command**: `pip install -r requirements.txt`.
4. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

---

## 4. Deploying the Frontend (Next.js)

1. Link your GitHub Repo to **Vercel**.
2. Configure **Environment Variables**.
3. **Build Command**: `npm run build`.
4. **Install Command**: `npm install`.

---

## 5. Verification Checklist

- [ ] **Home Page**: Visit `https://guelma.guide`. Does the hero section load?
- [ ] **i18n**: Toggle between Arabic and English.
- [ ] **Map**: Open the Discover page. Do the markers appear after ~1s?
- [ ] **Auth**: Login with Google. Does your profile avatar appear?
- [ ] **AI**: Ask the AI Guide "What happened in the Roman Theater?".
- [ ] **Upload**: Try to suggest a place with an image. Does it upload to R2?

---

## 🛠 Common Production Issues

| Issue | Potential Cause | Fix |
| :--- | :--- | :--- |
| **500 Internal Error** | Missing `DATABASE_URL` or failed migration. | Run `alembic upgrade head`. |
| **403 Forbidden** | `BACKEND_CORS_ORIGINS` mismatch. | Add your frontend URL to the list. |
| **Empty Map** | `NEXT_PUBLIC_API_BASE_URL` is blocked by browser. | Ensure it is an HTTPS link. |
| **Login Loop** | `JWT_SECRET_KEY` differs between services. | Sync the keys in all dashboards. |

