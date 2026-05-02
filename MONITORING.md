# 📊 Monitoring & SaaS Observability

GuelmaGuide follows a "Proactive Detection" strategy to identify issues before users report them.

## 🕒 1. Uptime Monitoring
We use external pings to monitor the heartbeat of the platform.
- **Target**: `https://api.guelma.guide/health`
- **Tool**: Better Stack or UptimeRobot.
- **Frequency**: Every 60 seconds.
- **Alerting**: SMS/Slack alerts triggered if response time > 2000ms or status code !== 200.

## 🚨 2. Error Tracking (Sentry)
Sentry is our primary tool for debugging production crashes without requiring user screen-recordings.
- **Frontend Errors**: Captured via `@sentry/nextjs`. Tracks hydration issues and API failures.
- **Backend Errors**: Captured via `sentry-sdk`. Tracks DB deadlocks and logic errors.
- **Alert Strategy**: Major errors trigger a Slack notification; minor warnings are reviewed weekly.

## 📝 3. Logging Strategy
- **Backend**: Python logs are streamed to Railway. Standard `LOG_LEVEL` is set to `INFO`.
- **Worker**: arq job logs track background tasks (image optimization, email sending).
- **Searchable Logs**: For advanced auditing, connect Railway logs to Axiom or Logflare.

## 🚀 4. Performance Metrics
- **Core Web Vitals**: Monitored via Vercel Analytics. Focus on **LCP** (Largest Contentful Paint) for users on regional mobile networks.
- **Slowest Queries**: Monitored in the Railway Postgres dashboard. Every query taking > 100ms should be analyzed for missing indexes.

## 🛡 5. Security Monitoring
- **Failed Login Spikes**: Monitored via Redis-based rate limiting logs. High spikes on `/api/auth/login` trigger temporary IP bans.
- **Gemini Usage**: Monitor the AI Studio billing console to ensure tokens aren't being exhausted by automated scrapers.
