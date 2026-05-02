# GuelmaGuide Monitoring & Maintenance

Guidelines for keeping the Guelma platform healthy and fast.

## 1. Application Performance Monitoring (APM)

### Sentry Integration
We recommend using Sentry for error tracking.
- Set `NEXT_PUBLIC_SENTRY_DSN` in your environment.
- This will catch:
  - React hydration errors.
  - API request failures.
  - JSON parsing errors in i18n files.

### Redis Caching
The backend uses Redis for caching place lists and AI recommendations.
- Monitor `REDIS_URL` connectivity.
- Cache TTL is set to 120 seconds by default for high-traffic lists.

## 2. API Health Checks

The following endpoints should be monitored for latency:
- `GET /api/v1/places`: Core discovery endpoint.
- `GET /api/v1/activities`: Core activities endpoint.
- `GET /api/v1/auth/me`: Verifies the authentication bridge.

## 3. Database Maintenance

### Points & Leaderboards
Contribution points are updated during Admin approval. Periodically check for "orphan" points if an activity or place is deleted without a cleanup script.

### Image Storage (R2)
- Check usage limits of your R2 bucket.
- High-resolution images should be optimized before upload. The current `ImageUpload` component handles basic uploads but does not resize client-side.

## 4. Log Analysis

Use CloudWatch or Google Cloud Logs to search for:
- `401 Unauthorized`: Sudden spike might indicate a broken silent refresh flow.
- `429 Too Many Requests`: Rate limits being hit by crawlers or malicious actors.
- `500 Server Error`: Payloads failing validation on the backend.

## 5. Gamification Integrity
Ensure points are not being "scraped" by users suggesting duplicates. Admins should use the **Places** tab in the dashboard to check for existing landmarks before approving new ones.
