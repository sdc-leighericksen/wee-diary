# Wee Diary 💧

A private, mobile-first Progressive Web App (PWA) for bladder health tracking. Designed for paediatric use, Wee Diary makes it easy to log fluid intake, bathroom trips, and continence product changes — then export a clinical-quality PDF report for healthcare appointments.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Getting Started (Local Development)](#getting-started-local-development)
- [Environment Variables](#environment-variables)
- [Demo Mode](#demo-mode)
- [Architecture](#architecture)
- [Appwrite Setup](#appwrite-setup)
- [Docker Installation](#docker-installation)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)

---

## Features

### Core Logging
- **Fluid intake** — Log drinks, soups, desserts, dairy, supplements, and water-rich foods across 6 categorised groups with quick-select amounts (200 ml / 250 ml / 350 ml / 500 ml) or a custom stepper
- **Bathroom trips (void)** — Record urgency level (0–5 scale), measured urine volume, and whether a leak occurred with a leak size indicator
- **Product changes** — Track continence pad changes with fullness level, change reason, and optional wet-weight measurement to estimate urine absorbed; supports multiple saved products with their dry weights

### Dashboard
- Time-of-day greeting with the WeeDiary wordmark
- Today's stats at a glance: fluid total vs. daily target with a progress bar, void count, leak count, and change count
- Scrollable list of today's entries — **long-press any row (600 ms hold) to delete** with inline confirmation
- Quick-action buttons: "Used the loo" (full width), "Had a drink/food", and "Changed"

### History
- Day-by-day accordion view of all past entries
- Tap a day to expand and see individual entries with icons, times, and details
- Trash icon on each entry for direct deletion (two-tap confirm)

### Insights
- Charts powered by Recharts: fluid intake over time, void frequency, urgency trends
- Toggle between 7-day, 14-day, and 30-day ranges
- Daily fluid balance (in vs. out) visualisation

### Export
- Generate a branded A4 PDF report via jsPDF + autotable
- Configurable date range
- Includes: daily summary table, full entry log with times and details, patient name header
- Download directly from the browser

### Reminders
- Smart reminder configuration stored in Appwrite
- Enable/disable reminder hour setting

### Settings
- Display name (shown in dashboard greeting)
- Daily fluid target (ml)
- Continence product library — add products with name and dry weight (g) for pad urine estimation

### PWA
- Installable on iOS and Android from the browser ("Add to Home Screen")
- Portrait-only, standalone display — feels like a native app
- Service worker via Workbox caches all assets; Appwrite API calls use NetworkFirst with a 5-second timeout for offline resilience
- App icons at 192×192 and 512×512

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18 |
| **Build tool** | Vite 5 |
| **Routing** | React Router 6 |
| **State management** | Zustand 4 (with `persist` middleware) |
| **Backend / Auth / DB** | Appwrite (self-hosted) |
| **Charts** | Recharts |
| **PDF generation** | jsPDF + jsPDF-autotable |
| **Icons** | Lucide React |
| **PWA** | vite-plugin-pwa + Workbox |
| **Fonts** | Museo Sans Rounded (OTF, local), Poppins (Google Fonts) |
| **Styling** | CSS custom properties, mobile-first |
| **Containerisation** | Docker (multi-stage) + Nginx |

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js)
- **Docker** and **Docker Compose** — for containerised deployment
- **An Appwrite instance** — self-hosted or [Appwrite Cloud](https://appwrite.io)
  - A project, database, and two collections (see [Appwrite Setup](#appwrite-setup))

---

## Getting Started (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/wee-diary.git
cd wee-diary
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env   # or create .env manually — see below
```

Edit `.env` with your Appwrite credentials (see [Environment Variables](#environment-variables)).

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Tip:** For UI development without an Appwrite instance, enable [Demo Mode](#demo-mode).

---

## Environment Variables

Create a `.env` file in the project root. All variables are prefixed with `VITE_` so Vite exposes them to the browser bundle.

| Variable | Description | Example |
|---|---|---|
| `VITE_APPWRITE_ENDPOINT` | Full URL to your Appwrite API | `https://appwrite.example.com/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Appwrite project ID | `69b3fe420015afd3fb3e` |
| `VITE_APPWRITE_DATABASE_ID` | Appwrite database ID | `wee-diary-db` |
| `VITE_APPWRITE_ENTRIES_COLLECTION_ID` | Collection ID for diary entries | `diary_entries` |
| `VITE_APPWRITE_REMINDERS_COLLECTION_ID` | Collection ID for reminders | `reminders` |
| `VITE_VAPID_PUBLIC_KEY` | VAPID key for push notifications (optional) | `BO3...` |
| `VITE_DEMO` | Enable demo mode — bypass auth | `false` |

Example `.env`:

```env
VITE_APPWRITE_ENDPOINT=https://appwrite.nimbuscloud.au/v1
VITE_APPWRITE_PROJECT_ID=69b3fe420015afd3fb3e
VITE_APPWRITE_DATABASE_ID=wee-diary-db
VITE_APPWRITE_ENTRIES_COLLECTION_ID=diary_entries
VITE_APPWRITE_REMINDERS_COLLECTION_ID=reminders
VITE_VAPID_PUBLIC_KEY=placeholder
VITE_DEMO=false
```

> **Important:** Never commit `.env` to version control. Add it to `.gitignore`.

---

## Demo Mode

Demo mode bypasses Appwrite authentication entirely, allowing you to develop and test the UI locally without any backend.

**Enable:**
```env
VITE_DEMO=true
```

**Disable (production / real auth):**
```env
VITE_DEMO=false
```

When `VITE_DEMO=true`:
- `ProtectedRoute` renders children unconditionally — no login required
- Appwrite `pingAppwrite()` and `init()` are never called
- All Zustand store operations still run (entries saved in-memory only, not persisted to Appwrite)

---

## Architecture

### Directory Structure

```
wee-diary/
├── public/
│   ├── fonts/                  # Museo Sans Rounded OTF files (weights 100–1000)
│   ├── icons/                  # PWA icons (192×192, 512×512)
│   └── manifest.webmanifest    # PWA manifest
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx    # Root layout wrapper with BottomNav
│   │   │   ├── BottomNav.jsx   # Tab bar: Home, History, Insights, Settings
│   │   │   └── FAB.jsx         # Floating action button
│   │   └── ui/
│   │       ├── Button.jsx      # Primary / secondary / ghost variants
│   │       ├── Card.jsx        # Surface wrapper
│   │       ├── ChipSelector.jsx # Multi-select chip groups
│   │       ├── Logo.jsx        # WeeDiary SVG wordmark component
│   │       ├── Stepper.jsx     # Numeric input with +/− buttons
│   │       ├── TimePicker.jsx  # Datetime-local input wrapper
│   │       ├── Toggle.jsx      # Boolean on/off switch
│   │       └── UrgencySelector.jsx # 0–5 urgency scale picker
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── appwrite.js         # Appwrite client + CRUD helpers (createEntry, listEntries, etc.)
│   │   └── pdf.js              # jsPDF report generation
│   ├── pages/
│   │   ├── DashboardPage.jsx   # Today summary, quick actions, entry list
│   │   ├── LogEntryPage.jsx    # Multi-step log form (fluid / void / change)
│   │   ├── HistoryPage.jsx     # Past entries by day (accordion)
│   │   ├── InsightsPage.jsx    # Recharts visualisations
│   │   ├── ExportPage.jsx      # PDF export with date range
│   │   ├── RemindersPage.jsx   # Push reminder settings
│   │   ├── SettingsPage.jsx    # Profile, fluid target, products
│   │   └── LoginPage.jsx       # Email/password login
│   ├── stores/
│   │   ├── authStore.js        # Zustand: user session, login/logout
│   │   ├── entriesStore.js     # Zustand: CRUD for diary entries
│   │   ├── settingsStore.js    # Zustand (persisted): name, target, products
│   │   ├── remindersStore.js   # Zustand: reminder preferences
│   │   └── stampsStore.js      # Zustand: streak tracking
│   ├── App.jsx                 # Route definitions + ProtectedRoute
│   ├── index.css               # Global tokens, fonts, resets
│   └── main.jsx                # React root mount
├── Dockerfile                  # Multi-stage build (Node → Nginx)
├── docker-compose.yml          # Single-service compose config
├── nginx.conf                  # SPA routing + asset caching
└── vite.config.js              # Vite + PWA plugin config
```

### Request / Data Flow

```
User action
    │
    ▼
React component (page or UI component)
    │
    ▼
Zustand store action (entriesStore / settingsStore / authStore)
    │
    ▼
Appwrite helper in lib/appwrite.js
    │  clean() strips null/undefined before every write
    ▼
Appwrite REST API  ──►  Appwrite Database (diary_entries / reminders)
    │
    ◄── Document returned and merged into Zustand state
    │
    ▼
React re-renders with updated state
```

### Entry Types

Each diary entry stored in Appwrite has an `entryType` field:

| Type | Key Fields |
|---|---|
| `fluid` | `fluidType`, `fluidAmount` (ml) |
| `void` | `urgencyLevel` (0–5), `measured` (bool), `urineAmount` (ml), `leaked` (bool), `leakSize` |
| `change` | `changeFullness`, `changeReason`, `activityNotes` |

All entries share: `userId`, `timestamp` (ISO 8601), `entryType`.

### State Management

Zustand stores are used for all application state:

| Store | Persistence | Purpose |
|---|---|---|
| `authStore` | In-memory | Current user session, login/logout |
| `entriesStore` | In-memory | Today's/fetched entries, CRUD ops |
| `settingsStore` | `localStorage` via `persist` | Display name, fluid target, product library |
| `remindersStore` | In-memory | Reminder preferences (synced to Appwrite) |
| `stampsStore` | In-memory | Streak/habit tracking |

### PWA & Caching Strategy

| Asset type | Strategy |
|---|---|
| JS / CSS / HTML / images / fonts | **CacheFirst** (precached by Workbox, 1-year browser cache via Nginx) |
| Appwrite API calls | **NetworkFirst** with 5-second timeout (falls back to cache) |
| Service worker / manifest | **No-cache** (always fresh from server) |

---

## Appwrite Setup

### 1. Create a project

Log in to your Appwrite console and create a new project (e.g. `wee-diary`).

### 2. Create a database

Inside the project, create a database (e.g. ID: `wee-diary-db`).

### 3. Create the `diary_entries` collection

Create a collection with ID `diary_entries` and the following attributes:

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `userId` | String | Yes | Appwrite user `$id` |
| `timestamp` | String | Yes | ISO 8601 datetime |
| `entryType` | String | Yes | `fluid`, `void`, or `change` |
| `fluidType` | String | No | e.g. "Water", "Milk" |
| `fluidAmount` | Integer | No | ml |
| `urgencyLevel` | Integer | No | 0–5 |
| `measured` | Boolean | No | |
| `urineAmount` | Integer | No | ml |
| `leaked` | Boolean | No | |
| `leakSize` | String | No | "Spot", "Small", "Medium", "Large" |
| `changeFullness` | String | No | e.g. "Wet", "Soaked" |
| `changeReason` | String | No | e.g. "Scheduled", "Felt wet" |
| `activityNotes` | String | No | Free text |

Add an **index** on `userId` + `timestamp` (descending) for efficient queries.

Set **Permissions**: authenticated users can `create`, `read`, `update`, `delete` their own documents. Use document-level security with `user:{{userId}}`.

### 4. Create the `reminders` collection

Create a collection with ID `reminders` and these attributes:

| Attribute | Type | Required |
|---|---|---|
| `userId` | String | Yes |
| `enabled` | Boolean | No |
| `hour` | Integer | No |

### 5. Configure Web platform

In your Appwrite project → **Platforms** → **Add platform** → **Web**, set the hostname to your domain (e.g. `weediary.nimbuscloud.au`) and also `localhost` for development.

---

## Docker Installation

The app is packaged as a two-stage Docker image: Node 20 Alpine builds the Vite bundle, then Nginx Alpine serves the static files.

### Option A — Docker Compose (recommended)

**1. Clone and configure**

```bash
git clone https://github.com/your-org/wee-diary.git
cd wee-diary
```

Create your `.env` file with the Appwrite credentials (see [Environment Variables](#environment-variables)):

```bash
cp .env.example .env
# Edit .env with your values
```

**2. Build and start**

```bash
docker compose up --build -d
```

The app is now running at **http://localhost:3210**

**3. View logs**

```bash
docker compose logs -f
```

**4. Stop**

```bash
docker compose down
```

**5. Rebuild after code changes**

```bash
docker compose up --build -d
```

---

### Option B — Docker CLI

**Build the image:**

```bash
docker build -t wee-diary .
```

**Run the container:**

```bash
docker run -d \
  --name wee-diary \
  --restart unless-stopped \
  -p 3210:80 \
  --env-file .env \
  wee-diary
```

**Check it's running:**

```bash
docker ps
curl http://localhost:3210
```

---

### Reverse Proxy (Nginx / Caddy)

For HTTPS in production, place the container behind a reverse proxy. Example Nginx upstream block:

```nginx
server {
    listen 443 ssl;
    server_name weediary.example.com;

    ssl_certificate     /etc/ssl/certs/weediary.crt;
    ssl_certificate_key /etc/ssl/private/weediary.key;

    location / {
        proxy_pass         http://127.0.0.1:3210;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

---

### Port Reference

| Port | Where | Description |
|---|---|---|
| `3000` | Host (dev) | Vite dev server (`npm run dev`) |
| `80` | Container | Nginx inside Docker |
| `3210` | Host (prod) | Mapped from container port 80 |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 with hot module reload |
| `npm run build` | Production build — outputs to `dist/` with PWA service worker |
| `npm run preview` | Preview the production build locally |
| `docker compose up --build` | Build Docker image and start container on port 3210 |
| `docker compose up --build -d` | Same, detached (background) |
| `docker compose down` | Stop and remove the container |
| `docker compose logs -f` | Stream container logs |

---

## Troubleshooting

### App shows a blank white screen

**Cause:** Appwrite environment variables are missing or incorrect.

**Fix:** Verify all `VITE_APPWRITE_*` variables in `.env` are set and correct. Remember that in Docker the `.env` file must be present at build time (Vite bakes env vars into the bundle).

```bash
# Confirm variables are being read
docker exec wee-diary env | grep VITE
```

> **Note:** Because Vite inlines env vars at build time, changing `.env` after building requires a full rebuild (`docker compose up --build`).

---

### "Unknown attribute" error when saving

**Cause:** A field is being sent to Appwrite that doesn't exist in the collection schema.

**Fix:** The `clean()` helper in `src/lib/appwrite.js` strips `null`/`undefined` values before every write. Ensure any new field you add to the save payload also exists as an attribute in the Appwrite collection.

---

### Login fails with CORS error

**Cause:** Your domain isn't listed as an allowed Web platform in Appwrite.

**Fix:** Go to Appwrite Console → Your Project → **Platforms** → **Add platform → Web** and add your hostname (without trailing slash).

---

### PWA not installing / service worker not updating

**Fix:** Clear the browser cache and unregister the old service worker:

1. Open DevTools → Application → Service Workers
2. Click **Unregister**
3. Hard reload with `Cmd/Ctrl + Shift + R`

In production, the service worker uses `autoUpdate` mode — it will silently update in the background and take effect on the next page load.

---

### Docker container exits immediately

**Fix:** Check the logs for the error:

```bash
docker compose logs wee-diary
```

Common causes:
- Port 3210 already in use — change the port mapping in `docker-compose.yml`
- Missing `.env` file — Nginx will start fine regardless, but a malformed build step will fail

---

### Fonts not loading (headings appear in fallback font)

**Cause:** OTF font files are missing from `public/fonts/`.

**Fix:** Ensure the following files exist:

```
public/fonts/
├── MuseoSansRounded100.otf
├── MuseoSansRounded300.otf
├── MuseoSansRounded500.otf
├── MuseoSansRounded700.otf
├── MuseoSansRounded900.otf
└── MuseoSansRounded1000.otf
```

These are not included in the repository and must be copied in from licensed font files before building.

---

## Brand

| Token | Value | Usage |
|---|---|---|
| Background | `#faf085` | Page background (yellow) |
| Surface | `#ffffff` | Content cards |
| Cream | `#fef9cd` | Stat tiles, chip backgrounds |
| Near-black | `#302f2a` | Buttons, headings, icons |
| Gold | `#c1a502` | Active nav, progress bars, toggles |
| Warm grey | `#7a776c` | Secondary text, inactive nav |
| Heading font | Museo Sans Rounded | Buttons, numbers, headings |
| Body font | Poppins | All body copy |

---

## License

Private — all rights reserved. Not for redistribution.
