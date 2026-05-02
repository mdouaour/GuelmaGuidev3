# 🚀 SaaS-Grade Deployment Guide

GuelmaGuide uses a modern, automated, and secure deployment pipeline designed for 99.9% uptime and zero-manual-risk updates.

## 🏗 System Architecture

The platform is split into two independent services communicating via a secure API layer:
1.  **Backend (FastAPI)**: Hosted on Railway. Internal services include Postgres, Redis, and arq workers.
2.  **Frontend (Next.js)**: Hosted on Vercel. Global delivery via CDN.

---

## 🛠 Step 1: Infrastructure Prereqs

1.  **Google Cloud Console**:
    *   Create an OAuth 2.0 Client.
    *   Set Authorized Redirect URI: `https://api.guelma.guide/api/v1/auth/google/callback`
2.  **Cloudflare R2**:
    *   Create a bucket named `guelma-guide-assets`.
    *   Set up a public URL or custom domain.
3.  **Stripe**:
    *   Configure a Subscription product.
    *   Copy the **Secret Key** and **Webhook Signing Secret**.

---

## ⚙️ Step 2: Service Configuration

Configure variables in the respective dashboards according to `ENVIRONMENT.md`.

### 🚨 Critical Synchronization
The `JWT_SECRET_KEY` **MUST** be identical on both Vercel and Railway. If they differ, the proxy will correctly route requests, but the backend will reject the tokens, causing a "Login loop".

---

## 🚀 Step 3: CI/CD Pipeline Flow

Our GitHub Actions pipeline (`deploy.yml`) is the "Safety Guard" for the codebase.

### 🟢 Normal Flow
1.  **Commit** to `staging` branch.
2.  **Validation**: Build frontend, run backend checks.
3.  **Deploy**: Pushes to Railway Staging.
4.  **Verification**: Automated health check calls `/health`.
5.  **Merge** to `main` branch.
6.  **Production Push**: Pushes to Railway Prod, then Vercel Prod.

---

## 🧪 Step 4: Health & Verification

After every deployment, visit:
`https://api.guelma.guide/health`

**Expected Status 200 OK:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "production",
  "services": {
    "database": "connected",
    "redis": "connected",
    "auth": "working"
  }
}
```

---

## 🔁 Step 5: Rollback Procedures

### Automated
If the backend health check fails during the `deploy-production` job, the GitHub Action will stop, preventing the frontend from pointing to a broken API.

### Manual Backend Rollback (Railway)
1.  Go to Railway Dashboard.
2.  Select **Deployment History**.
3.  Click **Rollback** on the last known working image.

### Manual Frontend Rollback (Vercel)
1.  Go to Vercel Project.
2.  Click **Deployments**.
3.  Find the previous "Production" build and click **Redeploy > Promote**.

---

## 📉 Failure Analysis

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| **502 Bad Gateway** | Backend service crashed or booting. | Check Railway logs for startup errors. |
| **Infinite Redirects** | `GOOGLE_REDIRECT_URI` mismatch. | Verify redirect URI in Google Cloud Console. |
| **CORS Errors** | `BACKEND_CORS_ORIGINS` is wrong. | Ensure it includes your exact Vercel domain. |
| **Auth 401** | `JWT_SECRET_KEY` mismatch. | Regenerate and sync keys in both dashboards. |
