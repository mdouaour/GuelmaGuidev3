# 📊 Product Monitoring & Health Strategy

We prioritize "Zero-Cost Observability" using tools that provide generous free tiers for growing community platforms.

## 1. Error Tracking (Sentry)
The platform is pre-configured with `@sentry/nextjs` and Python Sentry SDK.
*   **Frontend**: Tracks hydration errors and slow API calls.
*   **Backend**: Tracks DB connection timeouts and logic crashes.
*   **Trigger**: Alerts are sent to the admin email when 5+ users experience the same error.

## 2. Infrastructure Health (Railway)
*   **Endpoint**: `/health`.
*   **Checks**: 
    - Database connectivity.
    - Redis connectivity.
    - arq task queue status.
*   **Logging**: Use `BACKEND_LOG_LEVEL=info` in production. Avoid `debug` in prod to save storage space.

## 3. SEO & Traffic
*   **Google Search Console**: Monitor how Guelma landmarks rank in regional searches.
*   **Vercel Analytics**: Track Core Web Vitals (LCP, FID) to ensure the experience is fast on low-bandwidth mobile networks (Algerie Telecom/4G).

## 4. AI Budget Monitoring
*   **Limiting**: The `RATE_LIMIT_AI_PER_WINDOW` env variable prevents automated scraping of the AI Guide which could exhaust your Gemini API credits.
*   **Logging**: All AI responses are logged (without PII) to audit for hallucinations or inappropriate suggestions.

## 5. Security Audits
*   **JWT Revocation**: If a security breach occurs, change the `JWT_SECRET_KEY` in the environment variables and redeploy. This will instantly log out all active sessions globally.
