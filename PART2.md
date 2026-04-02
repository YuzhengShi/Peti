# Part 2: Foundation Building — Peti

## API Development

### Prisma Tables

8 models defined in `api/prisma/schema.prisma`. The 3 core tables required for Part 2:

| Table | Primary Key | Role Field | Description |
|-------|------------|------------|-------------|
| **User** | `id` (cuid) | `role` (default `"user"`) | Auth credentials, relations to all other models |
| **Pet** | `id` (cuid) | — | One-to-one with User (`userId` unique FK) |
| **Memory** | `id` (cuid) | — | Belongs to User, soft-delete via `isActive` flag |

5 additional tables scaffolded for Part 3: `Session`, `UserProfile`, `UserState`, `ProfileResult`, `Message`.

The User table includes:
- `email` (unique, indexed)
- `username` (unique)
- `passwordHash` (bcrypt, cost 12)
- `role` (`"user"` | `"admin"`, indexed)

Database seeded with two users (`api/prisma/seed.ts`):
- Admin: `admin@peti.dev` / `Admin123` (role: `admin`)
- Test user: `test@peti.dev` / `User1234` (role: `user`) with 6 sample memories

---

### Authentication Endpoints

All auth endpoints in `api/src/routes/auth.ts`. Token cookie approach as taught in class.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Creates user with default `"user"` role, sets HttpOnly token cookie, returns user data with role |
| POST | `/api/auth/login` | Verifies credentials, sets HttpOnly token cookie, returns user data including role |
| POST | `/api/auth/logout` | Clears token cookie |
| GET | `/api/auth/me` | Returns current authenticated user (id, email, username, role, createdAt) |

Token cookie configuration (`auth.ts:64-69`):
```javascript
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000,  // 15 minutes
});
```

Login returns role in response body (`auth.ts:114`):
```javascript
return res.json({
  data: { id: user.id, email: user.email, username: user.username, role: user.role },
});
```

---

### `/ping` Endpoint

Defined in `api/src/index.ts:25-27`:

```javascript
app.get('/api/ping', (_req, res) => {
  res.json({ data: { message: 'pong' } });
});
```

---

### GET Endpoint with Pagination

`GET /api/memories` in `api/src/routes/memories.ts:10-45`.

Supports `page` and `pageSize` query parameters with defaults (page 1, pageSize 20) and bounds (pageSize capped at 100).

Response format:
```json
{
  "data": [ ...memories ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

Implementation uses Prisma `skip`/`take` with `Promise.all` for parallel count:
```javascript
const skip = (page - 1) * pageSize;
const [memories, total] = await Promise.all([
  prisma.memory.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
  prisma.memory.count({ where }),
]);
```

---

### POST Endpoint with Server-Side Validation

`POST /api/memories` in `api/src/routes/memories.ts:48-85`. Protected by `requireAuth` middleware.

Server-side validation (`memories.ts:53-67`):
- `content`: required, must be a non-empty string, max 2000 characters
- `category`: required, must be one of `observation`, `strategy`, `preference`, `milestone`
- `importance`: optional, must be an integer between 1 and 5

Returns 400 with structured error on validation failure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "content": "Content is required", "category": "Category must be one of: ..." }
  }
}
```

Returns 201 with created memory on success:
```json
{ "data": { "id": "...", "content": "...", "category": "observation", ... } }
```

---

### Middleware

**`requireAuth`** (`api/src/middleware/requireAuth.ts`):
- Reads token from `req.cookies.token`
- Verifies JWT with `jsonwebtoken`
- Attaches `{ userId, role }` to `req.user`
- Returns 401 `UNAUTHORIZED` if no token
- Returns 401 `TOKEN_EXPIRED` if verification fails

```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Token expired or invalid' } });
  }
}
```

**`requireRole`** (`api/src/middleware/requireRole.ts`):
- Checks `req.user.role` against the required role
- Returns 403 `FORBIDDEN` if role doesn't match
- Used in admin routes: `router.use(requireAuth, requireRole('admin'))`

```typescript
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    next();
  };
}
```

---

## Client Development

### Register Page

`client/src/pages/RegisterPage.tsx` — wrapped in a `DraggableWindow` component.

**Client-side validation** (`RegisterPage.tsx:16-27`):
- Email: required, regex format check (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Username: required, 3-20 characters
- Password: required, minimum 8 characters, at least one uppercase letter, at least one number (complex validation)
- Confirm password: must match password

Validation runs on submit. Field errors clear as the user types (`handleChange` deletes the error for the changed field). Server-side errors (e.g., duplicate email/username) are caught from the `ApiError` response and displayed inline.

---

### Login Page

`client/src/pages/LoginPage.tsx` — wrapped in a `DraggableWindow` component.

Accepts email and password. Client-side validation checks required fields and email format. Connects to `POST /api/auth/login` via the `useAuth` hook. On success, navigates to `/memories`. Server errors displayed in an alert box.

---

### Homepage

`client/src/pages/HomePage.tsx` — public page, no auth required.

Features:
- Hero text introducing Peti ("Hello, I'm Peti.")
- Description paragraph
- "Get Started" button (links to `/register`) and "Learn More" button (opens modal)
- When logged in, shows "View Memories" button instead
- "Learn More" modal shows 4 steps (Meet Your Pet, Know Each Other, Daily Companion, Real Help)
- Animated GIF background (city.gif light / city-night.gif dark) applied globally in `App.tsx`

**Dark mode toggle** accessible from every page via the settings gear (bottom-left corner), implemented in `client/src/components/SettingsPanel.tsx` and `client/src/hooks/useSettings.tsx`:
- Uses **CSS variables** for all theme colors (`:root` for light, `[data-theme="dark"]` for dark) in `client/src/styles/globals.css:26-58`
- **Persists** preference in localStorage under key `peti-theme` (`useSettings.tsx:77,89`)
- **Respects `prefers-color-scheme`** media query on first visit (`useSettings.tsx:78`): `window.matchMedia('(prefers-color-scheme: dark)').matches`
- Theme switch triggers a smooth 0.35s CSS transition via `.theme-transitioning` class

---

### Items List Page (Memories)

`client/src/pages/MemoriesPage.tsx` — protected by `ProtectedRoute`.

All three UX states implemented:

- **Loading state** (`MemoriesPage.tsx:49`): Spinner with pixel-themed text — `"finding our memories..."`
- **Error state** (`MemoriesPage.tsx:51-57`): Error message with "Try Again" retry button that re-fetches
- **Empty state** (`MemoriesPage.tsx:60-69`): `"nothing here yet. we're just getting started."` with a link to create first memory

Data display:
- Grid layout of glass-morphism cards showing content, category badge, importance stars, and date
- Pagination controls (Prev / page N / totalPages / Next) when more than one page
- **Optimistic delete**: memory removed from UI immediately, rolled back on API failure, toast notification on error (`MemoriesPage.tsx:37-46`)

---

### Item Insertion Page (New Memory)

`client/src/pages/MemoryCreatePage.tsx` — protected by `ProtectedRoute`, wrapped in `DraggableWindow`.

**Client-side validation** (`MemoryCreatePage.tsx:22-29`):
- Content: required, must not be empty, max 2000 characters (live character counter shown)
- Category: required, select from dropdown (observation, strategy, preference, milestone)
- Importance: must be between 1 and 5

Server-side validation errors from the API are caught and displayed inline per field. On success, navigates to `/memories`.

---

### Theme Toggle

Implemented via `client/src/hooks/useSettings.tsx` (React Context) + `client/src/styles/globals.css` (CSS variables).

| Requirement | Implementation | File:Line |
|---|---|---|
| CSS variables for theme colors | `:root` (light) and `[data-theme="dark"]` selectors | `globals.css:26-58` |
| Persists in localStorage | Reads on init, writes on change under key `peti-theme` | `useSettings.tsx:77,89` |
| Respects `prefers-color-scheme` | Checks `window.matchMedia` on first visit when no stored value | `useSettings.tsx:78` |
| Applies to document | Sets `data-theme` attribute on `document.documentElement` | `useSettings.tsx:101` |

---

### Styling

Glass-morphism design system using CSS variables throughout (`client/src/styles/globals.css`):
- `Press Start 2P` pixel font for all text
- Glass cards with `backdrop-filter: blur()` and semi-transparent backgrounds
- All interactive pages rendered inside `DraggableWindow` components (draggable title bar, resizable from 8 edges/corners, close animation)
- Animated GIF backgrounds (pixel city scene) that switch between light and dark variants
- Responsive breakpoint at 640px for mobile layouts
- Custom-styled form inputs, buttons, badges, toasts, pagination, modals

---

## Project Structure

```
peti/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma          # 8 models (User, Pet, Memory, Session, UserProfile, UserState, ProfileResult, Message)
│   │   ├── seed.ts                # Admin + test user + 6 sample memories
│   │   └── migrations/
│   │       └── ..._init-v1-full-schema/
│   ├── src/
│   │   ├── index.ts               # Express app, CORS, cookie-parser, route registration, /ping
│   │   ├── config.ts              # Environment variables
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── requireAuth.ts     # JWT token cookie verification → req.user
│   │   │   └── requireRole.ts     # Role-based access control
│   │   └── routes/
│   │       ├── auth.ts            # register, login, logout, me
│   │       ├── memories.ts        # GET (paginated), POST (validated), PUT, DELETE (soft-delete)
│   │       ├── admin.ts           # User management (admin only)
│   │       ├── pets.ts            # Pet CRUD
│   │       ├── profiles.ts        # Personality test results
│   │       ├── weather.ts         # OpenWeatherMap proxy
│   │       ├── messages.ts        # Chat message history
│   │       └── chat.ts            # SSE streaming stub
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── App.tsx                # Routes, global GIF background, settings panel
│   │   ├── main.tsx               # React entry point
│   │   ├── api/
│   │   │   ├── fetch.ts           # apiFetch<T> wrapper with credentials:'include', ApiError class
│   │   │   ├── auth.ts            # register, login, logout, getMe
│   │   │   └── memories.ts        # getMemories (paginated), createMemory, deleteMemory
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx        # Auth context provider (login, register, logout, user state)
│   │   │   └── useSettings.tsx    # Theme + background context (localStorage, prefers-color-scheme)
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Navigation bar with auth-aware links
│   │   │   ├── ProtectedRoute.tsx # Redirects to /login if not authenticated
│   │   │   ├── DraggableWindow.tsx# Floating window (drag, resize, close animation)
│   │   │   └── SettingsPanel.tsx  # Settings gear popover (theme toggle, music player)
│   │   ├── pages/
│   │   │   ├── HomePage.tsx       # Public landing page, Learn More modal
│   │   │   ├── RegisterPage.tsx   # Registration with client-side validation
│   │   │   ├── LoginPage.tsx      # Login form
│   │   │   ├── MemoriesPage.tsx   # Memories list (pagination, loading/error/empty, optimistic delete)
│   │   │   └── MemoryCreatePage.tsx # New memory form with validation
│   │   └── styles/
│   │       └── globals.css        # CSS variables, glass-morphism, animations, responsive
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
├── PART1.md
├── PART2.md
└── README.md
```

---

## Running the Project

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
# Start PostgreSQL
docker compose up -d

# API setup
cd api
cp .env.example .env          # Configure DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                    # Runs on http://localhost:3001

# Client setup (separate terminal)
cd client
npm install
npm run dev                    # Runs on http://localhost:5173 (proxied to API)
```

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@peti.dev | Admin123 |
| User | test@peti.dev | User1234 |
