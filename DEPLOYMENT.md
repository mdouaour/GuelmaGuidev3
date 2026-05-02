# 🚀 Enterprise Deployment Guide: Production & Staging

This document outlines the professional deployment strategy for GuelmaGuide, ensuring zero-risk live updates and reliable infrastructure.

## 🏗 Infrastructure Overview

*   **Frontend**: Next.js 15 on **Vercel** (Global CDN + Edge Runtime).
*   **Backend**: FastAPI on **Railway** (Container host with internal networking).
*   **Primary DB**: PostgreSQL (Managed).
*   **Caching**: Redis (Managed).
*   **Object Storage**: Cloudflare R2 (S3-compatible).
*   **CI/CD**: GitHub Actions (Staging & Production branches).

---

## 🛠 Step 1: Infrastructure Provisioning

Follow this specific order to avoid dependency failures:

1.  **Cloudflare**: Set up a site for your domain. Register for **R2 Storage** and create a bucket.
2.  **Railway**: Create a new project. 
    *   Provision **PostgreSQL**.
    *   Provision **Redis**.
3.  **Google Cloud Console**: Prepare your **OAuth 2.0 Credentials**.
    *   Add `https://api.guelma.guide/api/v1/auth/google/callback` to Authorized Redirect URIs.
4.  **Stripe**: Set up a product and price for the "Pro Subscription".
5.  **Google AI Studio**: Generate a Gemini API key.

---

## 🔑 Step 2: Environment Configuration

Copy `.env.example` as a reference. You must configure these variables in the dashboards:

### Backend (Railway Dashboard)
| Key | Value Source |
| :--- | :--- |
| `DATABASE_URL` | Copied from Railway Postgres plugin |
| `REDIS_URL` | Copied from Railway Redis plugin |
| `JWT_SECRET_KEY` | Generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console |
| `AI_API_KEY` | Google AI Studio |
| `R2_*` | Cloudflare R2 settings |

### Frontend (Vercel Dashboard)
| Key | Value Source |
| :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Your production frontend URL |
| `NEXT_PUBLIC_API_BASE_URL` | Your production backend URL |
| `JWT_SECRET_KEY` | **MUST MATCH BACKEND KEY** |

---

## ⚙️ Step 3: CI/CD Automation (GitHub Actions)

We use a two-tier deployment system:

### Staging (Branch `staging` or PRs)
*   **Trigger**: Push to `staging` branch or any Pull Request.
*   **Result**: Vercel Preview Deployment & Staging Backend service update.

### Production (Branch `main`)
*   **Trigger**: Push or Merge to `main`.
*   **Result**: Live Production update on `guelma.guide`.

### 🔐 Required GitHub Secrets:
Add these in **Settings > Secrets and variables > Actions**:
1.  `VERCEL_TOKEN`: Your Vercel account token.
2.  `VERCEL_ORG_ID`: From Vercel Project.
3.  `VERCEL_PROJECT_ID`: From Vercel Project.
4.  `RAILWAY_TOKEN`: From Railway Account Settings.

---

## 🧪 Step 4: Post-Deployment Verification

After the pipeline completes, verify these endpoints:

1.  **Health Check**: `https://api.guelma.guide/health`
    *   Should return `status: ok` and confirm `database` and `redis` connections.
2.  **Auth Flow**: Login with Google. Ensure cookies are set as `HttpOnly` and `Secure`.
3.  **AI Guide**: Use the Discover page to ask a location-based question.
4.  **Image Upload**: Suggest a new place with an image. Verify it appears on the map.

---

## 🔁 Step 5: Rollback Strategy

The system is designed for instant recovery:

*   **Vercel**: If the frontend breaks, find the last successful deployment in the Vercel dashboard and click **Promote to Production**.
*   **Railway**: Use the **Rollback** button in the service dashboard to revert to the previous container image.
*   **CI/CD**: If a health check fails during deployment, the GitHub Action will stop, preventing a broken version from reaching global users.
