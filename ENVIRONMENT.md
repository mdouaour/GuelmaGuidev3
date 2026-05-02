# 🌍 Global Environment System (SaaS Grade)

This document defines the environment variable structure for the GuelmaGuide platform across its Staging and Production tiers.

## 👥 Responsibility Mapping

| Service | Responsibility | Master Key Location |
| :--- | :--- | :--- |
| **Next.js (Vercel)** | UI, Edge Runtime, i18n, Client AI | Vercel Project Settings |
| **FastAPI (Railway)** | Logic, DB, Auth, Payments, Worker | Railway Service Vars |
| **CI/CD (GitHub)** | Deployment Automation, Secrets | GitHub Action Secrets |

---

## 🏗 Environment Tiers

### 🧪 Staging
- **Branch**: `staging`
- **Database**: Isolated staging Postgres instance.
- **Purpose**: Feature validation and integration testing.
- **URL**: `https://staging.guelma.guide`

### 🚀 Production
- **Branch**: `main`
- **Database**: High-availability production Postgres cluster.
- **Purpose**: Real users and live traffic.
- **URL**: `https://guelma.guide`

---

## 🛠 Variables Audit

### 🔐 Shared Secrets (Critical)
| Variable | Used In | Purpose | Required |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | DB Connection string | Yes |
| `REDIS_URL` | Backend | Cache and Task Queue | Yes |
| `JWT_SECRET_KEY` | Both | Signing/Verifying Tokens | Yes (Min 32 chars) |
| `GOOGLE_CLIENT_ID` | Both | OAuth Authentication | Yes |
| `GOOGLE_CLIENT_SECRET` | Backend | OAuth Secret | Yes |

### 🤖 AI & External APIs
| Variable | Used In | Impact |
| :--- | :--- | :--- |
| `AI_API_KEY` | Backend | Gemini server-side processing |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Frontend | Client-side AI interactions |
| `STRIPE_SECRET_KEY` | Backend | Payment processing |
| `R2_SECRET_ACCESS_KEY` | Backend | Image persistence |

---

## ⚙️ Configuration Matrix

### GitHub Secrets
These are required for the CI/CD pipeline to function:
- `VERCEL_TOKEN`: Vercel auth token.
- `RAILWAY_TOKEN`: Railway production token.
- `RAILWAY_STAGING_TOKEN`: Railway staging token.
- `PROD_DATABASE_URL`: Backup verification.
- `PROD_JWT_SECRET_KEY`: Internal verify.

### Vercel (Frontend)
Variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.
- `NEXT_PUBLIC_API_BASE_URL`: Pointer to the correct FastAPI instance.
- `NEXT_PUBLIC_APP_URL`: Canonical URL for SEO.

### Railway (Backend)
- `BACKEND_CORS_ORIGINS`: Commas-separated list of allowed domains.
- `APP_ENV`: `staging` or `production`.
- `LOG_LEVEL`: `info` (production) or `debug` (staging).

---

## 🛡 Security Rules
1. **Never** share `JWT_SECRET_KEY` via email or Slack. Use the dashboard secrets.
2. If `JWT_SECRET_KEY` is leaked, update in both Vercel and Railway simultaneously to minimize downtime.
3. Use **IP Whitelisting** on the database if your infrastructure allows.
