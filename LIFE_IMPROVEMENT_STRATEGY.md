# GuelmaGuide — Life Improvement Strategy

> Problem: People in Guelma are bored, stressed, don't know what to do / where to go / with who.
> Solution: Transform GuelmaGuide from a "map with pins" into a **life quality platform** that creates real connections, experiences, and spontaneous social opportunities.

---

## The Core Problem Statement

Research shows the biggest barriers to quality of life for people in mid-sized cities like Guelma are:

1. **"I'm bored on a Friday night"** — no awareness of what's happening NOW
2. **"I don't know anyone new"** — social circles are closed, hard to make new friends
3. **"I'm stressed but don't have time for a spa day"** — need micro-breaks close to home
4. **"Tourists come and leave, nothing stays"** — no connection between visitors and locals
5. **"Young people have nothing to do so they leave"** — brain drain from the city

GuelmaGuide can solve ALL of these. Here's how.

---

## Feature Set: 10 New Systems

### 1. "What's Happening NOW" (Live Feed)

Not a static activities list — a **real-time pulse** of the city.

```
UI: Scrollable feed showing:
- Someone just started a hike at Maouna (3 people going)
- Thermal bath session starting in 30 min at Hammam Maskhoutine
- Coffee meetup happening RIGHT NOW at Café Central
- New place was just added by a local
- Sarah just earned "Mountain Goat" badge

Technical:
- WebSocket or SSE for real-time updates
- ARQ background worker polls for upcoming events and pushes notifications
- "Live" indicator on activity cards when < 30 min to start
```

**Solves:** "I'm bored" — instant awareness of current opportunities.

---

### 2. "Mood-Based Discovery" (De Stress Matchmaker)

People in Guelma often don't know WHAT they want — they just know how they FEEL.

```
UI: Beautiful picker screen:
- "I'm STRESSED" → suggests: thermal bath session, picnic by Oued Zenati, 
  meditation walk at Héliopolis, coffee at a quiet café
- "I'm BORED & ALONE" → suggests: social activities happening today, 
  community events, open-invite group walks
- "I want to MEET PEOPLE" → suggests: group hikes, cooking class meetups, 
  photography walks, game nights
- "I want ADVENTURE" → suggests: Maouna summit attempt, 
  explore Roknia dolmens, day trip to Annaba coast
- "I'm with KIDS" → suggests: picnic areas, pool, safe parks
- "I need PEACE" → suggests: quiet viewpoints, early morning spots,
  low-traffic thermal hours

Algorithm: Match time of day + weather + user history + proximity
```

**Solves:** Decision fatigue — takes feelings, not queries.

---

### 3. "Social Roulette" / "Find Your Crew"

Solve the fundamental social problem: "I want to do something with people but I don't know who."

```
Concept: "Join as solo" → matched with others for small-group activities

Flow:
1. User sees "3 people want to hike Maouna this Saturday at 8am"
2. User clicks "Join as solo"
3. Matched into a group of 4-6 people who also joined solo
4. Everyone gets a "Meetup Point" with organizer contact
5. After the meetup: mutual gamification points + option to "stay connected"
6. Users earn "Connector" badge for each unique co-participant

Matching criteria:
- Same general area (neighborhood level)
- Activity preference overlap
- Availability window
- Optional: age range preference for young professional groups

Privacy: Only reveal names AFTER user confirms joining. Profile photos optional.
Phone number never shared — in-app messaging for coordination.
```

**Solves:** "I don't have anyone to go with" — removes the social barrier entirely.

---

### 4. "Micro-Adventures" (Spontaneous Local Experiences)

Not every experience needs to be a big planned event. Adrenaline/dopamine from small surprises.

```
Spontaneous generator:
- "Surprise me with something within 5km" → random curated spot
- "15-minute adventure" → quick local discovery (hidden viewpoints, 
  street art, interesting architecture, local food stall)
- "2-hour escape" → half-day excursion with narrative (the Roman ring route)
- "Sunset spot near you" → AI picks the best current viewpoint based on time

Gamification:
- Each completed micro-adventure = points + "Story" added to profile
- Streak: 5 days of micro-adventures = "Daily Explorer" bonus
- Competitive: Leaderboard of most creative micro-adventures this week

Content (based on research):
- "The Roman Ring" — Theatre → Héliopolis Pool → Old Town → Museum (45 min walk)
- "Thermal Trail" — Hammam Maskhoutine → Hammam N'Bail → Aïn Abid (day trip)
- "Mountain & Me" — 3 marked trails on Maouna with difficulty levels
- "Guelma After Dark" — illuminated Roman sites + café culture
- "Dolmens & Legends" — Roknia necropolis storytelling walk
```

**Solves:** "There's nothing to do" — reveals how much is actually there.

---

### 5. "Local Legends" (Knowledge Exchange Platform)

Combine cultural preservation with social connection. Locals become guides.

```
Concept: "Skill share" marketplace for Guelma's community

Offerings a local could provide:
- "I'll show you the best viewpoints for sunset photography" (2 hrs)
- "I'll teach you how to make Fatira (Guelma's traditional dish)" 
- "I'll guide you through the Roman museum's hidden gems"
- "I'll take you birdwatching at the dam"
- "I'll teach you basic Tamazight phrases and their history"

Economy:
- Points-based: earn by giving, redeem for other experiences
- OR free: gamification rewards (badge "Mentor", leaderboard)
- Pro tier: pay locals a small fee (in DZD, via baridimob or cash)

Content based on research:
- Guelma's Roman history (Calama → Guelma continuity)
- Thermal water heritage (Roman → Ottoman → Modern)
- Dolmens of Roknia (4,000+ years old, 3,000+ structures)
- Traditional cuisine workshops (tchenika, msemen, harira)
- Maouna mountain ecology (Atlas cedar, endemic species)
```

**Solves:** AND creates income/recognition for locals. Preserves heritage.

---

### 6. "Wellness Moments" (Daily Stress Relief)

Integrate wellness into daily life — not a separate category, but woven through.

```
Daily "Pausa Guelma" feature:
- Morning: "Today's thermal water moment" → suggested breathing exercise 
  at a hot spring (the heat + minerals = natural stress relief)
- Midday: "Quick escape" → nearest quiet spot within 2km 
  (detected from map viewport)
- Evening: "Wind down" → sunset viewpoint + ambient sounds
- Weekly: "Community restoration" → group session at a thermal bath

UI: Beautiful full-screen card with timer + guided audio
- 2-minute breathwork
- 5-minute visualization at Roman ruins
- 10-minute gratitude journal at Héliopolis

Data: Track mood before/after → "This week you reduced stress by 40%"
```

**Solves:** Chronic stress — makes wellness accessible without planning.

---

### 7. "Weekend W together" (Instant Group Events)

The #1 question on Friday afternoon in Guelma: "What are we doing this weekend?"

```
Concept: Crowd-sourced weekend plans with "commitment levels"

How it works:
1. User proposes: "Saturday morning hike at Maouna, 9am"
2. Others click "Interested" (soft) or "I'm in" (hard commit)
3. When threshold reached (e.g., 6 people), event auto-confirms
4. Notification: "Maouna hike confirmed for Saturday! 6 people going."
5. Day-of: live tracking, safety check-in, photo sharing

Categories:
- Active: hiking, swimming, sports
- Social: picnic, café meetup, shared meal
- Cultural: museum visit, heritage walk, photography
- Learning: workshop, skill share, language exchange
- Food: restaurant hopping, market tour, cooking together

Anti-flake:
- "No-show" penalty: lose reputation points
- "Reliable" badge: attend 10+ planned events
- "Supporter" boost: events with high attendance get more visibility
```

**Solves:** "What to do this weekend" + "I can't find people to go with"

---

### 8. "PhotoWalks" (Collaborative Exploration)

Photography is the #1 smartphone activity in Algeria. Turn city exploration into a game.

```
Concept: Themed photo challenges that reveal Guelma's hidden beauty

Weekly challenges:
- "Hidden doorways of Guelma" — architectural detail hunt
- "Golden hour at the theatre" — best sunset shot at Roman ruins
- "Faces of Oued Zenati" — documentary photography challenge
- "Thermal colors" — capture the mineral formations at Hammam Maskhoutine
- "Above Guelma" — rooftop/panoramic views from Maouna

Submission:
- Users submit photos with geotag
- Community votes (upvotes, not comments — reduce toxicity)
- Winning photo becomes official "card image" for that place
- Creator gets credit + badge

Social:
- Group photo walks: "Meet at Théâtre Romain at sunset, we'll shoot together"
- Photo assignments for each landmark (guided photography)
```

**Solves:** Boredom + self-expression. Makes the city "Instagrammable" → tourism + user content generation.

---

### 9. "Tourist-Local Exchange" (The Bridge)

Turn tourists into friends, not just visitors.

```
"Be My Local" feature:
- Tourists arriving in Guelma post: "I'm here for 2 days, love history & food"
- Locals who are free get notified: "A tourist wants to explore Roman heritage"
- Local offers their time (2 hrs) — NOT as a paid tour, but as genuine exchange
- Tourist gets authentic experience, Local earns "Global Connector" badge

"Ask a Local" button:
- On every place page: "Want to know what it's REALLY like? Ask a previous visitor"
- Previous visitors + locals can leave authentic tips (not generic reviews)
- Creates social connection without real-time commitment

"Hospitality Network":
- Verified locals can offer: a traditional meal, a guided walk, cultural tips
- Earn special profile cosmetic + points
- Builds Guelma's reputation as a welcoming city
```

**Solves:** "I'm lonely in a new place" (tourists) + "I want to share my city" (locals) → real human connection.

---

### 10. "Contribution Quest" (Gamified City Building)

Turn every user into an active contributor to Guelma's digital heritage.

```
Quest system:
- "Document all fountains within 1km of the Roman Theatre"
- "Translate 5 place descriptions to Arabic"
- "Add photos to 3 places that have none"
- "Verify opening hours for 10 restaurants"
- "Hike Maouna and document the trail for others"

Impact visualization:
- "This month, our community added 47 new places, 200 photos, and helped 300+ tourists"
- Community progress bar toward collective goals
- Leaderboard: "Top contributorcity of Guelma"

Reward economy:
- "Place Scout" — most places added
- "Storyteller" — best written descriptions
- "Lens Master" — most useful photos
- "Helpful Neighbor" — most useful tips
- All badges visible on profile → social status
```

**Solves:** Passive consumption → active community building. Content grows organically.

---

## Technical Architecture

### New Models (Backend)

```python
# models/mood.py
class MoodProfile(Base):
    """User's mood preferences for matching"""
    user_id = ForeignKey
    preferred_moods = JSON  # ["adventure", "social", "peace"]
    max_travel_km = Integer  # 5, 10, 25, 50
    available_days = JSON  # ["friday_evening", "saturday_morning"]
    
# models/experience.py
class Experience(Base):
    """Curated experiences (micro-adventures, heritage walks)"""
    title = JSONB  # {ar: "", fr: "", en: ""}
    description = JSONB
    category = Enum  # heritage, nature, food, social, wellness
    duration_minutes = Integer
    difficulty = Enum  # easy, moderate, challenging
    locations = JSONB  # [{place_id, order, activity_at_point}]
    narrative_audio = JSONB  # Audio guide URLs per language
    author_id = ForeignKey  # Pro tier users can create public experiences
    is_official = Boolean

# models/meetup.py
class Meetup(Base):
    """Spontaneous group meetups"""
    title = JSONB
    activity_type = Enum
    location_point = Geography(POINT)
    meetup_point = JSONB  # Named location + coordinates
    start_time = Timestamp
    max_participants = Integer
    status = Enum  # proposed, confirmed, active, completed
    creator_id = ForeignKey
    participants = relationship via join table
    
# models/photo_challenge.py  
class PhotoChallenge(Base):
    """Weekly photography challenges"""
    title = JSONB
    description = JSONB
    theme_tag = JSON  # "architecture", "people", "nature"
    location_hint = JSONB  # {place_id, radius_km}
    week_start = Date
    submissions = relationship
    winner_id = ForeignKey
    
# models/wellness_moment.py
class WellnessTip(Base):
    """Daily wellness suggestions tied to location"""
    title = JSONB
    body = JSONB
    category = Enum  # breathwork, meditation, movement, connection
    location_context = JSONB  # {place_type, time_of_day}
    audio_url = Optional[str]
    duration_seconds = Integer
```

### New API Endpoints

```
GET  /api/v1/moods/suggestions?lat=X&lon=Y&mood=stressed
GET  /api/v1/meetups?status=proposed&near=X&km=Y
POST /api/v1/meetups (create a meetup proposal)
POST /api/v1/meetups/:id/join
POST /api/v1/meetups/:id/leave
GET  /api/v1/experiences?category=heritage&near=X
GET  /api/v1/photo-challenges/current
POST /api/v1/photo-challenges/:id/submit
GET  /api/v1/wellness/today
GET  /api/v1/whats-happening (live feed)
POST /api/v1/ask-local (post a question for locals/tourists)
GET  /api/v1/contribution/quests (personalized contribution quests)
```

### New Frontend Pages

```
/[locale]/mood → Mood picker + personalized suggestions
/[locale]/meetups → Active meetups + create new
/[locale]/explore → Micro-adventure generator ("Surprise me")
/[locale]/legends → Skill share marketplace
/[locale]/photowalk → Current challenge + submissions
/[locale]/wellness → Daily wellness moment
/[locale]/tourist → Ask a Local + Be My Local
```

### Frontend Components

```
<MoodPicker /> — Animated emoji/grid selector
<LiveFeed /> — Real-time activity pulse
<MapPulse /> — Meeting points + active groups on map
<SurpriseMeCard /> — Random adventure generator
<MomentPlayer /> — Full-screen wellness experience (timer + audio)
<PhotoChallengeCard /> — Weekly challenge with upload
<MeetupCard /> — Countdown to meetup + participant avatars
<ContributionQuest /> — Personalized quests with progress
```

---

## Priority & Implementation Order

| # | Feature | Impact | Complexity | Sprint |
|---|---------|--------|------------|--------|
| 1 | What's Happening NOW | ★★★★★ | Medium | S1 |
| 2 | Mood-Based Discovery | ★★★★★ | Medium | S1 |
| 3 | Social Roulette / Find Your Crew | ★★★★★ | High | S2 |
| 4 | Micro-Adventures | ★★★★☆ | Low | S1 |
| 5 | PhotoWalks | ★★★★☆ | Medium | S2 |
| 6 | Weekend W Together | ★★★★★ | Medium | S1 |
| 7 | Wellness Moments | ★★★★☆ | Medium | S2 |
| 8 | Local Legends | ★★★☆☆ | Medium | S3 |
| 9 | Tourist-Local Exchange | ★★★★☆ | Medium | S3 |
| 10 | Contribution Quest | ★★★★☆ | Medium | S2 |

**Sprint 1 (Quick wins + core value):** Live Feed + Mood Discovery + Micro-Adventures + Weekend Together
**Sprint 2 (Social features):** Social Roulette + PhotoWalks + Wellness + Contribution Quests
**Sprint 3 (Community depth):** Local Legends + Tourist-Local Exchange

---

## Success Metrics

| Metric | Baseline | Target (3 months) |
|--------|----------|-------------------|
| Active users / week | ? | 500+ |
| Activities created / week | 0 | 50+ |
| Meetups completed / week | 0 | 20+ |
| User return rate | ? | 60% weekly |
| Community contributions | 0 | 200+/month |
| Photo challenge submissions | 0 | 100+/week |

---

> "The best community app isn't the one with the most features — it's the one that makes people's lives genuinely better. Every feature above either:
> 1. Removes friction (finding something to do)
> 2. Creates connection (meeting people)
> 3. Improves wellbeing (stress relief)
> 4. Preserves heritage (cultural knowledge)
> 5. Generates value (local economy)"
