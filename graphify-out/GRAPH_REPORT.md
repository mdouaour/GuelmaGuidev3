# Graph Report - guelma-guide  (2026-06-27)

## Corpus Check
- 227 files · ~79,796 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1328 nodes · 3031 edges · 109 communities (93 shown, 16 thin omitted)
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 826 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `961a48aa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 99|Community 99]]

## God Nodes (most connected - your core abstractions)
1. `User` - 111 edges
2. `PlaceCategory` - 83 edges
3. `UserRole` - 67 edges
4. `Place` - 46 edges
5. `NotificationType` - 45 edges
6. `useAuth()` - 45 edges
7. `Activity` - 42 edges
8. `proxyJson()` - 37 edges
9. `getAuthToken()` - 35 edges
10. `ActivityError` - 29 edges

## Surprising Connections (you probably didn't know these)
- `TestClient` --uses--> `Base`  [INFERRED]
  backend/tests/conftest.py → backend/app/db/base_class.py
- `get_activities()` --calls--> `get_cached_json()`  [INFERRED]
  backend/app/api/activities.py → backend/app/core/cache.py
- `get_activities()` --calls--> `set_cached_json()`  [INFERRED]
  backend/app/api/activities.py → backend/app/core/cache.py
- `create_activity_checkout()` --calls--> `create_checkout_session()`  [INFERRED]
  backend/app/api/activities.py → backend/app/services/stripe_service.py
- `join_activity_endpoint()` --calls--> `timedelta`  [INFERRED]
  backend/app/api/activities.py → backend/app/core/security.py

## Import Cycles
- 1-file cycle: `backend/app/main.py -> backend/app/main.py`
- 1-file cycle: `backend/app/core/cache.py -> backend/app/core/cache.py`
- 1-file cycle: `backend/app/core/security.py -> backend/app/core/security.py`
- 1-file cycle: `backend/app/services/ai_service.py -> backend/app/services/ai_service.py`

## Communities (109 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (123): ActivityTicketRead, admin_required, AdminStats, admin_approve_activity(), admin_demote_user(), admin_get_stats(), admin_list_activities(), admin_list_users() (+115 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (80): _build_token_response(), _generate_and_send_verification(), google_callback(), google_login(), _hash_token(), login(), logout(), me() (+72 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (67): ActivityRegistration, cancel_activity_endpoint(), create_activity_checkout(), create_new_activity(), get_activities(), get_activity(), _get_localized_place_name(), join_activity_endpoint() (+59 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (57): create_feedback(), FeedbackCreate, get_leaderboard(), Return community leaderboard ordered by contribution points., Submit feedback from authenticated user., create_notification(), get_notifications(), mark_all_as_read() (+49 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (36): GET(), POST(), GET(), POST(), POST(), GET(), DELETE(), BACKEND_URL (+28 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (44): localFetch(), OrganiserAnalyticsPage(), CommunityClient(), ImageUploadProps, MeetupsClient(), MOOD_FILTERS, AuthContext, AuthContextValue (+36 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (29): AdminPage(), AdminStats, AdminUser, PendingActivity, Tab, AuthContent(), BottomNav(), navItems (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (46): recommendations(), Depends, ge, get_db, le, Query, RecommendationsResponse, Session (+38 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (20): FadeInSection(), FadeInSectionProps, MoodOption, moodOptions, WELLNESS_GRADIENTS, WELLNESS_ICONS, mockExperiences, Experience (+12 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (26): AIRecommendationExplanation, DEFAULT_COORDINATES, categories, DiscoverClientProps, HomeClient(), HomeClientProps, MapClient(), PlaceCard() (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (38): ask_local_question(), get_daily_wellness(), get_happening_feed(), get_mood_suggestions(), get_photo_challenges(), list_experiences(), list_local_questions(), list_meetups() (+30 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (22): get_arq_pool(), health_check(), health_check(), lifespan(), ArqRedis, Request, Session, Request (+14 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (34): dependencies, clsx, date-fns, @google/genai, leaflet, lucide-react, motion, next (+26 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (28): TestClient, The Redis key must be deleted the moment the token is consumed., Resend endpoint must return 200 even for unknown emails (no user enumeration)., Resend sends a new verification email for an existing unverified user., Resend must not send an email for an already-verified user., After registration the user can log in and /me returns the correct data., The endpoint must return 200 even for unknown emails (no user enumeration)., For a known user the token is stored in Redis and an email is dispatched. (+20 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (16): Session, TestClient, _create_place(), _login_user(), Posting a second review updates the old one (upsert)., Reviewing a place that doesn't exist returns 404., GET reviews returns all reviews for a place with pagination., A place with no reviews returns empty list (not an error). (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (24): 1.1 Places — Expand from ~handful to 50+ entries, 1.2 Activities — Events & Experiences, 1.3 AI Content Generation, 2.1 Map Improvements (Replace Leaflet with MapLibre GL JS), 2.2 Immersive Discovery — "Story Mode", 2.3 Gamification (Drive Community Contributions), 2.4 Context-Aware AI Guide, 2.5 Audio Guides (Offline-First) (+16 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (17): ActivitiesPage(), sitemap(), DiscoverPage(), PageProps, identifierToPlaceKeyword(), resolvePlaceIdFromIdentifier(), serverGetActivities(), serverGetPlace() (+9 more)

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, experimentalDecorators, incremental, isolatedModules, jsx (+15 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (20): 10. "Contribution Quest" (Gamified City Building), 1. "What's Happening NOW" (Live Feed), 2. "Mood-Based Discovery" (De Stress Matchmaker), 3. "Social Roulette" / "Find Your Crew", 4. "Micro-Adventures" (Spontaneous Local Experiences), 5. "Local Legends" (Knowledge Exchange Platform), 6. "Wellness Moments" (Daily Stress Relief), 7. "Weekend W together" (Instant Group Events) (+12 more)

### Community 19 - "Community 19"
Cohesion: 0.15
Nodes (12): ActivitiesClient(), apiRequest(), createActivity(), getActivities(), getBrowserLocale(), getPlace(), getPlaces(), joinActivity() (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.13
Nodes (14): background_color, categories, description, dir, display, icons, lang, name (+6 more)

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (13): 🤖 AI & External APIs, ⚙️ Configuration Matrix, 🏗 Environment Tiers, GitHub Secrets, 🌍 Global Environment System (SaaS Grade), 🚀 Production, Railway (Backend), 👥 Responsibility Mapping (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (8): Language, languages, LocalizedText, Coordinates, DiscoveryTag, discoveryTags, Landmark, landmarks

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (13): 1. Clone and install dependencies, 2. Setup environment, 3. Database setup, 4. Start development servers, API Architecture, GuelmaGuide, Key Features, Prerequisites (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (10): 1. The "Big Picture": How Everything Works Together, 2. Technology Choices: The "Why", 3. Security Architecture: The "Fortress" Approach, 4. Gamification & Community Evolution, 5. Monetization & Future Scaling, A. Authentication, B. CSRF Protection, C. Role-Based Access Control (RBAC) (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.42
Nodes (9): send_activity_cancellation(), send_activity_reminder(), send_email(), send_password_reset_email(), send_verification_email(), send_weekly_digest(), shutdown(), startup() (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.51
Nodes (9): Session, TestClient, UserRole, _create_place(), _login_user(), _register_user(), _set_role(), test_activities_availability_filter_and_pagination() (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (7): PhotoWalkClient(), getPhotoChallenges(), PhotoChallenge, PhotoSubmission, submitPhoto(), mockChallenge, mockSubmissions

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (7): QUESTION_CATEGORIES, TouristClient(), askLocal(), getLocalAnswers(), LocalAnswer, LocalQuestion, mockQuestions

### Community 29 - "Community 29"
Cohesion: 0.20
Nodes (9): 🚨 Automation Safety, 🛠 Manual Rollback, 🏗 Multi-Environment Architecture, 🚀 SaaS-Grade Production Deployment Guide, 🛠 Step 1: Initial Infrastructure Setup, 🔑 Step 2: Secret Management, 🚀 Step 3: Deployment Pipeline, 🔁 Step 4: Crisis Management (Rollbacks) (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (3): ErrorBoundaryClass, Props, State

### Community 31 - "Community 31"
Cohesion: 0.25
Nodes (7): 1. User (`AuthUser`), 2. Place (`Place`), 3. Activity (`Activity`), 4. Points & Gamification, 5. Storage (Images), GuelmaGuide Data Model, 🚀 Scalability: Future Migration to Other Cities

### Community 32 - "Community 32"
Cohesion: 0.25
Nodes (7): 1. Authentication Layer, 2. API Protection (CSRF), 3. Role-Based Access Control (RBAC), 4. Input Validation, 5. Privacy (PII), Security & Authentication Guide, 🛡 Security Best Practices

### Community 33 - "Community 33"
Cohesion: 0.57
Nodes (6): Session, TestClient, _login_user(), _register_user(), _set_organizer(), test_ai_recommendations_returns_places_and_activities()

### Community 34 - "Community 34"
Cohesion: 0.57
Nodes (6): Session, TestClient, _create_place(), _setup_organizer_and_get_token(), test_places_distance_filter_requires_coordinates(), test_places_filtering_and_pagination()

### Community 35 - "Community 35"
Cohesion: 0.38
Nodes (4): LeafletMapProps, MapMarker, LeafletMap, MapClientProps

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (3): Meetup, MeetupsClient(), mockMeetups

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): 🕒 1. Uptime Monitoring, 🚨 2. Error Tracking (Sentry), 📝 3. Logging Strategy, 🚀 4. Performance Metrics, 🛡 5. Security Monitoring, 📊 Monitoring & SaaS Observability

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (6): construct_webhook_event(), create_checkout_session(), create_subscription_checkout_session(), Creates a Stripe Checkout session for a paid activity., Creates a Stripe Checkout session for a monthly subscription., Verifies and constructs a Stripe webhook event.

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (6): buildCommand, framework, headers, installCommand, regions, version

### Community 40 - "Community 40"
Cohesion: 0.40
Nodes (4): Any, BaseSettings, get_settings(), Settings

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (5): 💡 How we evolve, 📍 Phase 1: Guelma MVP (Q2 2026), 🗺 Phase 2: Regional Expansion (Q3-Q4 2026), 🚀 Phase 3: Advanced Features & Monetization (2027), Product Roadmap: The Evolution of GuelmaGuide

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (5): Email delivery service using the Resend API., Send a password-reset link to *to_email* via Resend.      Silently logs and retu, Send an email-verification link to *to_email* via Resend.      Silently logs and, send_password_reset_email(), send_verification_email()

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (5): ✅ Completed Features, 🛠 In Progress (Current Focus), ⚠️ Known Weak Points (Priority Debt), Project Status & Health, 📈 Vital Stats

### Community 46 - "Community 46"
Cohesion: 0.50
Nodes (4): getPasswordStrengthInfo(), PasswordScore, PasswordStrengthBar(), PasswordStrengthBarProps

### Community 47 - "Community 47"
Cohesion: 0.40
Nodes (3): Cross-database TSVECTOR type.      Uses PostgreSQL's native TSVECTOR when connec, TSVector, TypeDecorator

### Community 48 - "Community 48"
Cohesion: 0.40
Nodes (3): GUELMA_COORDS, interestOptions, LeafletMap

### Community 49 - "Community 49"
Cohesion: 0.50
Nodes (4): config, intlMiddleware, locales, proxy()

### Community 50 - "Community 50"
Cohesion: 0.50
Nodes (3): config, nextConfig, withNextIntl

## Knowledge Gaps
- **258 isolated node(s):** `Request`, `ArqRedis`, `Session`, `ge`, `le` (+253 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Community 0` to `Community 1`, `Community 3`, `Community 25`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `FastAPI` connect `Community 11` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 10`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `PlaceCategory` connect `Community 2` to `Community 0`, `Community 3`, `Community 47`, `Community 7`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 110 inferred relationships involving `User` (e.g. with `ActivityTicketRead` and `admin_required`) actually correct?**
  _`User` has 110 INFERRED edges - model-reasoned connections that need verification._
- **Are the 80 inferred relationships involving `PlaceCategory` (e.g. with `ActivityRegistration` and `Activity`) actually correct?**
  _`PlaceCategory` has 80 INFERRED edges - model-reasoned connections that need verification._
- **Are the 64 inferred relationships involving `UserRole` (e.g. with `admin_required` and `AdminStats`) actually correct?**
  _`UserRole` has 64 INFERRED edges - model-reasoned connections that need verification._
- **Are the 45 inferred relationships involving `Place` (e.g. with `admin_required` and `AdminStats`) actually correct?**
  _`Place` has 45 INFERRED edges - model-reasoned connections that need verification._