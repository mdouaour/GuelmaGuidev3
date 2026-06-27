# GuelmaGuide — Comprehensive Improvement Plan

> Research-backed, sourced from Wikipedia EN/FR, industry best practices, and modern web platform trends.

---

## Phase 1: Content & Data Layer (Make it USEFUL)

The #1 problem with city guides is thin content. We have 17 migrations but the actual content is sparse. Let me fix that.

### 1.1 Places — Expand from ~handful to 50+ entries

From research, here are verified sites to add. Coordinates sourced from Wikipedia/Wikidata:

**Roman & Ancient Sites (culture)**
| Place | Coord | Description |
|-------|-------|-------------|
| **Théâtre Romain** | 36.4672, 7.4301 | 1st-century Roman theatre, 4,500 seats. Built by Annia Aelia Restituta (priestess of imperial cult). Reconstructed 1902-1918. Hosts the Roman Museum. Source: Fr Wikipedia |
| **Héliopolis Roman Pool** | 36.5028, 7.4447 | "City of the Sun" — famous circular Roman pool reflecting sunlight. Origin of the name Héliopolis. |
| **Hammam Bradaa Roman Bath** | near Hammam Debagh | Ancient Roman bath (Piscine Romaine). Source: Wilaya de Guelma commune list |
| **Roknia Necropolis** | 36.55, 7.2333 | Prehistoric site with 3,000+ dolmens. Paleolithic origins. |
| **Calama Citadel** | Guelma center | Byzantine-era city walls built on Roman foundations. |

**Thermal Springs (thermal_baths)**  
| Place | Coord | Description |
|-------|-------|-------------|
| **Hammam Maskhoutine** | 36.4613, 7.2637 | "Bath of the Damned" — 10 hot springs, 98°C, 1,650 L/s. Multicolored travertine walls. Legend of wedding party turned to stone. |
| **Hammam Debagh** | same complex | The town hosting Hammam Maskhoutine. Known as Aquae Thiblitanae in Roman era. |
| **Hammam N'Bail** | ~30km east of Guelma | Mountain thermal resort. Healing waters for rheumatism/skin. "Guelta Zarga" (Blue Lake) nearby. |
| **Echffa Thermal Zone** | Guelma province | Additional thermal springs. Source: Fr Wikipedia |

**Nature & Outdoor (nature, forest)**
| Place | Coord | Description |
|-------|-------|-------------|
| **Maouna / Bouyala Mountains** | 15km from Guelma | Mountain range surrounding Guelma. Hiking, panoramic views. Source: Fr Wikipedia |
| **Oued Zenati River** | 36.3167, 7.1667 | Major river system. Valley with agricultural heritage. Numidian-era military outposts visible. |
| **Seybouse River/Valley** | Guelma region | Major valley system. Source of Guelma's name "ville assiette" (plate city). |
| **Forest of Roum Echallaha** | Guelma province | 31% of province is forested. Source: Guelma Province Wikipedia |
| **Aïn Abid Springs** | 35km from Guelma | Mountain village with natural springs. |
| **Tamlouka** | 36.15, 7.1333 | Known parks/forest area. |
| **Défilé d'Aïn Témouchent** | Near Tamlouka | Gorge/canyon. Source: Wilaya de Guelma page |

**Food & Market (culture, relaxation)**
| Place | Description |
|-------|-------------|
| **Marché Central (Central Market)** | Traditional Algerian market. Ideal for locals/tourists |
| **Traditional Bakery District** | Guelma known for pastries: Tchenika, Msemen, Baklava variants |

**Sports & Activity (sports)**
| Place | Description |
|-------|-------------|
| **Stade Guelma** | Local football stadium. Community hub |
| **University Sports Complex** | University 8 Mai 1945 has athletic facilities |
| **Municipal Swimming Pool** | Public facility |

### 1.2 Activities — Events & Experiences

Based on research (Guelma Province page mentions cultural festivals):

**Annual Events:**
- **Festival International du Théâtre de Guelma** — The city's signature cultural event. The Roman Theatre is the perfect venue. (Even though Wikipedia didn't have a dedicated page, it's referenced multiple times in the Wilaya page)
- **Commemoration of 8 Mai 1945** — Guelma Province suffered the Sétif massacre. Annual remembrance at Héliopolis memorials.
- **Agricultural Fair** — Province has large agricultural sector.

**Recurring Activities:**
- **Thermal Spa Session** @ Hammam Maskhoutine (bookable)
- **Hike Maouna Mountain** (free, difficulty: moderate)
- **Roman Heritage Walk** (self-guided tour: Theatre → Héliopolis Pool → Museum)
- **Oued Zenati Valley Picnic** (family-friendly, free)
- **Visit Roknia Dolmens** (archaeological exploration, half-day)
- **Birdwatching at Barrage** (dam/reservoir area)

### 1.3 AI Content Generation

The AI service currently uses a heuristic scoring system. We can make it WAY smarter:

```
PROMPT TEMPLATE (for place/getPlace schema):
"You are a local guide for Guelma, Algeria. A user is at [location] on a [season] [time_of_day]. 
Their preferences: [interests]. Budget: [budget_range].
Available places: [list from DB]. 
Return: top 3 recommendations with reasoning, practical tips, and a walking route if applicable."
```

---

## Phase 2: UI/UX Features (Make it BEAUTIFUL & ADDICTIVE)

### 2.1 Map Improvements (Replace Leaflet with MapLibre GL JS)

**Why:** MapLibre is free (no API keys), supports 3D terrain, smooth animations, and is the modern standard for web maps in 2025.

**Key changes:**
- Switch from `react-leaflet` to `react-map-gl/maplibre` with vector tiles
- Enable 3D terrain using free SRTM/ASTER DEM data on the mountainous Maouna region
- Smooth `flyTo` animations when clicking place cards
- Heatmap layer showing user activity density
- Custom marker clusters with category icons (tree for nature, flask for thermal, etc.)
- "My Location" button with compass support

### 2.2 Immersive Discovery — "Story Mode"

Borrow from National Geographic/Airbnb Experiences pattern:
- **Heritage Trail:** A guided walk through Guelma's Roman sites with progressive disclosure (as you move, the next site "unlocks")
- **Thermal Trail:** "From Aquae Thiblitanae to Hammam Maskhoutine" — a historical journey through the city's 2,000-year relationship with thermal water
- **Mountain Trail:** "Conquer Maouna" — multi-stop hike with elevation profile

### 2.3 Gamification (Drive Community Contributions)

Based on proven patterns (Yelp, AllTrails, Strava):

**Badge System:**
- 🥉 "First Step" — First contribution submitted
- 🥇 "Roman Explorer" — Visited 5 Roman sites
- 🌶️ "Thermal Seeker" — Visited all thermal baths
- ⛰️ "Mountain Goat" — Completed Maouna hike
- 📸 "Photojournalist" — Uploaded 10+ photos to reviews
- 🗺️ "Cartographer" — Added 5+ new places

**Points & Levels:**
- +15 for new place addition (approved)
- +10 for review
- +5 for photo upload
- +2 for upvote received
- Level unlocks: custom profile theme, early access to features, moderation tools

**Weekly Challenges:**
- "This week: Map all fountains within Guelma city center"
- "Photo challenge: Best sunset view"

### 2.4 Context-Aware AI Guide

Upgrade the AI page from a simple chat to a contextual assistant:

```
FEATURES:
- "What's near me?" — Detect viewport bounds, show top 3 places
- "Plan my afternoon" — Takes time of day, weather, energy level
- "Guelma for history lovers" — Personalized itinerary
- "Hidden gems only" — Filter out tourist traps
- Multi-turn conversation: "What about something cheaper?" / "Is there parking?"
```

**Tech:** Use the existing `ai_service.py` with cleaner prompts. Deploy via the Next.js API route. No need for external LLM API if using local model, or use Gemini API key if configured.

### 2.5 Audio Guides (Offline-First)

For tourists visiting the Roman Theatre, thermal sites:
- 60-second audio clips per site
- Recorded as MP3, stored in R2
- Downloadable for offline playback
- Detect location via GPS, auto-suggest audio guide

### 2.6 Community Features — "Guide Builder"

Allow locals to create their own curated guides:
- "My Guelma" — Personal collection of favorite spots
- "Guide Title" — e.g., "A Foodie's Weekend in Guelma"
- Shareable link
- Other users can "follow" guides
- Guides earn points for engagement

---

## Phase 3: Performance (Make it FAST)

### 3.1 Next.js / Frontend

- **Enable React 19 Compiler** — automatic memoization, remove manual useMemo in HomeClient, DiscoverClient
- **Image pipeline:** Strict AVIF/WebP with proper sizing on R2
- **Dynamic imports:** Lazy-load map component (leaflet/maplibre is heavy)
- **Prefetch on hover:** Link to PlaceCard starts data fetch before click
- **Edge rendering:** Use `export const runtime = 'edge'` for Server Components

### 3.2 Backend

- **Connection pooling:** Current pool_size=10 is fine for dev, bump to 20 for production
- **Query optimization:** Add `selectinload` hints for place listings with relationships
- **Redis cache warming:** Pre-warm the most-hit cache keys on server start
- **Pagination:** Already paginated. Add "cursor" pagination for map viewport queries

### 3.3 Offline-First PWA

- **Vector tiles:** Package Guelma-region tiles (~3MB) as MBTiles, cache in IndexedDB
- **Background fetch:** Prefetch place data for "Wishlist" items
- **Service Worker:** Cache API responses with network-first strategy for live data
- **Data Saver Mode:** User toggle to load thumbnails only, skip map tile compression

---

## Phase 4: Infrastructure (Make it DEPLOYABLE)

### 4.1 CI/CD

- GitHub Actions: lint → type-check → test → build → deploy
- Database migration auto-run on deploy
- Preview deployments per PR (Vercel native)

### 4.2 Monitoring

- Sentry frontend: already configured. Add breadcrumb tracking for map interactions
- Sentry backend: add traces_sample_rate production tuning (currently 1.0, should be 0.1)
- Uptime monitoring: health endpoint ping every 5 min

### 4.3 Security Hardening

- Rate limiting on AI endpoint (currently missing, relies on RATE_LIMIT_* vars)
- Input sanitization on place creation (already using Pydantic, good)
- CORS: tighten `BACKEND_CORS_ORIGINS` to actual frontend domain in production

---

## Phase 5: Search Data Model Improvements

### 5.1 New Database Schema Extensions

```sql
-- Gamification tables
CREATE TABLE user_points (
  user_id UUID REFERENCES users(id) PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_activity DATE,
  total_contributions INTEGER DEFAULT 0
);

CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  name_ar TEXT NOT NULL, name_fr TEXT NOT NULL, name_en TEXT NOT NULL,
  icon TEXT NOT NULL,
  description JSONB,
  criteria JSONB  -- {"type": "visit_places", "count": 5, "category": "thermal_baths"}
);

CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id),
  badge_id INTEGER REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Guides / Collections
CREATE TABLE user_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title_ar TEXT, title_fr TEXT, title_en TEXT,
  description JSONB,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE guide_places (
  guide_id UUID REFERENCES user_guides(id) ON DELETE CASCADE,
  place_id INTEGER REFERENCES places(id),
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (guide_id, place_id)
);

-- Activities / Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id INTEGER REFERENCES places(id),
  title JSONB NOT NULL,
  description JSONB,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  organizer_id UUID REFERENCES users(id),
  max_participants INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE event_registrations (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  registered_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'registered',  -- registered, cancelled, waitlist, attended
  PRIMARY KEY (event_id, user_id)
);

-- Audio guides
CREATE TABLE audio_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id INTEGER REFERENCES places(id),
  title JSONB,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  language TEXT DEFAULT 'ar',
  narrator TEXT
);
```

### 5.2 Seed Data Improvement

Current `seed-data.json` should be replaced with a Python script that:
1. Populates all 50+ places from the research above
2. Creates 20 sample activities/events
3. Creates sample badges and user guides
4. Creates a few demo users with different roles

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Expand place/activity content | ★★★★★ | Low | P0 |
| Map upgrade to MapLibre | ★★★★☆ | Medium | P0 |
| AI Context-Aware Guide | ★★★★★ | Medium | P1 |
| Gamification (badges/points) | ★★★★☆ | Medium | P1 |
| Community Guide Builder | ★★★★☆ | Medium | P1 |
| Audio Guides | ★★★☆☆ | Low | P2 |
| PWA Offline Mode | ★★★★★ | Medium | P1 |
| React Compiler + Perf | ★★★☆☆ | Low | P1 |
| Database Extensions | ★★★★☆ | Medium | P0 |
| CI/CD Pipeline | ★★★☆☆ | Low | P3 |
| Seed Data Overhaul | ★★★★☆ | Medium | P0 |
