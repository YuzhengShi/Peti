# Part 3: Full Functionality and Refinement — Peti

## 1. CSS and User Interface (20%)

### Consistent Styling with CSS Variables

All styling is driven by CSS custom properties defined in `client/src/styles/globals.css`. Light and dark themes use the same variable names, ensuring every component inherits the correct colors without per-component overrides.

Key variable groups (`globals.css:26-58`):
- **Backgrounds**: `--bg`, `--surface`, `--glass-bg`, `--glass-bg-heavy`
- **Text**: `--text-primary`, `--text-secondary`
- **Accents**: `--accent`, `--accent-hover`
- **Glass-morphism**: `--glass-border`, `--glass-shadow`, `backdrop-filter: blur(16-24px)`

All interactive pages render inside `DraggableWindow` components — floating, draggable, resizable pixel-art windows with the `Press Start 2P` font. Animated GIF backgrounds (`city.gif` / `city-night.gif`) switch with the theme and remain visible behind the glass-morphism windows at all times.

### Dark Mode Toggle

Implemented in `client/src/hooks/useSettings.tsx` and `client/src/components/SettingsPanel.tsx`:

| Requirement | Implementation | Location |
|---|---|---|
| CSS variables for theme colors | `:root` (light) and `[data-theme="dark"]` selectors | `globals.css:26-58` |
| Persists preference in localStorage | Reads/writes under key `peti-theme` | `useSettings.tsx:77,89` |
| Respects `prefers-color-scheme` on first visit | `window.matchMedia('(prefers-color-scheme: dark)').matches` | `useSettings.tsx:78` |

The toggle is accessible from every page via the settings gear icon (bottom-left corner). Theme transitions use a smooth 0.35s CSS transition via the `.theme-transitioning` class, applied temporarily during the switch to prevent jarring color flashes.

### Responsive Design

Three breakpoints defined in `client/src/styles/globals.css`:

| Breakpoint | Target | Adaptations |
|---|---|---|
| > 768px | Desktop | Full DraggableWindow with drag/resize handles |
| 768px | Tablet | Windows expand to 90% width, resize handles hidden, root font-size 18px |
| 640px | Mobile | Windows expand to 94% width at 75vh height, navbar tightened, root font-size 17px for pixel font readability |

The pixel-art aesthetic scales naturally across devices. `DraggableWindow` components disable drag/resize on mobile and render as near-full-screen panels with rounded corners, preserving the OS-window metaphor without requiring precise pointer interaction.

---

## 2. React Components and UX (20%)

### All React Pages Fully Functional

12 pages, all implemented and connected to their API endpoints:

| Page | Route | Key Functionality |
|------|-------|-------------------|
| HomePage | `/` | Animated GIF background, Learn More modal, theme-aware |
| RegisterPage | `/register` | Client-side validation (email, username 3-20, password 8+/uppercase/number, confirm match) |
| LoginPage | `/login` | Email + password auth, navigates to `/dashboard` |
| PetCreationPage | `/pet/new` | Name input (2-20 chars), egg placeholder, redirects to `/test` |
| PersonalityTestPage | `/test` | 106-question assessment across 6 domains, auto-save per question via localStorage, resume on return, one question at a time with fade transitions |
| TestResultsPage | `/results` | LLM-generated profile via Bedrock (~20-30s), cycling status messages during generation, radar chart + "Who They Are" summary |
| ProfilePage | `/profile` | LLM-generated narrative section cards, Detail/Radar toggle with crossfade, subscale tooltip bubbles |
| DashboardPage | `/dashboard` | Pet info bar, weather widget (OpenWeatherMap), scrollable chat history, SSE streaming with typing indicator, embedded Memories overlay |
| MemoriesPage | (embedded) | Paginated + category filter + debounced search + inline edit + optimistic delete |
| AdminDashboardPage | `/admin` | Paginated user table, debounced search, role badges |
| AdminUserDetailPage | `/admin/users/:id` | User info + stats grid, role dropdown, delete with confirmation, self-edit prevention |

### Loading, Error, and Empty States

Every data-fetching page implements all three UX states using pixel-art themed copy:

| Page | Loading | Error | Empty |
|------|---------|-------|-------|
| DashboardPage | "waking up..." | "something went wrong on my end -- try again?" | Always has a pet |
| MemoriesPage | "finding our memories..." | "couldn't load memories -- tap to retry" | "nothing here yet. we're just getting started." |
| ProfilePage | "reading your profile..." | "couldn't load your profile right now" | "complete the personality test to see your profile" |
| TestResultsPage | Cycling animated messages ("reading your responses...", "analyzing patterns...", etc.) | "something went wrong scoring your test" | N/A (only reached after test) |
| AdminDashboard | "loading users..." | "couldn't load users" | "no users yet" |
| AdminUserDetail | Skeleton layout | "user not found or couldn't load" (with back button) | N/A |

Error states include retry buttons. Loading states use present-progressive tense and ellipsis to feel alive. Empty states hint at what comes next rather than stating absence.

### Optimistic Updates

Memory deletion in `MemoriesPage.tsx` uses the optimistic update pattern:

1. **Store previous state** for rollback
2. **Remove from UI immediately** (`setMemories` filters out the deleted item)
3. **Call API** (`DELETE /api/memories/:id`)
4. **On failure**: rollback UI to previous state, show toast notification (`role="status" aria-live="polite"`)

---

## 3. API Endpoints (15%)

### All Endpoints Implemented and Operational

23 endpoints across 8 route files, all registered in `api/src/index.ts`:

| Route File | Endpoints | Description |
|------------|-----------|-------------|
| `auth.ts` | 4 | register, login, logout, me |
| `memories.ts` | 4 | GET (paginated+filtered+searched), POST, PUT, DELETE |
| `pets.ts` | 3 | create (one per user), get mine, update |
| `profiles.ts` | 4 | submit results, get all, generate (Bedrock LLM), get content |
| `messages.ts` | 2 | GET (paginated, latest mode), DELETE |
| `chat.ts` | 1 | POST with SSE streaming via Docker container |
| `weather.ts` | 1 | GET (OpenWeatherMap proxy) |
| `admin.ts` | 4 | list users, get detail, update role, delete (cascade) |

All data is saved to PostgreSQL via Prisma ORM. The API follows a consistent response envelope:
- Success: `{ data: T }` or `{ data: T[], pagination: { page, pageSize, total, totalPages } }`
- Error: `{ error: { code: string, message: string, details?: unknown } }`

### Server-Side Validation

Every mutation endpoint validates input and returns 400 with structured errors:

| Endpoint | Validations |
|----------|------------|
| POST /auth/register | Email format, unique email, unique username, password hashing (bcrypt cost 12) |
| POST /memories | Content required + max 2000 chars, category enum, importance 1-5 |
| POST /pets | Name 2-20 chars, one pet per user |
| POST /profiles | Valid dimensionType, valid scores JSON |
| PUT /admin/users/:id | Valid role value, self-delete prevention |

### Pagination, Filtering, and Search on List Endpoint

`GET /api/memories` supports all three:
- **Pagination**: `?page=1&pageSize=20` (default), max pageSize 100, uses Prisma `skip`/`take`
- **Filtering**: `?category=observation` filters by memory category
- **Search**: `?search=keyword` performs text search across memory content

`GET /api/admin/users` also supports pagination and search.

---

## 4. Role-Based Security (15%)

### Token Cookie Authentication

JWT tokens stored as HttpOnly + SameSite=Lax cookies. The `secure` flag derives from `config.frontendUrl.startsWith('https')` to support both HTTP and HTTPS deployments. Frontend sends `credentials: 'include'` on every fetch. Backend CORS allows credentials from the exact frontend origin.

### Two Roles with Different Permissions

| Role | Capabilities |
|------|-------------|
| **user** (default) | Create/manage own pet, take personality test, view own profile, chat with own pet, manage own memories |
| **admin** | All user permissions + view all users (paginated+search), view any user's data, change roles, delete accounts (cascade) |

### Middleware

**`requireAuth`** (`api/src/middleware/requireAuth.ts`):
- Reads token from `req.cookies.token`
- Verifies JWT, attaches `{ userId, role }` to `req.user`
- Returns 401 on missing/invalid token

**`requireRole`** (`api/src/middleware/requireRole.ts`):
- Checks `req.user.role` against required role
- Returns 403 if role doesn't match
- Usage: `router.use(requireAuth, requireRole('admin'))`

**`requireInternal`** (`api/src/middleware/requireInternal.ts`):
- Validates `x-internal-secret` header for server-to-server (MCP tool) requests

### Conditional UI Rendering Based on Role

- `AdminRoute` component (`client/src/components/AdminRoute.tsx`) guards admin pages — checks `user.role === 'admin'`, redirects to `/` otherwise
- Navbar conditionally shows "Admin" link only for admin users (`Navbar.tsx`)
- `AdminUserDetailPage` prevents self-role-change and self-deletion
- `ProtectedRoute` handles authentication redirects for all protected pages

---

## 5. Search, Filtering, and Pagination (10%)

### Search with 300ms Debounce

`client/src/hooks/useDebounce.ts` implements a generic debounce hook (default 300ms). Used in:

- **MemoriesPage**: debounced search input filters memories by content (`?search=` param)
- **AdminDashboardPage**: debounced search input filters users by username/email

The debounced value drives the API fetch via `useEffect` dependency — no API calls during typing, only after 300ms of inactivity.

### Filtering

MemoriesPage includes a category filter dropdown with options: all, observation, strategy, preference, milestone. Selecting a category appends `?category=` to the API request and re-fetches.

### Pagination

Both MemoriesPage and AdminDashboardPage implement pagination:
- Page controls (Prev / page N of totalPages / Next)
- Backend returns `pagination: { page, pageSize, total, totalPages }` in the response envelope
- Frontend tracks current page in state, passes to API wrapper as query parameter

---

## 6. Testing (5%)

33 unit tests across 4 test files using **Vitest** + **React Testing Library** + **jsdom**:

| Test File | Component | Tests | What's Tested |
|-----------|-----------|-------|---------------|
| `client/src/scoring/scoring.test.ts` | Scoring engine | 18 | `toBand` boundary thresholds, `reverseScore`, `subscalePercent`, Big Five (all-min, high-N, low-N, subscale keys), sleep (good/poor), emotion regulation (aggregate direction inversion) |
| `client/src/__tests__/RadarChart.test.tsx` | RadarChart | 5 | SVG rendering, grid hexagons (3 concentric), data points per dimension, size prop, missing dimension defaults |
| `client/src/__tests__/Navbar.test.tsx` | Navbar | 5 | Unauthenticated links, authenticated username + logout, onboarded dashboard/profile links, admin-only link, brand text |
| `client/src/__tests__/MemoriesPage.test.tsx` | MemoriesPage | 5 | Loading state text, error state + retry button, memory card rendering, empty state, optimistic delete |

Test infrastructure:
- `client/vite.config.ts` configured with vitest (jsdom environment, setupFiles, globals)
- `client/src/test-setup.ts` imports `@testing-library/jest-dom/vitest`
- Run: `cd client && npm test`

---

## 7. Web Accessibility (5%)

### Lighthouse Scores

Lighthouse accessibility reports saved in `accessibility_reports/`:

| Page | File | Score |
|------|------|-------|
| Homepage | `homepage.png` | 100 |
| Dashboard | `dashboard.png` | 100 |
| Profile | `profile.png` | 100 |

All three pages achieve 100/100 (above the 80 minimum requirement).

### Accessibility Features Implemented

- **Skip-to-content link**: `<a href="#main-content" className="skip-link">` in `App.tsx`, visible on focus
- **Semantic landmarks**: `<main id="main-content">` wrapping Routes, `<nav aria-label="Main navigation">` on Navbar
- **ARIA on dialogs**: `DraggableWindow` has `role="dialog" aria-label={title}`
- **ARIA on forms**: search inputs, filter selects, buttons all have `aria-label`
- **Live regions**: toast notifications have `role="status" aria-live="polite"`
- **Keyboard navigation**: `:focus-visible` outlines in `globals.css`, `aria-hidden="true"` on decorative elements (GIF background, modal overlays)

---

## 8. Deployment (5%)

All three components deployed on a single AWS EC2 instance:

| Component | Technology | Details |
|-----------|-----------|---------|
| **Database** | PostgreSQL 14 | Running directly on EC2 |
| **API Server** | Node.js 20 + Express | systemd service (`peti-api.service`), port 3001 |
| **Client** | Vite static build | Served by Nginx with SPA fallback |

**Reverse Proxy**: Nginx routes `/api/*` to Express backend (with SSE support), serves static assets with 1-year cache headers, and falls back to `index.html` for client-side routing.

**Live URL**: http://44.224.223.82

**Infrastructure**: EC2 t3.medium, Ubuntu 22.04, 30GB gp3, in us-west-2. Security group allows SSH (22), HTTP (80), HTTPS (443).

---

## 9. Code Quality and Attention to Detail (5%)

### Project Organization

```
peti/
├── api/                           # Backend
│   ├── prisma/                    # Schema, migrations, seed
│   ├── src/
│   │   ├── index.ts               # Express app entry, route registration
│   │   ├── config.ts              # Centralized environment config
│   │   ├── db.ts                  # Prisma singleton
│   │   ├── middleware/            # requireAuth, requireRole, requireInternal
│   │   ├── routes/                # 8 route files (auth, memories, pets, profiles, chat, messages, weather, admin)
│   │   ├── container-runner.ts    # Docker agent lifecycle
│   │   ├── profile-manager.ts     # PROFILE.md / STATE.md sync
│   │   ├── profile-generator.ts   # Bedrock LLM profile generation
│   │   └── session-store.ts       # Agent session persistence
│   └── package.json
├── client/                        # Frontend
│   ├── src/
│   │   ├── api/                   # Typed fetch wrappers (8 files)
│   │   ├── hooks/                 # useAuth, useSettings, useDebounce, useTestProgress, usePetStream, useWeather, useOnboarding
│   │   ├── components/            # Navbar, ProtectedRoute, AdminRoute, DraggableWindow, RadarChart, SettingsPanel
│   │   ├── pages/                 # 12 page components
│   │   ├── questions/             # 106-item assessment bank (6 domain files + types + index)
│   │   ├── scoring/               # 6 domain scorers + utilities + tests
│   │   ├── __tests__/             # Component tests
│   │   └── styles/globals.css     # Design system (CSS variables, animations, responsive)
│   ├── vite.config.ts
│   └── package.json
├── agent/                         # AI agent system
│   ├── character/                 # Peti's character definition files (mounted into containers)
│   └── container/                 # Docker build context (agent-runner, MCP server, Dockerfile)
├── docs/framework/                # 11 structured framework files for profile generation
├── accessibility_reports/         # Lighthouse reports (3 pages, all 100/100)
├── infra/                         # EC2 bootstrap script
├── PART1.md                       # Project planning
├── PART2.md                       # Foundation building
├── PART3.md                       # Full functionality (this file)
└── README.md                      # Project description + deployment links
```

### Code Practices

- **TypeScript throughout** — both client and API, strict mode, no `any` types except external API responses
- **Consistent API response envelope** — `{ data }` / `{ error: { code, message } }` on every endpoint
- **Meaningful names** — files named by domain (`memories.ts`, `profiles.ts`), hooks prefixed with `use`, pages suffixed with `Page`
- **No console.log statements** in production code
- **Separation of concerns** — API wrappers in `api/`, state management in `hooks/`, pure scoring logic in `scoring/`, question data in `questions/`

---

## External API Integration

**OpenWeatherMap API** integrated via `GET /api/weather` proxy endpoint (`api/src/routes/weather.ts`).

- Backend proxies the request to keep the API key server-side (never exposed to the browser)
- Supports two query modes: `?lat=&lon=` (geolocation) or `?city=` (fallback)
- Frontend `useWeather` hook (`client/src/hooks/useWeather.ts`):
  - Requests browser geolocation with 5s timeout
  - Falls back to city name on denial/timeout
  - 30-minute refresh interval
  - Weather data (temperature, description, condition) displayed in the Dashboard weather widget

---

## Video Presentation

5-minute video presentation demonstrating all pages and functionality.

YouTube link: *(to be added after recording)*

---

## Course Requirements Checklist

| # | Requirement | Implementation | Status |
|---|-------------|---------------|--------|
| 1 | Security + Role-Based Access | JWT HttpOnly cookies, `requireAuth` + `requireRole` middleware, 2 roles (user/admin), conditional UI | Done |
| 2 | Project Structure | `client/` + `api/` + `accessibility_reports/` + `PART1.md` + `README.md` | Done |
| 3 | External API | OpenWeatherMap via `/api/weather` proxy, displayed in Dashboard | Done |
| 4 | UX States (Loading/Error/Empty) | All data-fetching pages (Dashboard, Memories, Profile, Results, Admin) | Done |
| 5 | Optimistic Updates | Memory deletion with rollback + toast on failure | Done |
| 6 | Pagination + Filtering + Search | Memories page: pagination + category filter + 300ms debounced search | Done |
| 7 | Form Validation (client + server) | Register (password strength, email format, unique username), Pet creation, Memory creation | Done |
| 8 | Dark Mode Toggle | CSS variables, localStorage persistence, `prefers-color-scheme` respected | Done |
| 9 | Accessibility | Lighthouse 100/100 on 3 pages, skip-link, ARIA labels, focus-visible, semantic HTML | Done |
| 10 | Testing | 33 tests across 4 files (RadarChart, Navbar, MemoriesPage, scoring engine) | Done |
| 11 | Responsive Design | 640px mobile + 768px tablet breakpoints, DraggableWindow adapts | Done |
| 12 | Deployment | PostgreSQL + Express API + Vite client on EC2, live at http://44.224.223.82 | Done |
