# 📊 Monitoring & Production Observability

Professional-grade monitoring strategy for GuelmaGuide.

## 📡 1. Real-time Health Monitoring

We use the central `/health` endpoint for automated uptime monitoring.

*   **URL**: `https://api.guelma.guide/health`
*   **Tool Choice**: Better Stack Uptime or UptimeRobot (Free tiers).
*   **Heartbeat**: Configure a 1-minute check interval.
*   **Alerting**: Instant notification via Slack/Discord if the status changes from `ok`.

## 🚨 2. Error Tracking (Sentry)

Sentry is integrated into both Frontend and Backend to catch silent failures.

*   **Frontend**: Tracks hydration mismatches, API timeouts, and JS crashes.
*   **Backend**: Tracks DB deadlock errors, 500 crashes, and AI API failures.
*   **Usage**: Access the Sentry Dashboard for your GuelmaGuide project to see stack traces.

## 📝 3. Logging Strategy

*   **Standard Logs**: Handled by Railway (stdout/stderr).
*   **Audit Trail**: Important actions (approvals, payments) are logged with user context.
*   **Log Retention**: Logs are kept for 7 days on the free tier. For enterprise persistence, consider a Logflare instance.

## 📈 4. Performance & Core Web Vitals

*   **Google Search Console**: Monitor indexing of new places.
*   **Vercel Analytics**: Check LCP (Largest Contentful Paint) for users in different regions of Algeria.
*   **Database optimization**: Keep an eye on slow queries in the Railway Postgres dashboard - index fields like `category` and `theme` in the `places` table.

## 💳 5. Financial Monitoring

*   **Stripe Dashboard**: Monitor subscription growth and recurring revenue (MRR).
*   **AI Budget**: Check Google AI Studio usage regularly to stay within the free tier or budget limits.
