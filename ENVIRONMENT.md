# 🌍 Global Environment System

GuelmaGuide uses a strictly partitioned environment system to ensure security and scalability.

## 👥 Responsibility Mapping

| Service | Responsibility | Master Key Location |
| :--- | :--- | :--- |
| **Frontend** | UI, SEO, AI Bridge, Localisation | Vercel Environment |
| **Backend** | Business Logic, CRUD, Auth Verify, Background Jobs | Railway Variables |
| **CI/CD** | Automated Sync and Deployment | GitHub Action Secrets |

---

## 🔑 Variable Definition

### Required Core (Critical)
| Name | Configured In | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | Railway | Postgres connection string. |
| `JWT_SECRET_KEY` | Vercel & Railway | Must match to share sessions between proxy and backend. |
| `NEXT_PUBLIC_APP_URL` | Vercel | Used for sitemaps and SEO absolute paths. |
| `API_BASE_URL` | Vercel | The server-side proxy target. |

### Third-Party Integrations
| Name | Service | Impact |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_GEMINI_API_KEY` | AI Studio | Enables the "AI Guide" assistant. |
| `R2_SECRET_ACCESS_KEY` | Cloudflare | Enables high-res image uploads. |
| `STRIPE_SECRET_KEY` | Stripe | Enables "Pro Organizer" payments. |
| `GOOGLE_CLIENT_ID` | Google Cloud | Enables one-click social login. |

### Observability & Security
| Name | Default | Role |
| :--- | :--- | :--- |
| `SENTRY_DSN` | None | Real-time crash reporting. |
| `REDIS_URL` | None | Enables async background tasks (arq). |
| `RATE_LIMIT_AI` | 30 | Prevents AI budget exhaustion. |

---

## 🛡 Security Rules
1. **Never** prefix sensitive tokens (Stripe, R2, JWT) with `NEXT_PUBLIC_`.
2. **Never** commit `.env` or `.env.production` files.
3. Use the `openssl rand -base64 32` command to generate the `JWT_SECRET_KEY` during initial setup.
