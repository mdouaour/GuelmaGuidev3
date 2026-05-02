# Environment Variables Guide

This document provides an exhaustive list of all environment variables used by the GuelmaGuide platform across its Frontend, Backend, and Third-party services.

## 🛠 Required Core Variables

These variables are essential for the application to boot and perform its basic functions.

### Shared / Global
| Name | Description | Example |
| :--- | :--- | :--- |
| `JWT_SECRET_KEY` | 32+ char string used to sign session tokens. Must be the same on Frontend and Backend. | `df32a8...32f8` |
| `DATABASE_URL` | PostgreSQL connection string. | `postgresql://user:pass@host:5432/db` |

### Frontend (Next.js)
Variables starting with `NEXT_PUBLIC_` are accessible in the browser.

| Name | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | The public URL where your frontend is hosted. | `https://guelma.guide` |
| `NEXT_PUBLIC_API_BASE_URL` | The public URL where the Backend API is accessible. | `https://api.guelma.guide/api/v1` |
| `API_BASE_URL` | (Server-side) Internal URL for the Backend API. | `http://backend:8000/api/v1` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | API Key for client-side AI Guide interactions. | `AIzaSy...` |

### Backend (FastAPI)
| Name | Description | Example |
| :--- | :--- | :--- |
| `BACKEND_CORS_ORIGINS` | Comma-separated list of allowed frontend domains. | `https://guelma.guide,http://localhost:3000` |
| `FRONTEND_BASE_URL` | Used for email links and redirects. | `https://guelma.guide` |

---

## 🔑 Third-Party Service Keys

Configure these to enable advanced features like Image Uploads, AI, Payments, and Emails.

### AI & Maps
| Name | Service | Description |
| :--- | :--- | :--- |
| `AI_API_KEY` | Google AI Studio | Backend key for AI processing. (Same as Gemini Key) |
| `MAPS_API_KEY` | MapLibre/Google | Key for map tiling or geolocation services. |

### Storage (Cloudflare R2 / S3)
Used for hosting high-resolution landmark and activity images.
| Name | Description | Example |
| :--- | :--- | :--- |
| `R2_ACCOUNT_ID` | Cloudflare Account ID. | `8d3...` |
| `R2_ACCESS_KEY_ID` | Access Key ID for R2. | `fd2...` |
| `R2_SECRET_ACCESS_KEY` | Secret Key for R2. | `a1b2...` |
| `R2_BUCKET_NAME` | The name of your R2 bucket. | `guelma-assets` |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | The public CDN URL for the bucket. | `https://pub-xyz.r2.dev` |

### Auth (Google OAuth)
Required for "Login with Google".
| Name | Description |
| :--- | :--- |
| `GOOGLE_CLIENT_ID` | Client ID from Google Cloud Console. |
| `GOOGLE_CLIENT_SECRET` | Client Secret from Google Cloud Console. |
| `GOOGLE_REDIRECT_URI` | `https://api.guelma.guide/api/v1/auth/google/callback` |

### Payments (Stripe)
Required for Pro Organizer subscriptions.
| Name | Description |
| :--- | :--- |
| `STRIPE_SECRET_KEY` | Secret key starting with `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | For processing async payment notifications. |
| `STRIPE_PRO_PRICE_ID` | The ID of the Pro subscription product in Stripe. |

### Email (Resend)
Used for transactional emails.
| Name | Description | Default |
| :--- | :--- | :--- |
| `RESEND_API_KEY` | API Key from Resend.com. | - |
| `RESEND_FROM_ADDRESS` | Verified sending address. | `Guelma Guide <noreply@guelma.guide>` |

---

## ⚡ Performance & Monitoring

| Name | Description | Default |
| :--- | :--- | :--- |
| `REDIS_URL` | Connection string for Redis. | `redis://localhost:6379/0` |
| `SENTRY_DSN` | Sentry Error Tracking DSN. | - |
| `NEXT_PUBLIC_SENTRY_DSN` | (Client-side) Sentry DSN. | - |
| `REDIS_CACHE_TTL_SECONDS` | How long to cache API responses. | `120` |

## 🛡 Security & Flow Control

| Name | Description | Default |
| :--- | :--- | :--- |
| `RATE_LIMIT_WINDOW_SECONDS` | Time window for rate checks. | `60` |
| `RATE_LIMIT_LOGIN_PER_WINDOW` | Max logins per user per window. | `10` |
| `RATE_LIMIT_REGISTER_PER_WINDOW` | Max registrations per window. | `10` |
| `RATE_LIMIT_AI_PER_WINDOW` | Max AI requests per window. | `30` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Lifecycle of access JWT. | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Lifecycle of refresh JWT. | `7` |
