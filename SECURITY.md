# Security & Authentication Guide

GuelmaGuide follows a "Secure by Design" philosophy to protect both the city's heritage data and the user's personal information.

## 1. Authentication Layer
We use **Stateful JWT** authentication.

- **Tokens**:
  - `Access Token`: Short-lived (15 mins). Stored in memory.
  - `Refresh Token`: Long-lived (7 days). Stored in a **Secure, HttpOnly, SameSite=Strict Cookie**.
- **Silent Refresh**: The frontend automatically calls `/api/auth/refresh` when the access token expires, ensuring a seamless user experience while keeping tokens safe from XSS.

## 2. API Protection (CSRF)
To prevent Cross-Site Request Forgery, we implement a **Double-Submit Cookie Pattern**.

1. On login/bootstrap, a `_csrf` cookie is set.
2. The frontend reads this token (via a secure helper) and includes it in the `X-CSRF-Token` header for all state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).
3. The backend verifies that the header matches the cookie secret.

## 3. Role-Based Access Control (RBAC)
Permission is enforced at the Router level and the Database level.

| Role | Permissions |
| :--- | :--- |
| **Visitor** | Read places, Search, Suggest new places. |
| **Organizer** | Create Activities, View Analytics for their events. |
| **Admin** | Moderation Dashboard, User Management, Global Systems. |

## 4. Input Validation
- **Frontend**: Zod-based validation for all forms.
- **Backend**: Pydantic models (FastAPI) ensure that only strictly defined fields reach the database.
- **Sanitization**: All user-generated text (Descriptions, Suggestions) is sanitized to prevent SQL injection and HTML injection.

## 5. Privacy (PII)
- Emails are encrypted at rest where required.
- User avatars are hosted specifically on a secure CDN.
- Password hashing is performed using **Argon2** or **BCrypt**.

## 🛡 Security Best Practices
1. **No Client-Side Secrets**: All API keys (Stripe, Gemini, R2) are stored as server-side environment variables.
2. **HTTPS Only**: The application strictly refuses connections over plain HTTP in production.
3. **Database Isolation**: The database is hosted in a private VPC, only accessible from the Application Server.
