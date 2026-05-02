# Environment Variables Guide

GuelmaGuide uses environment variables to manage configuration across different services (Frontend, Backend, Database, AI).

## 🌍 Core Services

### Frontend (Next.js)
Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

| Name | Location | Description | Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | UI, SEO | The public URL of the platform. Used for sitemaps and absolute links. | `https://guelma.guide` |
| `NEXT_PUBLIC_API_BASE_URL` | API Client | The public API endpoint used by the client to fetch data. | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | AI Guide | (Optional) API key for calling Gemini directly from the client. | `AIzaSy...` |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Visuals | The public CDN URL for images stored in R2. | `https://pub-xyz.r2.dev` |

### Backend (FastAPI) & Middleware
These variables are server-side only and should **NEVER** be exposed to the browser.

| Name | Location | Description | Example |
| :--- | :--- | :--- | :--- |
| `API_BASE_URL` | Proxy | The server-side URL of the Python backend. | `http://backend:8000/api/v1` |
| `DATABASE_URL` | DB Client | PostgreSQL connection string. | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET_KEY` | Auth | Key used to sign and verify session tokens. | `at_least_32_chars_long_random_string` |
| `REDIS_URL` | Cache | Connection string for Redis (Caching & Rate Limiting). | `redis://localhost:6379/0` |
| `GEMINI_API_KEY` | AI Engine | Server-side key for advanced AI processing. | `AIzaSy...` |

## 🛡 Security & Rate Limiting

| Name | Default | Description |
| :--- | :--- | :--- |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Time window for rate limit checks. |
| `RATE_LIMIT_LOGIN_PER_WINDOW` | `10` | Max login attempts per user/IP. |
| `RATE_LIMIT_AI_PER_WINDOW` | `30` | Max AI recommendation requests per window. |

## 📦 Third-Party Integrations

### Storage (Cloudflare R2)
Used for hosting high-resolution images of historical sites.
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

### Payments (Stripe)
Used for "Pro Organizer" subscriptions and ticketed activities.
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Email (Resend)
Used for transactional emails like password resets and email verification.
- `RESEND_API_KEY`
- `RESEND_FROM_ADDRESS` (e.g., `Guelma Guide <noreply@guelma.guide>`)

### Error Tracking (Sentry)
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`

---

## 🚀 Setup Instructions
1. Copy `.env.example` to `.env`.
2. Replace the placeholder values with your actual credentials.
3. Restart the development server: `npm run dev`.
