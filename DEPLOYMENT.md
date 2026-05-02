# 🚀 SaaS-Grade Production Deployment Guide

This guide ensures reliable, zero-risk deployments for the GuelmaGuide platform.

## 🏗 Multi-Environment Architecture

| Environment | Branch | API URL | Frontend URL |
| :--- | :--- | :--- | :--- |
| **Development** | local | `localhost:8000` | `localhost:3000` |
| **Staging** | `staging` | `api-staging.guelma.guide` | `staging.guelma.guide` |
| **Production** | `main` | `api.guelma.guide` | `guelma.guide` |

---

## 🛠 Step 1: Initial Infrastructure Setup

Before running the CI/CD pipeline, ensure the following are created:

1.  **Railway**: Create two services: `guelma-api` (Prod) and `guelma-api-staging` (Staging).
2.  **Vercel**: Link your repository to a Vercel project.
3.  **Postgres**: Ensure separate databases are configured for staging and production.
4.  **Google Cloud**: Configure OAuth credentials with both staging and production redirect URIs.

---

## 🔑 Step 2: Secret Management

Add these secrets to **GitHub Repository Settings > Secrets and variables > Actions**:

| Secret Key | Description |
| :--- | :--- |
| `VERCEL_TOKEN` | Required for automated frontend deployments. |
| `RAILWAY_TOKEN` | Required for automated backend deployments. |
| `DATABASE_URL` | Production Postgres connection string. |
| `JWT_SECRET_KEY` | Secret for auth tokens (Min 32 characters). |

---

## 🚀 Step 3: Deployment Pipeline

Our automated pipeline (`deploy.yml`) performs the following safety checks:

1.  **Secret Audit**: Verifies all required keys exist before starting.
2.  **Backend Integrity**: Compiles Python source and runs full test suite.
3.  **Frontend Validation**: Verifies Next.js project compiles without errors.
4.  **Deploy (Backend)**: Pushes to Railway.
5.  **Health Check**: Pings `/health` up to 3 times with a backoff delay.
6.  **Deploy (Frontend)**: Uses the Vercel `--prebuilt` strategy for ultra-reliable pushes.

---

## 🔁 Step 4: Crisis Management (Rollbacks)

### 🚨 Automation Safety
If the **Health Check** or **Migrations** step fails, the pipeline stops immediately. This prevents the frontend from updating, effectively shielding users from a broken backend.

### 🛠 Manual Rollback
*   **Backend (Railway)**: Visit the service board, go to "Settings" > "Deployments", and click **Rollback** on the last stable build.
*   **Frontend (Vercel)**: Navigate to the "Deployments" tab and select the last production build to **Redeploy**.

---

## 📉 Troubleshooting

*   **Pipeline fails at "Secret Audit"**: Check your GitHub Secrets. Look for typos or missing values.
*   **Health Check Timeout**: The backend may be cold-starting. The pipeline will retry 3 times automatically. If it still fails, check Railway logs for `ModuleNotFoundError` or DB connection timeouts.
*   **Build failure**: Ensure `package-lock.json` and `requirements.txt` are up to date.
