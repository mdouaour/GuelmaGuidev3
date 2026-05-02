# GuelmaGuide 🌿

> **Hyper-local. Community-driven. AI-powered city guide for Guelma, Algeria.**

GuelmaGuide is a living digital heritage platform that empowers citizens and tourists to explore the hidden gems of Guelma—from the ancient Roman Theater to the boiling springs of Hammam Debagh.

## ✨ Key Features
- **Discovery Map**: Interactive view of landmarks, parks, and restaurants.
- **AI Guide**: Personalized tour recommendations powered by Google Gemini.
- **Community Contributions**: Suggest new places and earn **Contribution Points**.
- **Activities**: Join hikes, workshops, and guided tours organized by locals.
- **Multilingual**: Native support for **Arabic**, **French**, and **English**.
- **Admin Excellence**: Robust moderation tools to ensure high-quality content.

## 🛠 Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Motion.
- **Backend**: Python (FastAPI), SQLAlchemy, Alembic.
- **Database**: PostgreSQL (Relational data), Redis (Caching).
- **AI**: Google Gemini Pro (via @google/genai).
- **Security**: JWT (HttpOnly Cookies) + Double-Submit CSRF.

## 🚀 Quick Setup
1. **Clone the Repo** and install dependencies: `npm install`.
2. **Setup Environment**: Copy `.env.example` to `.env` and add your keys.
3. **Seed the Map**: Run `npm run seed` (or use the provided `seed-data.json`).
4. **Dev Mode**: `npm run dev`.

## 📖 In-Depth Documentation
- [Architecture & Philosphy](./ARCHITECTURE.md)
- [Complete Deployment Guide](./DEPLOYMENT.md)
- [Data Model & Entities](./DATA_MODEL.md)
- [Security Implementation](./SECURITY.md)
- [Environment Variables](./ENVIRONMENT.md)
- [Evolution Roadmap](./ROADMAP.md)

---
*Built with ❤️ for the community of Guelma. Join us in preserving and promoting Algerian heritage.*
