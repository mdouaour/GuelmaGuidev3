# GuelmaGuide System Architecture & Implementation Logic

This document provides a deep dive into the technical design, security choices, and the philosophy behind GuelmaGuide.

## 1. The "Big Picture": How Everything Works Together

GuelmaGuide is designed as a **decoupled full-stack application**. 

- **The Brain (Backend)**: A Python/FastAPI service handles the heavy lifting—database relations, point calculations, and activity moderation. It exposes a REST API.
- **The Bridge (Next.js Proxy)**: The frontend doesn't talk directly to the Python backend to avoid CORS issues and sensitive header exposure. Instead, Next.js **Route Handlers** (`src/app/api/...`) act as a secure proxy.
- **The Face (Frontend)**: A React-based SPA built with Next.js 15, optimized for speed with Server-Side Rendering (SSR) for SEO and Client-Side Hydration for interactivity.

### Logic Flow for a Typical User Interaction:
1. **Discovery**: User scrolls the map. Next.js fetches places via SSR for the initial load, then uses `client-side fetches` as the user filters.
2. **Contribution**: User suggests a place. The request goes to `/api/places`, which adds a `JWT` and `CSRF token` before sending it to the internal backend.
3. **Evolution**: Once an Admin approves the place, two things happen:
   - The place status changes from `pending` to `approved` (Database update).
   - The user who suggested it receives `+50 points` (Gamification logic).

---

## 2. Technology Choices: The "Why"

- **Next.js 15 + App Router**: Chosen for its superior SEO capabilities (critical for a tourism site) and its seamless integration of Server and Client components.
- **Tailwind CSS v4**: Provides a utility-first approach that ensures the UI is consistent without writing thousands of lines of custom CSS. It allows for "Architectural Honesty"—what you see in the code is what you get on the screen.
- **JWT + HTTP-Only Cookies**: We use cookies instead of LocalStorage to prevent XSS attacks. By setting `HttpOnly` and `SameSite: Strict`, we ensure the session cannot be stolen by malicious scripts.
- **Gemini AI**: Used not as a chatbot, but as a "Guided Intelligence". It analyzes the history of Guelma to provide accurate, non-hallucinated recommendations.

---

## 3. Security Architecture: The "Fortress" Approach

### A. Authentication
We implement a **Silent Refresh** strategy. The access token is stored in memory, while the refresh token is in a secure cookie. This prevents the "token theft" vulnerability common in simple JWT implementations.

### B. CSRF Protection
Every POST/PATCH request is guarded by a dynamic CSRF token. This prevents "Cross-Site Request Forgery" where a malicious site could trick an authenticated user into performing actions like deleting their account or modifying a place.

### C. Role-Based Access Control (RBAC)
Our middleware checks permissions at the entry point:
- `Visitor`: Read-only + Suggest Place.
- `Organizer`: All Visitor perks + Create Activities + Analytics.
- `Admin`: All Organizer perks + Approval Authority + Global Stats.

---

## 4. Gamification & Community Evolution

The project is built on the principle of **Incentivized Crowdsourcing**.

| Action | Points | Impact |
| :--- | :--- | :--- |
| Suggest a Place | +50 | Grows the map database. |
| Host an Activity | +20 | Increases community engagement. |
| Verify Account | +10 | Ensures data quality. |

**The Leaderboard** serves as a social proofing mechanism, encouraging locals to compete for the "Guardian of Guelma" title.

---

## 5. Monetization & Future Scaling

- **Partner Ads Space**: A dedicated area in the community section for local businesses (cafés, hotels, thermal baths) to promote their services.
- **Pro Organizer Tiers**: Professional guides can pay a subscription (Stripe integration) to list unlimited paid activities.
- **AI Personalization**: Future evolution will include "Smart Itineraries" based on user points and interests.
