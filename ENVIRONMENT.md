# 🌍 Global Environment System Audit

This document provides a comprehensive mapping of all environment variables used across the GuelmaGuide platform.

## 👥 Responsibility Mapping

| Service | Environment | configured In | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | Production | Vercel Project Settings | Next.js Build & Runtime |
| **Backend** | Production | Railway Service Vars | FastAPI Runtime |
| **Staging** | Staging | Vercel/Railway (branch-specific) | Isolated testing environment |
| **CI/CD** | Deployment | GitHub Repository Secrets | GitHub Actions automation |

---

## 🛠 Required Core Variables (Critical)

| Variable | Target | Purpose | Example / Required Format |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | PostgreSQL connection string | `postgresql+psycopg://user:pass@host:5432/db` |
| `REDIS_URL` | Backend | Redis connection for cache/jobs | `redis://default:token@host:6379/0` |
| `JWT_SECRET_KEY` | Both | Signing/Verifying session tokens | `openssl rand -base64 32` (Min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | Frontend | Meta tags, Sitemap, absolute links | `https://guelma.guide` |
| `BACKEND_CORS_ORIGINS`| Backend | Allowed domains for API access | `https://guelma.guide,http://localhost:3000` |

---

## 🔑 Service-Specific Variables

### 🤖 AI (Google Gemini)
| Variable | Target | Purpose |
| :--- | :--- | :--- |
| `AI_API_KEY` | Backend | Gemini key for server-side processing |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Frontend | Enables client-side AI Guide assistant |

### ☁️ Storage (Cloudflare R2)
| Variable | Target | Purpose |
| :--- | :--- | :--- |
| `R2_ACCOUNT_ID` | Backend | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | Backend | S3-Compatible Access Key |
| `R2_SECRET_ACCESS_KEY` | Backend | S3-Compatible Secret Key |
| `R2_BUCKET_NAME` | Backend | Name of the R2 bucket |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Both | Public CDN URL for assets |

### 🔐 Authentication (Google OAuth)
| Variable | Target | Purpose |
| :--- | :--- | :--- |
| `GOOGLE_CLIENT_ID` | Both | OAuth Public Identifier |
| `GOOGLE_CLIENT_SECRET` | Backend | OAuth Private Secret |
| `GOOGLE_REDIRECT_URI` | Backend | Callback URL (e.g. `/api/v1/auth/google/callback`) |

### 💳 Payments (Stripe)
| Variable | Target | Purpose |
| :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | Backend | API key for processing payments |
| `STRIPE_WEBHOOK_SECRET`| Backend | Verifying Stripe notifications |
| `STRIPE_PRO_PRICE_ID` | Backend | The Pricing ID for Pro Organized subscription |

---

## ⚡ Performance & Observability

| Variable | Target | Description | Default |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | Both | `staging` or `production` | `production` |
| `SENTRY_DSN` | Both | Sentry Error Tracking DSN | - |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend | Client-side Sentry Tracking | - |
| `REDIS_CACHE_TTL_SECONDS` | Backend | How long to cache API responses | `120` |

---

## 🚀 Environment Grouping

### Vercel (Frontend)
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_GEMINI_API_KEY`
- `NEXT_PUBLIC_R2_PUBLIC_URL`
- `GOOGLE_CLIENT_ID`
- `JWT_SECRET_KEY`

### Railway (Backend)
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET_KEY`
- `AI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `BACKEND_CORS_ORIGINS`
- `FRONTEND_BASE_URL`

### GitHub Secrets (CI/CD)
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RAILWAY_TOKEN`
- `RAILWAY_SERVICE_ID` (Optional, can use name)
