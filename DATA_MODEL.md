# GuelmaGuide Data Model

This document outlines the core entities and their relationships within the Guelma platform.

## 1. User (`AuthUser`)
Represents a community member. Users can have different roles that grant them specific permissions.

```typescript
interface AuthUser {
  id: number;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'visitor' | 'organizer' | 'admin';
  organizer_verified: boolean; // True if Admin has verified their credentials
  points: number; // Gamification: earned via contributions
  email_verified: boolean;
  created_at: string;
}
```

---

## 2. Place (`Place`)
A physical landmark, restaurant, or park in Guelma.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Localized name (Guelma Arabic/French/English) |
| `latitude`/`longitude` | Float | GPS coordinates for the map |
| `category` | Enum | `nature`, `culture`, `thermal_baths`, `sports`, `relaxation` |
| `theme` | String | Sub-category (e.g., "Roman Antiquity", "Green Space") |
| `status` | Enum | `pending`, `approved`, `rejected` (Moderation flow) |
| `suggested_by_id` | Number | ID of the user who first submitted the place |

**Relationship**: One User can suggest many Places. One Place can host many Activities.

---

## 3. Activity (`Activity`)
A time-bound event hosted by an Organizer at a specific Place.

```typescript
interface Activity {
  id: number;
  title: string;
  description: string;
  place_id: number; // Foreign Key to Place
  organizer_id: number; // Foreign Key to User (Role: Organizer)
  date_time: string;
  max_participants: number;
  participants_count: number;
  price_per_ticket: number | null; // Null if free
  approval_status: 'pending' | 'approved';
}
```

---

## 4. Points & Gamification
Points are awarded asynchronously based on theFollowing triggers:

- **Place Approved**: +50 Points.
- **Activity Hosted**: +20 Points.
- **Verified Status**: +100 Points.

---

## 5. Storage (Images)
Images are not stored in the database. Instead:
1. User uploads to `/api/places/{id}/images`.
2. Middleware proxies the file to **Cloudflare R2**.
3. R2 returns a public URL string.
4. The URL string is appended to the `images` array in the `Place` document.

---

## 🚀 Scalability: Future Migration to Other Cities
The schema is designed to be **Hyper-scalable**:
- We can add a `city_id` or `region_id` to the `Place` and `User` models.
- The `category` list can be expanded via a configuration table.
- Multilingual support is already built-in using JSONB-style localized fields (e.g., `name_ar`, `name_fr`).
