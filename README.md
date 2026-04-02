# Peti

A pixel-art virtual companion web application. Take a personality assessment framed as your pet getting to know you, then chat daily with a companion that remembers your conversations, understands your personality, and grows with you over time.

## Project Description

Peti bridges the gap between AI chatbots that start from zero every conversation and agent frameworks that can execute tasks but don't understand the user as a person. The experience begins with a game-like personality assessment across six psychological dimensions, after which the pet becomes a daily emotional companion providing personalized help through five specialized sub-agents.

Three layers of value:

| Layer | What It Does | How It Feels |
|-------|-------------|--------------|
| Emotional | Listen, validate, remember | Someone understands me |
| Insight | Notice patterns, track whether past advice worked | Someone is looking out for me |
| Action | Research, recommend activities matched to personality | Someone is helping me |

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL (Docker)
- **Auth**: JWT HttpOnly cookies
- **Styling**: CSS variables, glass-morphism, Press Start 2P pixel font
- **External API**: OpenWeatherMap (weather proxy)

## Features

### Security and Role-Based Access Control

- JWT token cookie authentication (`requireAuth` middleware)
- Two roles: `user` (default) and `admin` (`requireRole` middleware)
- Admin can manage all users; regular users can only access their own data
- Server-side validation on all endpoints, client-side validation on all forms

### Pages

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Homepage | `/` | Public | Pixel-art landing page with animated GIF background, Learn More modal |
| Register | `/register` | Public | Client-side validation: email format, username 3-20 chars, password strength (8+ chars, uppercase, number) |
| Login | `/login` | Public | Email + password authentication |
| Memories | `/memories` | Auth | Paginated list with loading/error/empty states, optimistic delete with rollback |
| New Memory | `/memories/new` | Auth | Form with content, category, importance validation |
| Admin Dashboard | `/admin` | Admin | User list with search and pagination |
| Admin User Detail | `/admin/users/:id` | Admin | View/edit/delete specific user |
| Pet Creation | `/pet/create` | Auth | Name input + appearance customizer |
| Personality Test | `/test` | Auth | 106-question assessment across 6 domains, auto-save + resume |
| Test Results | `/results` | Auth | Radar chart with descriptive bands (lower/moderate/higher) |
| Profile | `/profile` | Auth | 6-dimension radar chart with trend arrows |
| Dashboard | `/dashboard` | Auth | Pet sprite + chat + weather + message history |

### API Endpoints

**Utility**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/ping` | No | Health check |

**Authentication**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create user with default role, set token cookie |
| POST | `/api/auth/login` | No | Verify credentials, return user data with role |
| POST | `/api/auth/logout` | Yes | Clear token cookie |
| GET | `/api/auth/me` | Yes | Return current user data including role |

**Memories (CRUD)**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/memories` | Yes | Paginated list with `?search=` and `?category=` filter |
| POST | `/api/memories` | Yes | Create memory with server-side validation |
| PUT | `/api/memories/:id` | Yes | Update own memory |
| DELETE | `/api/memories/:id` | Yes | Soft-delete own memory |

**Pets**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/pets` | Yes | Create pet (one per user) |
| GET | `/api/pets/mine` | Yes | Get current user's pet |
| PUT | `/api/pets/:id` | Yes | Update own pet |

**Profiles**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/profiles` | Yes | Submit scored domain results |
| GET | `/api/profiles` | Yes | Get all own profile results |

**Chat and Messages**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat` | Yes | Send message, receive SSE stream response |
| GET | `/api/messages` | Yes | Paginated message history |
| DELETE | `/api/messages/:id` | Yes | Delete own message |

**Admin**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users with search + pagination |
| GET | `/api/admin/users/:id` | Admin | User detail with pet, profile, counts |
| PUT | `/api/admin/users/:id` | Admin | Update user role |
| DELETE | `/api/admin/users/:id` | Admin | Delete user (cascade) |

**External API**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/weather` | Yes | OpenWeatherMap proxy (`?lat=&lon=` or `?city=`) |

### UX States

Every data-fetching page implements loading, error, and empty states:

| Page | Loading | Error | Empty |
|------|---------|-------|-------|
| Memories | "finding our memories..." | Retry button | "nothing here yet. we're just getting started." |
| Dashboard | Pet sleeping animation | "I can't seem to connect right now..." | "Hi! I'm so happy to meet you!" |
| Test Results | "thinking about what this means..." | Retry button | Link to personality test |
| Profile | Radar chart outline pulses | "couldn't load your profile right now" | "complete the personality test to see your profile" |
| Admin | Skeleton table rows | "couldn't load users" | "no users found" |

### Additional Features

- **Optimistic Updates**: Memory deletion removes from UI immediately, rolls back on API failure with toast notification
- **Pagination + Filtering + Search**: Memories page supports paginated results, category filter, and debounced search (300ms)
- **Dark Mode**: CSS variables for theming, persisted in localStorage, respects `prefers-color-scheme` on first visit
- **Form Validation**: Client-side (real-time field errors) + server-side (400 with structured error details) on all forms. Complex validation includes password strength (uppercase + number), email format, unique username check
- **Responsive Design**: Mobile-first with breakpoint at 640px
- **Glass-morphism UI**: All pages rendered in draggable, resizable floating windows with backdrop-filter blur

## Database

8 Prisma models:

```
User ──┬── Pet (one-to-one)
       ├── Memory (one-to-many, soft-delete)
       ├── Message (one-to-many)
       ├── ProfileResult (one-to-many, unique per dimension)
       ├── Session (one-to-one)
       ├── UserProfile (one-to-one)
       └── UserState (one-to-one)
```

User table includes `role` field (`"user"` | `"admin"`) for role-based access control.

## User Roles

**User (default)**:
- Register, login, manage own account
- Create/customize own pet
- Take personality test, view own profile results
- Chat with own pet, view/delete own messages
- View/update/delete own memories

**Admin**:
- All user permissions
- View all users with search/pagination
- View any user's profile and pet data
- Update any user's role
- Delete any user account (cascade)

## Project Structure

```
peti/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── index.ts               # Express app, route registration, /ping
│   │   ├── config.ts              # Environment variables
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── middleware/
│   │   │   ├── requireAuth.ts     # JWT cookie verification
│   │   │   └── requireRole.ts     # Role-based access control
│   │   └── routes/
│   │       ├── auth.ts            # register, login, logout, me
│   │       ├── memories.ts        # CRUD with pagination, search, filter
│   │       ├── admin.ts           # User management (admin only)
│   │       ├── pets.ts            # Pet CRUD
│   │       ├── profiles.ts        # Personality test results
│   │       ├── weather.ts         # OpenWeatherMap proxy
│   │       ├── messages.ts        # Chat message history
│   │       └── chat.ts            # SSE streaming
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api/                   # Typed fetch wrappers
│   │   ├── hooks/                 # useAuth, useSettings
│   │   ├── components/            # Navbar, ProtectedRoute, DraggableWindow, SettingsPanel
│   │   ├── pages/                 # All page components
│   │   └── styles/globals.css     # CSS variables, glass-morphism, animations
│   ├── vite.config.ts
│   └── package.json
├── accessibility_reports/
└── README.md
```

## Running Locally

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
# Start PostgreSQL
docker compose up -d

# API
cd api
cp .env.example .env       # Set DATABASE_URL, JWT_SECRET
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                 # http://localhost:3001

# Client (separate terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@peti.dev | Admin123 |
| User | test@peti.dev | User1234 |

## Deployment

<!-- TODO: Add deployment links -->

- **Database**: 
- **API**: 
- **Client**: 
