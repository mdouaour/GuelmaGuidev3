# Deployment Guide: From Source to Production

This guide covers the end-to-end deployment of GuelmaGuide, explaining how each piece (Database, Backend, Frontend) fits together.

## 1. Database Setup (PostgreSQL)

You need a PostgreSQL database. We recommend **Railway** or **Neon** for a quick start.

### Using Railway:
1. Go to [Railway.app](https://railway.app).
2. Click **New Project** > **Provision PostgreSQL**.
3. Once created, go to the **Variables** tab and copy the `DATABASE_URL`. It usually looks like: `postgresql://postgres:password@host:port/railway`.

### Seeding the Initial Data:
The file `seed-data.json` contains the foundational landmarks. You should import these into your `places` table.
1. Access your database via a tool like **DBeaver** or **pgAdmin**.
2. Run the migration scripts (found in the backend repository) to create the schema.
3. Use a manual script or the built-in "Suggest a Place" feature to populate the initial entries using the JSON data.

---

## 2. Backend Deployment (FastAPI)

If you are running your own backend instance:
1. Ensure the `DATABASE_URL` is set in the backend environment.
2. The backend should be accessible via a public URL (e.g., `https://api.guelma.guide`).
3. Set `JWT_SECRET_KEY` and `CORS_ORIGINS`.

---

## 3. Frontend Deployment (Vercel or Cloud Run)

### Using Vercel (Recommended for Next.js):
1. Push your code to a GitHub repository.
2. Connect the repository to [Vercel](https://vercel.com).
3. **Important**: Add all environment variables in the Vercel Dashboard.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Your public site URL | `https://guelma.guide` |
| `API_BASE_URL` | The internal Python API | `https://api.guelma.guide` |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Your AI Studio Key | `AIzaSy...` |
| `JWT_SECRET_KEY` | Must match the backend key | `your-secret-here` |

### Using Cloud Run (AI Studio Standard):
1. Run `gcloud builds submit --tag gcr.io/[PROJECT_ID]/guelma-guide`.
2. Deploy using `gcloud run deploy ...` as shown in the previous steps.

---

## 4. How Everything Connects (Step-by-Step)

1. **User enters the site**: Next.js detects the locale (e.g., `/ar`) and serves the cached layout.
2. **Data hydration**: `getPlaces` is called. It triggers an internal fetch to `API_BASE_URL/v1/places`.
3. **AI Recommendations**: If the user asks the AI Guide, the browser calls Gemini Directly using `NEXT_PUBLIC_GEMINI_API_KEY`.
4. **Member Auth**: When logging in, the browser receives an `HttpOnly` cookie. This cookie is automatically attached to any subsequent fetch requests by the browser. The Next.js proxy forwards this cookie to the backend to verify the session.

---

## 5. Post-Launch Checklist

- [ ] Check `robots.txt` and `sitemap.xml` (visit `/sitemap.xml`).
- [ ] Verify that Google Login popup works (Ensure `NEXT_PUBLIC_APP_URL` is listed in Google Cloud Console's authorized domains).
- [ ] Test the "Suggest Place" flow as a regular user to ensure the point awarding logic triggers correctly on approval.
- [ ] Check the **Partner Ads** space in the Community tab to see if the contact form sends feedback correctly.
