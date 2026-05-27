# skipQ — Complete Business & Technical Specification

> **Purpose of this document:** This is the master specification for building skipQ from scratch using Claude Code. It contains business context, product requirements, technical architecture, data models, API contracts, and implementation phases. Treat this as the single source of truth.

> **Document owner:** Jazil Sameer, Co-Founder, kairalitrails
> **Tech lead:** Shreejesh
> **Version:** 1.0
> **Last updated:** Initial specification

-----

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
1. [The Problem](#2-the-problem)
1. [The Solution](#3-the-solution)
1. [Brand & Positioning](#4-brand--positioning)
1. [Business Model & Revenue](#5-business-model--revenue)
1. [Target Market](#6-target-market)
1. [Product Architecture](#7-product-architecture)
1. [User Flows](#8-user-flows)
1. [Feature Specification](#9-feature-specification)
1. [The Wait-Time Algorithm](#10-the-wait-time-algorithm)
1. [Data Models](#11-data-models)
1. [Technical Stack](#12-technical-stack)
1. [API Specification](#13-api-specification)
1. [Security & Privacy](#14-security--privacy)
1. [Implementation Roadmap](#15-implementation-roadmap)
1. [Success Metrics](#16-success-metrics)
1. [Anti-Bypass Mechanisms](#17-anti-bypass-mechanisms)
1. [Edge Cases & Failure Modes](#18-edge-cases--failure-modes)
1. [Glossary](#19-glossary)

-----

## 1. EXECUTIVE SUMMARY

**skipQ** is a mobile-first marketplace platform that solves wait-time pain at salons. Customers see live queue status at nearby salons, join the queue virtually from anywhere, and walk in when it’s their turn. Salons get free queue management software, a customer database, and incremental new customer acquisition.

### One-line positioning

**“Skip the wait. See live queues. Book from anywhere.”**

### Business shape

- **Type:** Two-sided marketplace (salons + customers)
- **Geography:** Launch in Kochi, Kerala → expand to other South Indian cities
- **Funding:** Bootstrapped from kairalitrails capital (~₹6-10L Year 1 budget)
- **Revenue start:** Month 4 (lead fees) → Self-sustaining by Month 8-10
- **Year 1 target:** 100+ salons, 25,000+ users, ₹6L+ MRR
- **Brand owner:** New Pvt Ltd entity (recommended), separate from kairalitrails

### Why this exists

1. Indians increasingly intolerant of unmanaged waits (Swiggy, Uber trained the market)
1. Salons lose 15-25% of walk-in customers due to visible crowds
1. No Indian player owns “live queue + booking” for salons specifically
1. Existing players (Fresha, Zenoti, MioSalon) are appointment-first SaaS, missing the walk-in queue gap

-----

## 2. THE PROBLEM

### For customers

- Walking into a salon on Saturday and waiting 1-2 hours unpredictably
- Receptionists guess wait times incorrectly (“10 minutes” becomes 45)
- Can’t plan their day around the wait
- No way to know if their preferred stylist is in / available
- Forced to physically be present to “hold” a spot
- Walk-aways = wasted trip + bad mood

### For salon owners

- Visible crowd at reception scares away potential customers (lost revenue)
- No data on actual customer flow patterns
- Cannot predict staffing needs
- Lose customers to walk-aways (15-25% on weekends)
- Stylist no-shows / sick days create chaos
- Phone constantly rings: “Is X stylist there? How long is the wait?”
- No structured way to capture customer info (everything is verbal)

### Why existing solutions don’t solve it

- **Fresha / MioSalon / Zenoti:** Appointment-first systems. 60-70% of Indian salon traffic is walk-in. They don’t address live queue.
- **Justdial / Sulekha:** Lead generation only. No queue management. Owner pays per “lead” that may not convert.
- **Urban Company:** At-home services. Different model entirely.
- **Local solutions (paper / verbal):** No scalability, no data, no accuracy.

-----

## 3. THE SOLUTION

### Core product

A mobile app (customer-facing) + web dashboard (salon-facing) that:

**For customers:**

- Shows live wait times at nearby salons (Zomato-style discovery)
- Lets them join the queue virtually
- Sends notifications as their turn approaches
- Lets them pick a preferred stylist with live availability
- Remembers their service history and preferences (supporting feature)

**For salons:**

- Free queue management dashboard on any phone or tablet (no special hardware required)
- Auto-captures customer phone numbers into a database
- Per-stylist queue management with auto-assignment
- Learning algorithm that predicts service times accurately
- Analytics on peak hours, walk-aways, stylist productivity
- WhatsApp notifications to customers automated

### Why this wins

1. **Phone-first**, not tablet-first → zero hardware investment by salon or skipQ
1. **Per-stylist learning algorithm** → ETAs 10x more accurate than competitors
1. **Free forever for salons (base tier)** → zero adoption friction
1. **Performance-based revenue (lead fee model)** → salons only pay when value delivered
1. **Bootstrapped + lean** → no VC pressure, can grow at sustainable pace

-----

## 4. BRAND & POSITIONING

### Brand name

**skipQ** (always lowercase ‘s’, uppercase ‘Q’)

### Tagline

**“Skip the wait.”**

### Secondary tagline

“See live queues. Book from anywhere.”

### Brand promise

End the wait at salons. Everything else is supporting.

### Brand DO’s

- Bold, utilitarian, confident voice (like Swiggy, Uber)
- Wait time numbers should be visually dominant in UI
- Emphasize speed, predictability, control
- Modern sans-serif typography (Inter or similar)
- Color palette: stone/charcoal base + signature accent (consider deep teal or vibrant orange — not red/pink to differentiate from Zomato)

### Brand DON’Ts

- Don’t position as a “premium spa booking” platform
- Don’t use serif fonts or luxury aesthetics
- Don’t make Style Memory the brand story (it’s a supporting feature)
- Don’t use Kerala-specific imagery (palm trees, coconuts) — skipQ is national-ready from day 1
- Don’t compete on price — compete on time saved

### Voice & tone examples

- ✅ “You’re #4. About 22 min.”
- ✅ “No wait right now at 3 salons near you.”
- ✅ “Heads up — your turn in 5 minutes.”
- ❌ “Welcome to your salon journey…”
- ❌ “Discover the art of grooming…”

-----

## 5. BUSINESS MODEL & REVENUE

### Core principle

**Salons pay zero to join. Salons pay only when skipQ creates value.**

This is non-negotiable. Salons in India will not pay subscription before experiencing value.

### 5-Layer Revenue Model (introduced in sequence)

#### Layer 1: Lead Fee (Months 4+) — Foundation

- **Charge:** ₹50 per NEW customer skipQ brings to the salon
- **Definition of “new”:** Customer’s phone number never seen in this salon’s customer database before
- **Charge model:** Weekly invoice via UPI request
- **Pitch:** “We bring new customers, you pay only when we deliver”
- **Comparable to:** Justdial’s lead fees, Urban Company’s commission

#### Layer 2: Pre-paid Booking Commission (Months 6+)

- **Charge:** 6-8% on transactions paid through skipQ
- **Salon settlement:** Next-day UPI payout, minus commission
- **Customer benefit:** Confirmed slot, no-show protection
- **Salon benefit:** Eliminates 15-20% no-show problem

#### Layer 3: Featured Listings & Ads (Months 6+)

- Featured slot (top 3 in area): ₹2,500-5,000/month
- Search boost (pay per click): ₹3-8/click
- Empty-chair blast notifications: ₹400-800 per push
- **Pitch:** “Get more customers when you have capacity”

#### Layer 4: Pro Tools Subscription (Months 10+)

- **skipQ Pro for Salons: ₹999/month**
- Features: WhatsApp marketing, stylist analytics, demand forecasting, multi-branch, API access
- **Target:** 20% of active salons convert

#### Layer 5: Customer Subscription (Months 12+)

- **skipQ Plus: ₹99/month or ₹799/year**
- Benefits: Zero platform fee, free priority joins, exclusive discounts, family profiles
- **Target:** 3-5% of active users convert

### Revenue projections (Kochi-only)

|Month|Salons|Users |MRR   |Notes               |
|-----|------|------|------|--------------------|
|3    |10    |800   |₹0    |Free phase, learning|
|6    |35    |4,000 |₹1.15L|Lead fees active    |
|9    |70    |12,000|₹3.35L|Cash-flow positive  |
|12   |120   |25,000|₹6.5L |All layers active   |
|18   |250   |70,000|₹17L  |Mature city         |

**Year 1 ARR target: ₹50-75L | Year 2 ARR target: ₹2-3 Cr (single city)**

### Budget (Year 1)

|Category                                          |Cost      |
|--------------------------------------------------|----------|
|Company registration + trademark + compliance     |₹55,000   |
|Tech infrastructure (servers, WhatsApp, SMS, maps)|₹1,10,000 |
|Customer acquisition                              |₹2,00,000 |
|Salon acquisition (sales rep months 6-12)         |₹1,00,000 |
|Travel + ops                                      |₹60,000   |
|Onboarding materials                              |₹15,000   |
|Customer support (months 6-12)                    |₹1,50,000 |
|Contingency                                       |₹60,000   |
|**TOTAL YEAR 1**                                  |**~₹7.5L**|

-----

## 6. TARGET MARKET

### Phase 1: Kochi, Kerala (Months 1-9)

- **Target salons:** 100 by Month 9
- **Target users:** 25,000 by Month 12
- **Focus areas:** Edapally, Kakkanad, Panampilly Nagar, Vyttila, MG Road
- **Salon types prioritized:**
1. Unisex chain salons in malls (Naturals, Looks, Green Trends) — high volume
1. Independent men’s salons in residential areas — high pain
1. Premium ladies’ salons — high ticket size

### Phase 2: Kerala expansion (Months 10-18)

- Trivandrum
- Calicut/Kozhikode
- Mangalore (kairalitrails HQ — easier ops)

### Phase 3: South India (Months 19-36)

- Bengaluru
- Chennai
- Hyderabad

### Customer demographics (primary)

- **Age:** 18-45
- **Income:** ₹25k-1L/month
- **Phone:** Android (initially), iOS later
- **Behaviour:** Uses Zomato, Swiggy, Uber regularly
- **Spend:** ₹300-1,500 per salon visit
- **Frequency:** 1-2 salon visits per month

### Salon owner demographics

- **Age:** 28-55
- **Tech literacy:** Uses WhatsApp, UPI, Instagram daily
- **Business size:** 2-15 chairs
- **Monthly revenue:** ₹2L-15L
- **Pain awareness:** High (they know walk-aways cost them money)

-----

## 7. PRODUCT ARCHITECTURE

### High-level system

```
┌─────────────────────────────────────────────────────────────┐
│                      CUSTOMER LAYER                          │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│   │  Mobile App  │   │  WhatsApp    │   │   Web App    │    │
│   │  (Android/   │   │  (No-download│   │   (mobile-   │    │
│   │   iOS)       │   │   fallback)  │   │   browser)   │    │
│   └──────────────┘   └──────────────┘   └──────────────┘    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                          REST API + Realtime
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                    BACKEND (Supabase)                        │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│   │  Auth        │   │  Postgres DB │   │  Realtime    │    │
│   │  (Phone OTP) │   │              │   │  (Queue      │    │
│   │              │   │              │   │   updates)   │    │
│   └──────────────┘   └──────────────┘   └──────────────┘    │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│   │  Edge        │   │  Storage     │   │  Cron Jobs   │    │
│   │  Functions   │   │  (Photos)    │   │              │    │
│   └──────────────┘   └──────────────┘   └──────────────┘    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                     SALON LAYER                              │
│   ┌──────────────┐   ┌──────────────┐                       │
│   │  Reception   │   │  Stylist     │                       │
│   │  Dashboard   │   │  Phone View  │                       │
│   │  (web app)   │   │  (web app)   │                       │
│   └──────────────┘   └──────────────┘                       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────┐
│                  INTEGRATIONS                                │
│  WhatsApp (RouteMobile) | SMS (RouteMobile) | Razorpay |    │
│  Google Maps | OneSignal (push) | Firebase Analytics        │
└──────────────────────────────────────────────────────────────┘
```

### Three primary user surfaces

#### A. Customer mobile app (React Native)

The Zomato-style discovery and queue experience. Primary acquisition surface.

#### B. Salon reception dashboard (Web app — Next.js)

Mobile-responsive web app accessed at `partner.skipq.in`. Runs on any phone, tablet, or laptop. No app store install needed initially.

#### C. Customer WhatsApp flow (RouteMobile)

For customers who won’t download the app. They scan a QR code at the salon → WhatsApp opens → they confirm and get queue updates via WhatsApp messages.

-----

## 8. USER FLOWS

### Flow 1: Customer joins queue (mobile app)

```
1. Open app → Auto-detect location (Edapally, Kochi)
2. See list of nearby salons sorted by wait time
3. Tap salon → See live queue, stylists, services
4. Optionally select stylist
5. Select services (haircut, beard, etc.)
6. Tap "Skip the queue · ₹XXX"
7. Get OTP via SMS → confirm phone number
8. Now in queue, see live status screen
9. Receive WhatsApp + push notifications as turn approaches
10. Walk into salon at the right time
11. Service complete → optionally rate & upload style photos
```

### Flow 2: Customer joins queue (no app, WhatsApp)

```
1. At salon, scan QR code at reception
2. WhatsApp opens with pre-filled message to salon's skipQ number
3. Bot replies with service menu (interactive buttons)
4. Customer selects services → bot confirms position #4, ~22 min
5. Bot sends updates every 5 min ("You're now #2, ~8 min")
6. "You're next — please come to reception"
7. Service complete → bot asks for rating
```

### Flow 3: Salon receives customer (reception dashboard)

```
1. Receptionist opens partner.skipq.in on phone/tablet
2. Logged in as the salon
3. Live queue shows: 4 customers waiting, each with services + stylist preference
4. New customer joins → notification sound + visual highlight
5. Customer arrives → tap "Mark arrived"
6. System auto-assigns to next free preferred stylist
7. Tap "Start service" → timer begins
8. Tap "Complete service" → customer marked done, next customer notified
9. End of day: see analytics — customers served, walk-aways, peak hours
```

### Flow 4: Stylist serves customer (stylist phone view)

```
1. Stylist opens partner.skipq.in/stylist on phone
2. Sees their personal queue
3. Customer arrives → "Jazil S — Haircut + beard · 3rd visit"
4. Tap on customer name → see last visit notes & photos (if available)
5. Tap "Start service"
6. After service, tap "Complete"
7. Optional 15-second form: "Add notes" (clipper sizes, length, etc.)
8. Continue to next customer
```

### Flow 5: Salon onboarding (one-time, by sales)

```
1. Sales person visits salon, pitches skipQ
2. Owner agrees → sales person creates account on partner.skipq.in
3. Fills: salon name, address, GPS location, photos, services menu, stylist list
4. Salon gets unique QR code → prints poster (provided by skipQ)
5. Receptionist trained on dashboard (15 min)
6. Salon goes live → appears in customer app
```

### Flow 6: Salon weekly invoice (Months 4+)

```
1. Sunday 11 PM: cron job calculates each salon's invoice for past week
   - Count of new customers brought via skipQ × ₹50
   - Less any disputed bookings
2. Monday 9 AM: WhatsApp sent to each salon owner
   "Your skipQ invoice for last week: ₹450 (9 new customers)
    Tap to pay: [Razorpay link]"
3. If unpaid in 7 days: reminder; if unpaid in 14 days: salon downranked
```

-----

## 9. FEATURE SPECIFICATION

### 9.1 MVP Features (Phase 1 — Months 1-3)

#### Customer side

- [x] Phone OTP login
- [x] Auto-detect location (with manual override)
- [x] Browse nearby salons (default 5 km radius)
- [x] See live wait time on each salon card
- [x] Filter: No wait, Top rated, By gender
- [x] Salon detail page with stats, stylists, services
- [x] Select stylist (or “any”)
- [x] Select multiple services
- [x] Join queue
- [x] Live queue status screen with position + ETA
- [x] WhatsApp + push notifications for queue updates
- [x] Leave queue (cancel)
- [x] Basic profile (name, phone, photo)
- [x] History of past visits

#### Salon side

- [x] Partner login (email + password)
- [x] Salon profile setup (name, address, GPS, photos, hours)
- [x] Service menu management (add/edit services with price + duration)
- [x] Stylist management (add stylists with names, photos, specialties)
- [x] Live queue dashboard
- [x] Mark customer arrived / started / completed
- [x] Per-stylist queue view
- [x] Basic daily analytics (customers served, avg wait)
- [x] Customer database (auto-built from queue entries)

#### Admin side (skipQ internal)

- [x] Onboard new salons
- [x] View all salons, queues live
- [x] Generate invoices
- [x] Customer support tools

### 9.2 V2 Features (Phase 2 — Months 4-6)

- WhatsApp queue join (no-download option)
- Per-stylist learning algorithm v1
- Style notes & photo upload (post-service)
- Salon analytics dashboard (peak hours, walk-away rates)
- Customer reviews & ratings
- Saved favourites
- Referral program

### 9.3 V3 Features (Phase 3 — Months 7-12)

- In-app payments (Razorpay)
- Salon ads & featured listings
- skipQ Pro for Salons (paid tier)
- Stylist-level profiles & ratings
- Multi-branch support for chains
- Demand forecasting for salons

### 9.4 V4 Features (Phase 4 — Year 2)

- skipQ Plus consumer subscription
- iOS app (Phase 1 was Android-only)
- Brand partnership marketplace
- Loyalty program
- Advanced AI features (style matching from photos)

-----

## 10. THE WAIT-TIME ALGORITHM

This is the technical core of skipQ. Most queue apps fail because their wait time predictions are wildly inaccurate. Ours must be within ±5 minutes for the product to be trusted.

### Algorithm v1 (Months 1-3) — Simple averages

```
ETA for new customer = sum of remaining time for all customers ahead

For each customer ahead:
  if their service has started:
    remaining_time = service_avg_duration - elapsed_time_since_start
  else:
    remaining_time = service_avg_duration

Plus: customer's own service estimated duration
```

Initial service durations come from defaults in service catalog.

### Algorithm v2 (Months 3-6) — Per-stylist learning

```
For each (stylist, service) pair:
  learned_avg = rolling average of last 30 actual durations
  
For each customer ahead at this stylist:
  if service combo (e.g., haircut + beard):
    use combo_learned_avg (combos are 10-15% faster than sum)
  else:
    use single_service_learned_avg
```

Maintain a `service_timings` table:

- stylist_id
- service_id (or combo signature)
- duration_seconds
- timestamp

Update on every completed service.

### Algorithm v3 (Months 7+) — Context-aware

Add factors:

- **Time of day:** Stylists slow down after 4 PM (fatigue factor)
- **Day of week:** Saturday is 8% slower per stylist
- **Customer complexity:** New customers take 12% longer (consultation time)
- **Service interruptions:** Detect when stylists take breaks, account for it
- **Queue load:** When 5+ in queue, stylists rush (3-5% faster)

### Algorithm constraints (CRITICAL)

- **No predictions for stylists with <10 completed services** — show range instead (“15-25 min”)
- **Confidence intervals:** Show “Usually 22 min · could be 18-28” for transparency
- **Always round to 5-minute increments** in UI (20, 25, 30 — never 23, 27)
- **Cap ETA at 90 min** in display (“90+ min wait”) to avoid scaring users
- **Update every 60 seconds** for active queues

### Service combo intelligence

Some service combos are faster than sum:

- Haircut + beard = 0.85 × (haircut + beard) — done in parallel
- Wash + cut = 0.92 × (wash + cut)
- Colour + cut = 0.95 × (colour + cut)

Learn these multipliers per stylist over time.

-----

## 11. DATA MODELS

### Database: PostgreSQL via Supabase

### Core tables

#### `users` (customers)

```sql
id              uuid PRIMARY KEY DEFAULT uuid_generate_v4()
phone           text UNIQUE NOT NULL
name            text
email           text
profile_photo   text  -- URL to Supabase Storage
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
last_active_at  timestamptz
device_token    text  -- For push notifications
referred_by     uuid REFERENCES users(id)
total_visits    int DEFAULT 0
total_spend     numeric(10,2) DEFAULT 0
preferences     jsonb  -- saved stylists, services, etc.
```

#### `salons`

```sql
id              uuid PRIMARY KEY
name            text NOT NULL
tagline         text
type            text  -- 'mens' | 'ladies' | 'unisex'
address         text NOT NULL
area            text  -- 'Edapally', 'Kakkanad', etc.
city            text NOT NULL
state           text NOT NULL
location        geography(POINT, 4326)  -- PostGIS for distance queries
phone           text
email           text
cover_image     text
photos          text[]  -- array of image URLs
hours           jsonb  -- { mon: {open: '09:00', close: '21:00'}, ... }
status          text DEFAULT 'pending'  -- 'pending' | 'active' | 'suspended'
joined_at       timestamptz DEFAULT now()
owner_user_id   uuid REFERENCES partner_users(id)
upi_id          text  -- for receiving payouts
gst_number      text
commission_rate numeric(4,2) DEFAULT 0  -- starts at 0, may go up later
featured_until  timestamptz  -- if currently a featured salon
rating          numeric(2,1) DEFAULT 0
review_count    int DEFAULT 0
```

#### `partner_users` (salon owners, receptionists, stylists)

```sql
id              uuid PRIMARY KEY
salon_id        uuid REFERENCES salons(id)
phone           text UNIQUE NOT NULL
name            text NOT NULL
role            text NOT NULL  -- 'owner' | 'receptionist' | 'stylist'
email           text
password_hash   text
created_at      timestamptz DEFAULT now()
last_login_at   timestamptz
```

#### `stylists` (the service providers, can be linked to partner_user)

```sql
id              uuid PRIMARY KEY
salon_id        uuid REFERENCES salons(id) NOT NULL
partner_user_id uuid REFERENCES partner_users(id)  -- nullable if no login
name            text NOT NULL
role            text  -- 'Junior', 'Senior', 'Master', 'Director'
specialty       text  -- 'Hair colour', 'Men's cut', etc.
photo           text
status          text DEFAULT 'available'  -- 'available' | 'busy' | 'break' | 'off'
gender_serves   text[]  -- ['male', 'female', 'all']
rating          numeric(2,1) DEFAULT 0
total_services  int DEFAULT 0
```

#### `services` (per salon)

```sql
id              uuid PRIMARY KEY
salon_id        uuid REFERENCES salons(id) NOT NULL
name            text NOT NULL  -- 'Haircut', 'Beard trim', etc.
category        text  -- 'hair', 'beard', 'colour', 'facial'
price           numeric(10,2) NOT NULL
default_duration int NOT NULL  -- in minutes
gender          text  -- 'male' | 'female' | 'all'
active          boolean DEFAULT true
display_order   int DEFAULT 0
```

#### `queue_entries`

```sql
id              uuid PRIMARY KEY
salon_id        uuid REFERENCES salons(id) NOT NULL
user_id         uuid REFERENCES users(id)
guest_phone     text  -- for WhatsApp/walk-in entries without user account
guest_name      text
stylist_id      uuid REFERENCES stylists(id)  -- nullable for "any available"
preferred_stylist_id uuid REFERENCES stylists(id)
position        int NOT NULL  -- current position in queue
status          text NOT NULL  -- 'waiting' | 'arrived' | 'serving' | 'completed' | 'no_show' | 'cancelled'
joined_at       timestamptz DEFAULT now()
arrived_at      timestamptz
started_at      timestamptz
completed_at    timestamptz
cancelled_at    timestamptz
estimated_wait_min int  -- snapshot at join time
actual_wait_min  int  -- calculated at start
is_new_customer  boolean  -- determined at join time (for lead fee)
source          text NOT NULL  -- 'app' | 'whatsapp' | 'walk_in_manual'
total_price     numeric(10,2)
notes           text
```

#### `queue_entry_services` (services selected per queue entry)

```sql
id              uuid PRIMARY KEY
queue_entry_id  uuid REFERENCES queue_entries(id) ON DELETE CASCADE
service_id      uuid REFERENCES services(id)
price_at_time   numeric(10,2)  -- snapshot — service prices can change
duration_at_time int  -- snapshot
```

#### `service_timings` (the algorithm’s learning data)

```sql
id              uuid PRIMARY KEY
salon_id        uuid REFERENCES salons(id) NOT NULL
stylist_id      uuid REFERENCES stylists(id) NOT NULL
queue_entry_id  uuid REFERENCES queue_entries(id)
service_signature text NOT NULL  -- e.g., 's1+s2' for haircut+beard combo
total_duration_seconds int NOT NULL
recorded_at     timestamptz DEFAULT now()
day_of_week     int  -- 0-6, for context-aware analysis
hour_of_day     int  -- 0-23
```

#### `customers_salons` (the customer-salon relationship; defines “new” vs “existing”)

```sql
id              uuid PRIMARY KEY
salon_id        uuid REFERENCES salons(id)
user_id         uuid REFERENCES users(id)  -- if registered
phone           text NOT NULL  -- fallback if user_id is null
first_visit_at  timestamptz NOT NULL
last_visit_at   timestamptz
total_visits    int DEFAULT 1
total_spend     numeric(10,2) DEFAULT 0
acquired_via    text  -- 'skipq' | 'walk_in' | 'salon_existing' (set at onboarding)
attribution_window_ends_at timestamptz  -- 90 days after first visit; while this is in future, salon owes ₹20/visit for repeats
UNIQUE(salon_id, phone)
```

#### `style_records` (the supporting feature)

```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id) NOT NULL
queue_entry_id  uuid REFERENCES queue_entries(id) NOT NULL
salon_id        uuid REFERENCES salons(id)
stylist_id      uuid REFERENCES stylists(id)
service_summary text  -- 'Haircut + beard'
stylist_notes   text  -- 'Fade #2→#4, 2 inches on top'
customer_notes  text  -- 'Loved the fade, want slightly longer next time'
photos          text[]  -- array of image URLs
rating          int  -- 1-5
created_at      timestamptz DEFAULT now()
```

#### `invoices` (salon billing)

```sql
id              uuid PRIMARY KEY
salon_id        uuid REFERENCES salons(id) NOT NULL
period_start    date NOT NULL
period_end      date NOT NULL
new_customer_count int DEFAULT 0
lead_fee_amount numeric(10,2) DEFAULT 0
commission_amount numeric(10,2) DEFAULT 0
ad_amount       numeric(10,2) DEFAULT 0
total_amount    numeric(10,2) NOT NULL
status          text DEFAULT 'pending'  -- 'pending' | 'paid' | 'disputed' | 'overdue'
issued_at       timestamptz DEFAULT now()
due_at          timestamptz
paid_at         timestamptz
razorpay_link   text
razorpay_payment_id text
```

#### `payments` (incoming customer payments via app)

```sql
id              uuid PRIMARY KEY
queue_entry_id  uuid REFERENCES queue_entries(id)
user_id         uuid REFERENCES users(id)
salon_id        uuid REFERENCES salons(id)
amount          numeric(10,2) NOT NULL
commission      numeric(10,2)  -- skipQ's cut
salon_payout    numeric(10,2)  -- what salon receives next day
razorpay_order_id text
razorpay_payment_id text
status          text  -- 'pending' | 'paid' | 'refunded'
created_at      timestamptz DEFAULT now()
paid_at         timestamptz
settled_at      timestamptz  -- when paid out to salon
```

#### `reviews`

```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
salon_id        uuid REFERENCES salons(id)
stylist_id      uuid REFERENCES stylists(id)
queue_entry_id  uuid REFERENCES queue_entries(id)
rating          int NOT NULL  -- 1-5
text            text
created_at      timestamptz DEFAULT now()
```

#### `notifications_log`

```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
queue_entry_id  uuid REFERENCES queue_entries(id)
channel         text  -- 'whatsapp' | 'sms' | 'push'
template        text
content         text
sent_at         timestamptz DEFAULT now()
delivered       boolean
read            boolean
```

### Indexes (essential for performance)

```sql
CREATE INDEX idx_salons_location ON salons USING GIST (location);
CREATE INDEX idx_salons_status ON salons (status) WHERE status = 'active';
CREATE INDEX idx_queue_entries_salon_status ON queue_entries (salon_id, status);
CREATE INDEX idx_queue_entries_user ON queue_entries (user_id);
CREATE INDEX idx_service_timings_stylist_service ON service_timings (stylist_id, service_signature);
CREATE INDEX idx_customers_salons_phone ON customers_salons (salon_id, phone);
```

### Row-Level Security (RLS)

Critical for Supabase. Examples:

- Users can only read/update their own profile
- Partner users can only see queue entries for their salon
- Stylists can only see their own queue (not other stylists’ customers)
- Public can read active salons but not partner_users data

-----

## 12. TECHNICAL STACK

### Frontend

#### Customer mobile app

- **Framework:** React Native + Expo
- **Why Expo:** Fast iteration, OTA updates, no Mac needed for iOS later, Push notifications built-in
- **State management:** Zustand (lighter than Redux, sufficient)
- **Navigation:** React Navigation 6
- **Styling:** NativeWind (Tailwind for RN)
- **Maps:** react-native-maps + Google Maps
- **Forms:** react-hook-form
- **API client:** Supabase JS client
- **Notifications:** expo-notifications + OneSignal

#### Salon dashboard

- **Framework:** Next.js 14 (App Router)
- **Why Next.js:** Server components, fast development, deploy on Vercel
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand
- **Realtime:** Supabase Realtime subscriptions for live queue updates
- **Forms:** react-hook-form + Zod
- **Tables:** TanStack Table

#### Admin dashboard

- Use the same Next.js project as salon dashboard, with role-based routing
- Routes: `partner.skipq.in/admin/*` for skipQ team

### Backend

#### Primary backend: Supabase

- **Why:** Auth + Postgres + Realtime + Storage + Edge Functions in one. Generous free tier. Scales to thousands of users without intervention.
- **Auth:** Phone OTP via Supabase Auth + Twilio (or RouteMobile SMS)
- **Database:** Postgres 15 with PostGIS for geo queries
- **Realtime:** Supabase Realtime for queue position updates
- **Storage:** Supabase Storage for photos
- **Edge Functions:** Deno-based serverless functions for:
  - Queue position recalculation
  - Invoice generation (weekly cron)
  - Notification dispatch
  - Lead-fee attribution logic

#### Integrations

- **WhatsApp:** RouteMobile WhatsApp Business API (already in use at kairalitrails)
- **SMS:** RouteMobile SMS
- **Push:** OneSignal (free tier sufficient for 50k users)
- **Payments:** Razorpay (lower fees than Stripe in India, native UPI)
- **Maps:** Google Maps (Places API, Directions API, Geocoding)
- **Analytics:** PostHog (open source, self-hostable) or Mixpanel
- **Error tracking:** Sentry (free tier)

### Infrastructure

- **Backend hosting:** Supabase managed (no servers to manage in Phase 1)
- **Frontend hosting (web):** Vercel (free tier)
- **Domain:** skipq.in (customer-facing), partner.skipq.in (salon dashboard), api.skipq.in (if custom endpoints needed)
- **CDN:** Vercel Edge (automatic) + Supabase Storage CDN
- **Mobile app distribution:**
  - Android: Google Play Store
  - iOS: App Store (Year 2)
- **CI/CD:** GitHub Actions

### Monitoring & Observability

- **Logs:** Supabase logs + Vercel logs
- **Uptime:** UptimeRobot (free)
- **Performance:** Vercel Analytics
- **Database monitoring:** Supabase dashboard (queries, slow logs)

-----

## 13. API SPECIFICATION

### Auth endpoints

#### `POST /api/auth/send-otp`

```json
Request: { "phone": "+916282640278" }
Response: { "success": true, "expires_in": 300 }
```

#### `POST /api/auth/verify-otp`

```json
Request: { "phone": "+916282640278", "otp": "123456" }
Response: { "user": {...}, "session": {...} }
```

### Salon discovery

#### `GET /api/salons/nearby`

```
Query params:
  lat: float
  lng: float
  radius_km: int (default 5)
  filter: string (optional: 'no_wait', 'top_rated', 'mens', 'ladies')
  
Response:
  {
    "salons": [
      {
        "id": "uuid",
        "name": "Studio Lumière",
        "tagline": "Premium Unisex Salon",
        "distance_km": 0.4,
        "wait_time_min": 22,
        "queue_ahead": 3,
        "rating": 4.8,
        "review_count": 1247,
        "cover_image": "https://...",
        "price_from": 350,
        "open": true,
        "featured": true,
        "badges": ["Fast service", "Top rated"]
      },
      ...
    ]
  }
```

#### `GET /api/salons/:id`

```
Response:
  {
    "salon": {...full details...},
    "stylists": [...],
    "services": [...],
    "live_queue": {
      "wait_time_min": 22,
      "queue_ahead": 3,
      "estimated_next_slot": "2026-05-28T16:47:00Z"
    },
    "user_history": {  // if logged in
      "last_visit_at": "2026-05-14T12:00:00Z",
      "last_stylist": "Arjun M",
      "total_visits": 3
    }
  }
```

### Queue management

#### `POST /api/queue/join`

```json
Request:
  {
    "salon_id": "uuid",
    "service_ids": ["uuid1", "uuid2"],
    "preferred_stylist_id": "uuid" (optional)
  }
Response:
  {
    "queue_entry_id": "uuid",
    "position": 4,
    "estimated_wait_min": 22,
    "estimated_serve_time": "2026-05-28T16:47:00Z"
  }
```

#### `GET /api/queue/my-active`

```
Response:
  {
    "active": true,
    "queue_entry": {
      "id": "uuid",
      "salon_id": "uuid",
      "salon_name": "Studio Lumière",
      "position": 4,
      "estimated_wait_min": 22,
      "status": "waiting",
      "services": [...]
    }
  }
```

#### `DELETE /api/queue/:queue_entry_id`

Cancel/leave queue.

### Salon dashboard endpoints

#### `GET /api/partner/queue`

Live queue for the salon (requires partner_user auth).

#### `POST /api/partner/queue/:id/arrived`

Mark customer as arrived.

#### `POST /api/partner/queue/:id/start`

Start service (begins timer).

#### `POST /api/partner/queue/:id/complete`

Complete service. Triggers algorithm update.

#### `POST /api/partner/queue/:id/no-show`

Mark as no-show.

#### `POST /api/partner/queue/walk-in`

Add a walk-in customer manually (receptionist enters phone).

### Realtime subscriptions

```javascript
// Customer subscribes to their queue position
supabase
  .channel(`queue:${queue_entry_id}`)
  .on('postgres_changes', { 
    event: 'UPDATE', 
    schema: 'public', 
    table: 'queue_entries', 
    filter: `id=eq.${queue_entry_id}` 
  }, handleUpdate)
  .subscribe()

// Salon subscribes to all queue changes for their salon
supabase
  .channel(`salon:${salon_id}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'queue_entries', 
    filter: `salon_id=eq.${salon_id}` 
  }, handleUpdate)
  .subscribe()
```

-----

## 14. SECURITY & PRIVACY

### Authentication

- Phone OTP only (no passwords for customers — reduces friction and breach risk)
- Partner users: phone OTP for primary auth, optional password for desktop dashboard
- Session tokens: JWT via Supabase Auth, 30-day expiry, refresh token rotation

### Data security

- **All PII encrypted at rest** via Postgres encryption
- **TLS 1.3** for all client-server communication
- **RLS policies** on every table — never use service_role key from client
- **Photos in Supabase Storage** — private buckets, signed URLs for access
- **Soft delete** for queue entries (audit trail) — never hard-delete customer data

### Privacy

- **Customer phone numbers belong to the customer**, not the salon. Salons see them only if customer has visited.
- **No selling of customer data** to third parties — ever. This is core to trust.
- **Customer can delete account** → full GDPR-style data wipe within 30 days
- **Customer can download their data** as JSON export
- **Photos uploaded by customer** are owned by them; salon cannot use for marketing without explicit opt-in

### Compliance

- **Privacy Policy:** Required for Play Store + App Store. Draft via lawyer (₹10-15k).
- **Terms & Conditions:** Same.
- **Data localisation:** Indian customer data stored in India region (Supabase ap-south-1 available).
- **GST registration:** Mandatory once revenue >₹20L/year. Salon invoices must show GST.

### Security audit checklist (before launch)

- [ ] All API endpoints rate-limited (Supabase Edge Functions)
- [ ] No secrets in client-side code (only public anon keys)
- [ ] RLS policies tested for every table
- [ ] Phone number validation prevents enumeration attacks
- [ ] OTP brute-force protection (max 5 attempts, 15 min cooldown)
- [ ] HTTPS enforced everywhere
- [ ] No PII in logs
- [ ] Backup strategy: daily automated DB snapshots (Supabase default)

-----

## 15. IMPLEMENTATION ROADMAP

### Phase 0: Foundation (Weeks 1-2)

- [ ] Set up Supabase project
- [ ] Set up Vercel deployment
- [ ] Set up GitHub repos (3 — mobile app, salon dashboard, shared types)
- [ ] Domain registration (skipq.in)
- [ ] Set up RouteMobile WhatsApp templates
- [ ] Set up Razorpay test account
- [ ] Database schema migration 001 — core tables

### Phase 1: MVP (Weeks 3-10)

#### Weeks 3-4: Salon dashboard core

- [ ] Partner login (phone OTP)
- [ ] Salon profile creation
- [ ] Service menu management
- [ ] Stylist management
- [ ] Empty queue state

#### Weeks 5-6: Customer app core

- [ ] Customer onboarding (phone OTP)
- [ ] Location detection
- [ ] Nearby salons list
- [ ] Salon detail page
- [ ] Service selection

#### Weeks 7-8: Queue logic

- [ ] Join queue flow (customer side)
- [ ] Live queue dashboard (salon side)
- [ ] Status updates (arrived, started, completed)
- [ ] Realtime sync
- [ ] Basic wait-time algorithm (v1)

#### Weeks 9-10: Notifications & polish

- [ ] WhatsApp templates and dispatch
- [ ] Push notifications
- [ ] Customer history view
- [ ] Salon daily analytics (basic)
- [ ] Bug fixes, polish, beta testing with 2-3 friendly salons

### Phase 2: Pilot launch (Weeks 11-16)

- [ ] Onboard first 10 salons in Kochi
- [ ] Daily monitoring + bug fixes
- [ ] Collect feedback systematically
- [ ] WhatsApp queue join (no-download option)
- [ ] Style notes & photo upload (post-service)
- [ ] Algorithm v2 — per-stylist learning
- [ ] Review/rating system

### Phase 3: Monetization (Weeks 17-24)

- [ ] Invoice generation system
- [ ] Lead fee billing rollout
- [ ] Razorpay integration (full)
- [ ] In-app payment flow
- [ ] Salon settlement system
- [ ] Featured listings infrastructure

### Phase 4: Scale (Months 7-12)

- [ ] Onboard 100 salons
- [ ] Marketing campaigns
- [ ] skipQ Pro tier launch
- [ ] Advanced analytics
- [ ] iOS app
- [ ] Customer subscription (skipQ Plus)

### Critical milestones

|Milestone         |Target date|Definition of done                     |
|------------------|-----------|---------------------------------------|
|MVP complete      |Week 10    |5 internal users can complete full flow|
|First salon live  |Week 12    |Real customers joining queues via skipQ|
|10 salons live    |Week 16    |10 active salons, 100+ daily queues    |
|First invoice paid|Week 20    |First ₹50 lead fee collected           |
|50 salons live    |Month 7    |50 salons, ₹1L+ MRR                    |
|Cash-flow positive|Month 10   |MRR > monthly costs                    |
|100 salons live   |Month 12   |Mature Kochi market                    |

-----

## 16. SUCCESS METRICS

### North Star Metric

**Weekly Active Queues per Salon (WAQS)** — number of unique customers per salon per week who completed a queue via skipQ.

Why this matters: A salon with high WAQS is a salon that loves skipQ and will pay for it. A salon with low WAQS will churn.

Target: WAQS ≥ 30 by month 6 for retained salons.

### Customer-side KPIs

- **DAU/MAU ratio:** Target >25% (means people use it more than monthly)
- **Time to first queue join:** Target <5 min from app install
- **Queue completion rate:** Target >75% (people don’t leave queue before being served)
- **Repeat queue rate (30-day):** Target >40% (they come back)
- **Customer NPS:** Target >40 by month 6

### Salon-side KPIs

- **Salon activation rate:** % of onboarded salons that have ≥10 queue entries in their first week. Target >70%.
- **Salon retention (90-day):** Target >80%
- **Salon NPS:** Target >50
- **% of salon’s customers using skipQ:** Target >30% by month 6 (proves the salon is pushing skipQ to customers)

### Business KPIs

- **CAC (customer):** Target <₹40 by month 12
- **CAC (salon):** Target <₹2,000 by month 12
- **LTV/CAC ratio:** Target >5
- **Gross margin:** Target >70% (digital product, low marginal cost)
- **MRR growth:** Target 25%+ MoM for first 12 months

### Algorithm accuracy

- **ETA accuracy:** Target ±5 minutes for 80% of bookings by month 6
- **No-show prediction:** Track but don’t act on until v2

-----

## 17. ANTI-BYPASS MECHANISMS

A real risk: salons take skipQ-shown customers but bypass the platform to avoid lead fees.

### Defense layers

#### Layer 1: Customer attribution is automatic, not manual

- Customer joins queue via skipQ → entry exists in our database
- Salon can’t claim “this person walked in” because the record proves otherwise
- Phone number matching prevents disputes

#### Layer 2: Customer benefits drive app usage

Customer who walks in directly without using skipQ gets:

- No skipQ Plus benefits
- No loyalty points
- No saved stylist preferences
- Random position in queue (behind virtual queue)

#### Layer 3: Salon-side enforcement (counter-intuitive)

The salon’s receptionist is *trained* to check skipQ first. A walk-in physically present at the salon is served AFTER the 4 people already in skipQ’s virtual queue, because those 4 booked first (even if from home).

This creates social pressure for customers to use the app. Within 2-3 visits, customers learn to book virtually because walking in means waiting longer.

#### Layer 4: New customer attribution is generous, not greedy

Lead fee applies only to NEW customers (never visited this salon before). Repeat customers and the salon’s existing base are free forever. This eliminates the salon’s main motive to cheat — they’re not paying for their own loyal customers.

#### Layer 5: Public transparency

Salons with high dispute rates get downranked in search. Salons with <2% dispute rate get a “skipQ verified” badge. Reputation matters.

#### Layer 6: Customer-side confirmation

When customer marks “I was served” in app (to unlock loyalty/history), that’s the source of truth, not the salon’s claim. The customer has no incentive to lie.

### What we explicitly DON’T do

- Don’t require exclusivity from salons (illegal in some interpretations, and we don’t need it)
- Don’t lock customer data so salons can’t access — that breaks trust
- Don’t penalize honest mistakes — only patterns of fraud

### Expected bypass leakage

Realistic estimate: 10-15% of customers will bypass occasionally. Bake this into financial models. The remaining 85% volume is the business.

-----

## 18. EDGE CASES & FAILURE MODES

### Queue edge cases

- **What if a customer joins queue but doesn’t show up?** Mark as no-show after 15 min past their slot. They lose loyalty points + future priority. Salon doesn’t pay lead fee for no-shows.
- **What if all stylists are busy and queue is empty (no waiting customers)?** Show “Avg wait 15 min based on current bookings.”
- **What if the salon’s internet goes down?** Receptionist can manage queue offline (Service Worker), syncs when online.
- **What if a stylist suddenly leaves mid-service?** Receptionist taps “Reassign” → algorithm proposes alternative.
- **What if customer wants to add a service mid-queue?** Allow “modify booking” until service starts.
- **What if customer wants to switch stylist?** Allowed until their service starts — recalculate position.

### Algorithm edge cases

- **New salon with no historical data:** Use service catalog defaults for first 50 services, then start learning.
- **Stylist with <10 completed services:** Show range “15-25 min” not point estimate.
- **Service combo never seen before:** Use sum of individuals × 0.9 (combo discount).
- **Crazy outlier service times:** Cap at 3× median. A 4-hour haircut shouldn’t poison the average.

### Payment edge cases

- **Customer pays via skipQ but salon claims they didn’t show up:** Refund customer, investigate salon, may suspend if pattern emerges.
- **Salon’s UPI ID is wrong:** Hold payouts, notify salon, manual reconciliation.
- **Razorpay payment fails:** Retry once, then notify customer and salon — they can pay cash at salon as fallback.

### Acquisition edge cases

- **Customer joins queue without any account (WhatsApp flow):** Track by phone number, create user record on first interaction. Convert to app user when they engage.
- **Customer has multiple phones:** Each phone is a separate account. Linking via email can be added in v2.

### Business edge cases

- **Salon owner disputes invoice:** Allow them to flag specific bookings. If fewer than 5% of bookings disputed, auto-accept the dispute. If more, investigate.
- **Salon owner refuses to pay:** After 14 days overdue, suspend (don’t show in customer feed). After 30 days, full removal.
- **Customer abuse (joining queue repeatedly without showing up):** After 3 no-shows in 30 days, require ₹50 deposit to join queues. Refunded if they show.

-----

## 19. GLOSSARY

|Term                  |Definition                                                                |
|----------------------|--------------------------------------------------------------------------|
|**Queue entry**       |A single customer’s booking in a salon’s queue                            |
|**Lead fee**          |₹50 charged to salon per NEW customer brought by skipQ                    |
|**Attribution window**|90 days after first visit during which customer counts as “skipQ-acquired”|
|**WAQS**              |Weekly Active Queues per Salon (north star metric)                        |
|**Style record**      |A customer’s saved haircut details + photos from past visits              |
|**Stylist**           |Individual service provider at a salon (barber, hairstylist)              |
|**Partner user**      |Any user account belonging to a salon — owner, receptionist, or stylist   |
|**Featured listing**  |Paid promotion in top 3 search results for an area                        |
|**Walk-in**           |Customer who arrives at salon without joining queue via app               |
|**No-show**           |Customer in queue who doesn’t arrive within 15 min of their slot          |
|**Bypass**            |Salon serves a skipQ-shown customer but doesn’t log it through skipQ      |

-----

## APPENDIX A: ENVIRONMENT VARIABLES

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # server-side only, never client

# RouteMobile
ROUTEMOBILE_API_KEY=
ROUTEMOBILE_WHATSAPP_NUMBER=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Google
GOOGLE_MAPS_API_KEY=

# OneSignal
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=

# App
APP_ENV=development|staging|production
APP_URL=https://skipq.in
PARTNER_URL=https://partner.skipq.in
```

## APPENDIX B: CRITICAL “DO NOT DO” LIST

When building skipQ, NEVER do these:

1. **Don’t sell customer phone numbers to third parties.** Ever. Even if profitable.
1. **Don’t show salons each other’s data.** Each salon sees only their own customers/queue.
1. **Don’t make wait time predictions before having ≥10 data points** for a stylist. Show range instead.
1. **Don’t allow salons to delete past queue entries.** Audit trail matters.
1. **Don’t use `service_role` key on the client.** It bypasses RLS and is a critical breach risk.
1. **Don’t ship without rate limiting.** OTP endpoints especially.
1. **Don’t show exact phone numbers to stylists.** Mask middle digits in stylist view.
1. **Don’t promise things the algorithm can’t deliver.** Better to say “~25 min” than be wrong about “22 min”.
1. **Don’t add fees customers can’t see upfront.** Transparent pricing always.
1. **Don’t change the salon’s commission rate without 30-day notice.** Trust matters.

## APPENDIX C: REPO STRUCTURE RECOMMENDATION

```
skipq/
├── apps/
│   ├── customer-mobile/        # React Native + Expo
│   │   ├── app/                # Expo Router routes
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/             # Zustand stores
│   │   └── lib/
│   ├── partner-web/            # Next.js — salon + admin dashboard
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (partner)/      # salon-side routes
│   │   │   └── admin/          # skipQ team routes
│   │   ├── components/
│   │   └── lib/
│   └── customer-web/           # Optional: customer browser version
├── packages/
│   ├── shared-types/           # TypeScript types shared across apps
│   ├── shared-ui/              # Shared design system (if needed)
│   └── api-client/             # Supabase client wrapper
├── supabase/
│   ├── migrations/             # SQL migrations, numbered
│   ├── functions/              # Edge functions (Deno)
│   ├── seed.sql                # Seed data for dev
│   └── config.toml
├── docs/
│   ├── SPEC.md                 # This document
│   ├── ARCHITECTURE.md         # Tech architecture deep dive
│   ├── API.md                  # API documentation
│   └── BRAND.md                # Brand guidelines
├── .github/
│   └── workflows/              # CI/CD
├── package.json                # Monorepo root
├── turbo.json                  # Turborepo config
└── README.md
```

Use Turborepo for monorepo management. Single `pnpm install` at root.

-----

## APPENDIX D: CLAUDE CODE INSTRUCTIONS

When using Claude Code to build this system:

### Suggested initial prompts

1. **Bootstrap:** “Set up the monorepo structure as described in Appendix C. Initialize Turborepo, pnpm workspaces, and stub each app with a hello-world.”
1. **Database first:** “Generate Supabase migration files for all tables in Section 11. Include indexes, RLS policies, and triggers. Then generate TypeScript types from the schema.”
1. **Auth flow:** “Build the customer phone OTP login in the React Native app. Use Supabase Auth with phone provider. Include OTP screen, rate limiting, and error handling.”
1. **Salon dashboard core:** “Build the salon onboarding flow in Next.js: signup → profile setup → service menu → stylist setup → go live. Use server actions and Zod validation.”
1. **Queue logic:** “Implement the join-queue flow end-to-end: customer selects services → API creates queue_entry → algorithm calculates position and ETA → realtime subscription pushes updates to customer app. Include comprehensive error handling.”
1. **Algorithm:** “Implement the wait-time algorithm v1 from Section 10. Create a service `lib/algorithm/calculateWaitTime.ts` with full type safety and unit tests.”

### Key principles for Claude Code

- **Always write types first.** Generate Supabase types, then build features on top.
- **Test the algorithm aggressively.** Wait-time accuracy is the product moat.
- **Mobile-first responsive on partner dashboard.** Salons use phones, not desktops.
- **Optimistic UI updates** with rollback on failure (critical for queue UX).
- **Offline-first for partner dashboard.** Internet drops in Indian salons happen often.

-----

**END OF SPECIFICATION**

This document is living. Update version + date at top whenever materially changed. Major changes should be discussed with stakeholders before commit.

**Contact:**

- Jazil Sameer, Co-Founder — [jazil@skipq.in](mailto:jazil@skipq.in)
- Shreejesh, Tech Lead — [tech@skipq.in](mailto:tech@skipq.in)