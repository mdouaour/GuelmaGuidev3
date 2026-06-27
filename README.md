# GuelmaGuide

> **Hyper-local. Community-driven. AI-powered city guide for Guelma, Algeria.**

GuelmaGuide is a living digital heritage platform that empowers citizens and tourists to explore the hidden gems of Guelma—from the ancient Roman Theater to the boiling springs of Hammam Debagh.

## Key Features
- **Discovery Map**: Interactive view of landmarks, parks, and restaurants.
- **AI Guide**: Personalized tour recommendations powered by Google Gemini.
- **Community Contributions**: Suggest new places and earn contribution points.
- **Activities**: Join hikes, workshops, and guided tours organized by locals.
- **Multilingual**: Native support for **Arabic** (default), **French**, and **English**.
- **Admin Excellence**: Robust moderation tools to ensure high-quality content.

## Tech Stack
- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, Motion.
- **Backend**: Python 3.14 (FastAPI), SQLAlchemy, Alembic.
- **Database**: PostgreSQL (primary), Redis (caching + background jobs via ARQ).
- **AI**: Google Gemini (via @google/genai).
- **Security**: JWT (HttpOnly Cookies) + Double-Submit CSRF.

## Quick Setup

### Prerequisites
- Node.js 20+, npm
- Python 3.12+
- PostgreSQL 16+ running on localhost:5432
- Redis (optional, for caching)

### 1. Clone and install dependencies
```bash
git clone <repo-url>
cd guelma-guide
npm install              # frontend dependencies
cd backend
python3 -m venv .venv   # create virtual environment
source .venv/bin/activate
pip install -r requirements.txt  # backend dependencies
```

### 2. Setup environment
```bash
cp .env.example .env     # frontend env (edit as needed)
cp .env.example backend/.env  # backend env (edit as needed)
```

### 3. Database setup
```bash
# Start PostgreSQL (if not running)
sudo systemctl start postgresql

# Run migrations
cd backend
python3 -m alembic upgrade head

# Seed demo data
python3 scripts/seed_demo_data.py
```

### 4. Start development servers
```bash
# Terminal 1: Backend API
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
cd guelma-guide
npm run dev -- -p 3003
```

The app is now running at **http://localhost:3003**.

### Quick Test (Demo Account)
- **Email**: `demo.organizer@guelma.guide`
- **Password**: `DemoOrganizer123!`

### Using Docker Compose (Alternative)
```bash
docker compose up -d    # starts PostgreSQL + Redis + API
# Then start the frontend separately: npm run dev
```

## Project Structure
```
guelma-guide/
├── src/                # Next.js frontend
│   ├── app/            # App Router pages + API routes
│   ├── components/     # React components
│   ├── context/        # React context providers
│   ├── lib/            # Utilities (api, csrf, localization)
│   └── i18n/           # next-intl config
├── messages/           # Translation files (ar, en, fr)
├── backend/
│   ├── app/            # FastAPI backend
│   │   ├── api/        # Route handlers
│   │   ├── models/     # SQLAlchemy models
│   │   ├── schemas/    # Pydantic schemas
│   │   └── services/   # Business logic
│   ├── alembic/        # Database migrations
│   └── scripts/        # Utility scripts (seed data)
└── docker-compose.yml  # Infrastructure services
```

## API Architecture
- **Public data** (`/api/v1/places`, `/api/v1/activities`) → direct backend calls
- **Auth-protected** (`/api/auth/*`, `/api/wishlists/*`) → proxied through Next.js for cookie handling
- **CSRF protection** on all state-mutating requests (POST, PATCH, DELETE)

---
*Built for the community of Guelma. Preserving and promoting Algerian heritage.*
