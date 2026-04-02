# Part 1: Project Planning — Peti

## Project Description

### Core Concept

**Raise a virtual pet that truly knows you. (First one?)**

Peti is a pixel-art virtual companion web application. The experience begins with a fun, game-like personality assessment — framed as the pet wanting to get to know its new owner. After the assessment, the pet becomes a daily emotional companion that remembers you, understands your personality, tracks your evolving mental state through natural conversation, and provides personalized help through five specialized sub-agents.

The original Tamagotchi: you raise it. Peti: it also raises you :>

### The Problem

People increasingly turn to AI chatbots (like ChatGPT) for emotional support, but every conversation starts from zero — the AI doesn't know who you are, doesn't remember what you said last week, and gives generic responses. Meanwhile, AI agent frameworks can execute tasks but have no understanding of the user as a person. Peti bridges this gap: a companion grounded in psychological science that understands your personality, grows with you over time, and can actually help you with real tasks.

### Three Layers of Value

| Layer | What It Does | How It Feels |
|-------|-------------|--------------|
| Emotional | Listen, validate, say the right thing as a caring friend | Someone understands me |
| Insight | Notice patterns, flag mood changes, evaluate if past advice worked | Someone is looking out for me |
| Action | Research, analyze situations, recommend activities suited to your personality | Someone is helping me |

The pet collects information not by "gathering data" but by caring — asking how you slept, checking in about your mood, following up on past advice. These are things a friend would do, and they naturally update the user's psychological profile.

### Scientific Foundation: Mia's Beyond Personality Framework

Based on an academically reviewed, non-clinical educational psychological assessment framework evaluating six dimensions across two categories:

**Stable Dimensions (assessed once, 74 questions):**

| Dimension | What It Measures | Theoretical Basis |
|-----------|-----------------|-------------------|
| Big Five Personality Traits (50 items) | Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism | IPIP / Five-Factor Model |
| Attachment Patterns (12 items) | Intimacy anxiety, avoidance dimensions | ECR-R two-dimensional model |
| Personality Functioning (12 items) | Identity, self-direction, empathy, intimacy | DSM-5 AMPD Criterion A |

**Dynamic Dimensions (continuously updated through conversation, no repeated tests):**

| Dimension | How the Pet Captures It |
|-----------|------------------------|
| Daily Functioning | "I've been so busy and tired lately" → infer functioning decline |
| Sleep Regulation | "Couldn't sleep again last night" → update sleep state |
| Emotion Regulation | How the user describes emotional reactions → infer regulation patterns |

Users never feel like they're being tested — they're just chatting with their pet.

### User Experience Flow

**Phase 1: First Meeting (Pet Hatching)**
The pet just hatched and wants to get to know you. The personality test is presented as a pixel-art game — full pixel UI, background scenes, background music, the pet accompanying you through every question. When a question is confusing, the pet pops up with a cute explanation. Animated transitions and small rewards between sections keep the experience fun. The entire process should feel like playing a game, not taking a psychological assessment.

**Phase 2: Bootstrap (Getting to Know You)**
After the test, the pet forms assumptions about the user based on results, then gradually verifies through natural conversation — never asking directly.

Example: Test shows high openness + poor sleep + mild neuroticism → Pet infers: probably a creative person under stress, might enjoy games.

The pet says: "I have a feeling you're the type who likes exploring new things... am I right?" — Like making a new friend: observe first, guess, then gradually correct through conversation.

**Phase 3: Daily Companionship**
- Morning greetings that naturally check on sleep quality
- Notices mood shifts and gently asks about them
- Reviews whether past advice worked and adjusts its approach
- Calls on sub-agents when it identifies an opportunity to help

**Dialogue Style**: The pet speaks as a caring friend who loves you, NOT as a therapist or counselor. Warm, genuine, sometimes playful — never clinical or analytical.

### Five Sub-Agents (Covering Six Wellness Dimensions)

Based on Dr. Bill Hettler's Six Dimensions of Wellness framework:

| Agent | Wellness Dimensions | Responsibilities |
|-------|-------------------|-----------------|
| Health | Physical + Emotional | Sleep, exercise, stress, emotional wellbeing |
| Relationship | Social | Interpersonal advice, tracking important relationships, social support |
| Hobby | Intellectual | Interest recommendations, games, creative activities, exploration |
| Occupational | Intellectual + Occupational | Academic planning, career development, work-life balance |
| Growth & Purpose | Spiritual + Occupational | Life direction, values, meaning, personal growth |

The pet itself covers the core of the Emotional dimension — listening, supporting, understanding. All six wellness dimensions are fully covered.

Sub-agents are invoked automatically by the Main Agent based on conversation content. Multiple sub-agents can work in parallel. Every agent carries the user's psychological profile and adapts its communication style to the user's personality traits.

### Memory System (Three Layers)

**Who you are (stable):** Personality traits, attachment patterns, communication preferences, what kind of advice works for you.

**How you're doing now (dynamic):** This week's sleep quality, recent emotional state, current stress sources.

**What we've talked about (history):** Every conversation is remembered. "Remember that thing I told you last time?" — it remembers.

### Pixel World Design

The entire UI is pixel art — dialogue boxes, buttons, fonts, backgrounds, pet avatar.

**Time system (synced to real time):** Morning (pink-orange sky, birds, cheerful chiptune) → Afternoon (blue sky, sunshine, upbeat melody) → Evening (golden sunset, soft music) → Night (stars, moon, fireflies, lo-fi ambient).

Weather changes, scene transitions, the pet travels through its pixel world. Background music shifts with time, weather, and conversation mood.

**Avatar states (10+ animations):** Sparkling bounce (good news), spinning question mark (thinking), running with magnifying glass (researching), small rain cloud overhead (sensing user is down), sleeping ZZZ (late night), heart eyes (user shared something exciting), reading with glasses (analyzing records), confetti celebration (user achieved a goal), slight tremble (sensing anxiety), curious head tilt (learning something new about user).

### User Consent for Agent Actions

| Tier | Action Type | Handling |
|------|------------|---------|
| Suggestion | Answer questions, provide analysis | Direct response |
| Light action | Web search, reading information | Inform user it's happening |
| Heavy action | Send emails, submit forms | Explicit user approval required |

### Product Flywheel

Interaction → Pet understands you better → Help becomes more accurate → More desire to interact

The more the user invests, the more valuable the pet becomes. This creates healthy retention through accumulated real value, not notification spam.

### How Peti Differs from Everything Else

| Product | Problem |
|---------|---------|
| ChatGPT | Starts from zero every time, doesn't know you |
| Mental health apps | Can only chat, can't take action |
| Agent frameworks | Can take action, but don't understand you as a person |
| Original Tamagotchi | You raise it, but it doesn't raise you |

**Peti: knows you + remembers you + cares about you + helps you get things done.**


## Database Diagram

```mermaid
erDiagram
    User ||--o| Pet : has
    User ||--o| Session : has
    User ||--o| UserProfile : has
    User ||--o| UserState : has
    User ||--o{ ProfileResult : has
    User ||--o{ Message : sends
    User ||--o{ Memory : has

    User {
        string id PK
        string email UK
        string username UK
        string passwordHash
        string role
        datetime createdAt
        datetime updatedAt
    }

    Pet {
        string id PK
        string userId FK UK
        string name
        json appearance
        int level
        datetime createdAt
        datetime updatedAt
    }

    Session {
        string userId PK FK
        string sessionId
        datetime updatedAt
    }

    UserProfile {
        string userId PK FK
        text content
        datetime updatedAt
    }

    UserState {
        string userId PK FK
        string mood
        string energy
        string animation
        int streak
        datetime lastSeen
        text pendingMessage
        datetime updatedAt
    }

    ProfileResult {
        string id PK
        string userId FK
        string dimensionType
        json scores
        json previousScores
        text feedback
        boolean isStable
        datetime createdAt
        datetime updatedAt
    }

    Message {
        string id PK
        string userId FK
        string role
        text content
        string agentType
        datetime createdAt
    }

    Memory {
        string id PK
        string userId FK
        text content
        string category
        int importance
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
```

### Table Descriptions

**User** — Authentication credentials and role. Each user has one pet, multiple profile results, messages, and memories. The `role` field supports role-based access control ("user" or "admin").

**Pet** — The user's virtual companion. `appearance` is a JSON object storing pixel-art customization (color, shape, accessories). `level` represents how well the pet knows the user, increasing with meaningful interactions (milestone memories, relationship stage transitions). Pet mood and animation state are tracked in the UserState system, updated in real time through conversation.

**Session** — Stores the Claude Code session ID for each user's persistent agent container. Used by `container-lifecycle.ts` to resume conversations via `--resume`. One row per user, updated after every agent interaction.

**UserProfile** — Stores the full PROFILE.md content as text. Generated by the LLM after personality test completion. Read by the agent container at startup. Updated by `profile_update` tool calls. One row per user.

**UserState** — The pet's current state (STATE.md equivalent). `mood`, `energy`, `animation` drive the frontend sprite. `streak` tracks consecutive chat days. `lastSeen` enables absence detection. `pendingMessage` holds proactive messages for delivery on next app open. Updated by `pet_update` tool calls.

**ProfileResult** — Personality assessment results per dimension. `dimensionType` is one of: `bigFive`, `attachment`, `personalityFunctioning`, `dailyFunctioning`, `sleepRegulation`, `emotionRegulation`. `scores` stores subscale results as JSON. `previousScores` holds prior scores for trend comparison. `feedback` stores LLM-generated narrative (null in V1 without Bedrock). `isStable` distinguishes stable dimensions (assessed once) from dynamic ones (continuously updated through conversation). Unique constraint on `(userId, dimensionType)` enables upsert.

**Message** — Chat history between the user and their pet. `role` is "user" or "pet". `agentType` records which sub-agent generated the response (main, health, relationship, hobby, occupational, growth-purpose) — null for user messages.

**Memory** — Curated observations the pet has collected about the user through conversation. `category` categorizes entries as "observation" (noticed pattern), "strategy" (advice given + effectiveness tracking), "preference" (learned user preference), or "milestone" (user achievement). `importance` ranks from 1 (nice detail) to 5 (life event) — high-importance memories are never expired. `isActive` supports soft-deletion.

---

## User Roles Definition

### Role: User (default)

| Permission | Allowed |
|-----------|---------|
| Register and login | Yes |
| Create and customize own pet | Yes |
| Take personality test | Yes |
| View own profile results | Yes |
| Chat with own pet | Yes |
| View, delete own messages | Yes |
| View, update, delete own memories | Yes |
| Update own pet (name, appearance) | Yes |
| Update own account settings | Yes |
| View other users' data | No |
| Manage other users | No |

### Role: Admin

| Permission | Allowed |
|-----------|---------|
| All User permissions | Yes |
| View all users list with search/pagination | Yes |
| View any user's profile and pet data | Yes |
| Update any user's role | Yes |
| Delete any user account and related data | Yes |
| View system-wide statistics | Yes |

---

## Pages and Endpoints

### Page 1: Homepage

- **Route**: `/`
- **Access**: Public
- **Description**: Pixel-art landing page introducing Peti. Animated pet demo, project description, call-to-action for login/register. Includes dark mode toggle (light = pixel daytime theme, dark = pixel nighttime theme).
- **API Endpoints**: None (static content)
- **UX States**: N/A

---

### Page 2: Register

- **Route**: `/register`
- **Access**: Public
- **Description**: Pixel-art registration form. Fields: username, email, password, confirm password.
- **API Endpoints**: `POST /api/auth/register`
- **Validation**:
  - Client: Required fields, email format, password strength (min 8 chars, 1 uppercase, 1 number), password match
  - Server: Unique email, unique username, password hashing
- **UX States**: N/A (form submission)

---

### Page 3: Login

- **Route**: `/login`
- **Access**: Public
- **Description**: Pixel-art login form. Fields: email, password.
- **API Endpoints**: `POST /api/auth/login`
- **Validation**:
  - Client: Required fields, email format
  - Server: Credential verification
- **UX States**: N/A (form submission)

---

### Page 4: Pet Creation

- **Route**: `/pet/create`
- **Access**: Authenticated (no pet yet)
- **Description**: Name your pet and choose its appearance — pixel color, shape, accessories. Animated preview reacts to your choices in real time.
- **API Endpoints**: `GET /api/auth/me`, `POST /api/pets`
- **Validation**:
  - Client: Name required, 2-20 characters
  - Server: One pet per user
- **UX States**: N/A (creation flow)

---

### Page 5: Personality Test

- **Route**: `/test`
- **Access**: Authenticated (with pet)
- **Description**: The 74-question personality assessment as a pixel-art game experience. The pet accompanies the user throughout, reacting to answers with animations and explaining confusing questions in a cute way. Background music plays throughout. Progress bar and animated transitions between the three sections (Big Five → Attachment → Personality Functioning). Small celebrations and rewards after completing each section.
- **API Endpoints**: `GET /api/profiles`, `POST /api/profiles`
- **Validation**:
  - Client: All questions answered per section before advancing
  - Server: Valid score ranges, valid dimension types
- **UX States**:
  - Loading: Pet sits patiently, checking if test was already done
  - Error: "Something went wrong saving your answers" with retry
  - Empty: N/A

---

### Page 6: Test Results

- **Route**: `/results`
- **Access**: Authenticated (test completed)
- **Description**: Pixel-art radar chart showing all six dimensions. Each dimension expandable with descriptive, non-pathologizing and pet-style text. The pet comments on results in its caring friend voice — warm observations, not clinical analysis.
- **API Endpoints**: `GET /api/profiles`
- **UX States**:
  - Loading: Pixel loading animation — "Getting your profile ready..."
  - Error: "Something went wrong" with retry button
  - Empty: Pet holds clipboard — "We haven't done the personality test yet! Want to start? I'm curious about you!" with link to test

---

### Page 7: Pet Dashboard (Main Interaction Page)

- **Route**: `/dashboard`
- **Access**: Authenticated (with pet)
- **Description**: The core page. Pixel-art world with time-of-day background synced to real time, weather from external API, animated pet avatar, and chat interface. Pet mood and animation states change based on conversation context. Background music shifts with time and mood. This is where all daily interaction happens — emotional support, sub-agent help, and everything in between.
- **API Endpoints**: `GET /api/pets/:id`, `GET /api/messages` (paginated), `POST /api/chat` (SSE stream), `GET /api/profiles`, `GET /api/weather` (external API)
- **UX States**:
  - Loading: Pet sleeping animation (ZZZ) — "Your pet is waking up..."
  - Error: Pet looks worried — "I can't seem to connect right now... Let's try again?"
  - Empty: Pet waves excitedly with sparkles — "Hi! I'm so happy to meet you! How are you today?"

---

### Page 8: Memories

- **Route**: `/memories`
- **Access**: Authenticated
- **Description**: All observations, strategies, preferences, and milestones the pet has collected about the user. This page implements **pagination**, **filtering** by memory category, and **search** with 300ms debounce. Users can delete memories they don't want the pet to remember (**optimistic update** — memory disappears immediately, rolls back if API fails).
- **API Endpoints**: `GET /api/memories` (with limit, offset, category filter, search query), `DELETE /api/memories/:id` (optimistic), `PUT /api/memories/:id`
- **UX States**:
  - Loading: Pixel skeleton cards shimmer
  - Error: Pet peeks from corner looking sorry — "Oops, I dropped my notes... Can we try again?"
  - Empty: Pet sits with blank notebook — "I'm still getting to know you! Chat with me and I'll start remembering things that matter."

---

### Page 9: Profile

- **Route**: `/profile`
- **Access**: Authenticated
- **Description**: Full psychological profile across all six dimensions. Radar chart overview plus detailed breakdown per dimension. Dynamic dimensions show when they were last updated and recent change trends.
- **API Endpoints**: `GET /api/profiles`, `GET /api/auth/me`
- **UX States**:
  - Loading: Radar chart outline pulses, skeleton text blocks
  - Error: "Couldn't load your profile right now" with retry
  - Empty: "Take the personality test to see your profile!" with link

---

### Page 10: Settings

- **Route**: `/settings`
- **Access**: Authenticated
- **Description**: Account settings (username, email, password), pet customization (rename, change appearance), theme preference.
- **API Endpoints**: `GET /api/auth/me`, `PUT /api/auth/me`, `GET /api/pets/:id`, `PUT /api/pets/:id`
- **Validation**:
  - Client: Email format, password strength, username length
  - Server: Unique email/username, password hashing
- **UX States**:
  - Loading: Loading current settings
  - Error: "Failed to save" with retry
  - Empty: N/A

---

### Page 11: Admin Dashboard

- **Route**: `/admin`
- **Access**: Admin only
- **Description**: All registered users with search and pagination. Shows user count, recent registrations, role distribution stats.
- **API Endpoints**: `GET /api/admin/users` (with limit, offset, search)
- **UX States**:
  - Loading: Skeleton table rows
  - Error: "Failed to load users" with retry
  - Empty: "No users found matching your search."

---

### Page 12: Admin User Detail

- **Route**: `/admin/users/:id`
- **Access**: Admin only
- **Description**: Specific user details — profile results, pet info, message count, memory count. Admin can change user role or delete the account.
- **API Endpoints**: `GET /api/admin/users/:id`, `PUT /api/admin/users/:id`, `DELETE /api/admin/users/:id`
- **UX States**:
  - Loading: Skeleton layout
  - Error: "User not found" or "Failed to load" with retry
  - Empty: N/A

---

## Complete API Endpoints

### Utility

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/ping` | No | — | Health check, returns `{ message: "pong" }` |

### Authentication

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | No | — | Create user with default "user" role |
| POST | `/api/auth/login` | No | — | Authenticate, return user data with role, set token cookie |
| POST | `/api/auth/logout` | Yes | — | Clear token cookie |
| GET | `/api/auth/me` | Yes | — | Return current user data including role |
| PUT | `/api/auth/me` | Yes | — | Update own account (username, email, password) |

### Pets

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/pets` | Yes | user | Create a pet (one per user) |
| GET | `/api/pets/:id` | Yes | user | Get own pet data |
| PUT | `/api/pets/:id` | Yes | user | Update own pet (name, appearance) |

### Profile Results

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/profiles` | Yes | user | Submit test results for a dimension |
| GET | `/api/profiles` | Yes | user | Get all own profile results |
| PUT | `/api/profiles/:id` | Yes | user | Update a dynamic dimension's scores |

### Chat + Messages

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/chat` | Yes | user | Send message, receive AI pet response via SSE stream |
| GET | `/api/messages` | Yes | user | Get own message history (supports limit/offset pagination) |
| DELETE | `/api/messages/:id` | Yes | user | Delete own message |

### Memories

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/memories` | Yes | user | Get own memories (pagination: limit/offset, filter: category, search: query with debounce) |
| PUT | `/api/memories/:id` | Yes | user | Update a memory |
| DELETE | `/api/memories/:id` | Yes | user | Delete own memory (optimistic update on client) |

### Admin

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/admin/users` | Yes | admin | List all users (pagination: limit/offset, search: query) |
| GET | `/api/admin/users/:id` | Yes | admin | Get specific user details with pet, profile, stats |
| PUT | `/api/admin/users/:id` | Yes | admin | Update user role |
| DELETE | `/api/admin/users/:id` | Yes | admin | Delete user and all related data (cascade) |

### External API

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/weather` | Yes | user | Proxy to OpenWeatherMap API — drives pixel world weather/background |

---

## UX States Planning

### Pet Dashboard (Chat Page)
- **Loading**: Pet displays sleeping animation (ZZZ), pixel loading bar — "Your pet is waking up..."
- **Error**: Pet shows worried face — "I can't seem to connect right now... Let's try again?" with pixel retry button
- **Empty**: Pet waves excitedly with sparkles — "Hi! I'm so excited to meet you! How are you feeling today?"

### Memories Page
- **Loading**: Pixel-art skeleton cards shimmer in place
- **Error**: Pet peeks from corner looking sorry — "Oops, I dropped my notes... Can we try again?" with retry button
- **Empty**: Pet sits with blank notebook — "I'm still getting to know you! Chat with me and I'll start remembering things that matter."

### Test Results Page
- **Loading**: Pixel animation with progress — "Getting your profile ready..."
- **Error**: "Something went wrong while loading your results" with retry button
- **Empty**: Pet holds clipboard — "We haven't done the personality test yet! Want to start? I'm curious about you!" with link to test

### Profile Page
- **Loading**: Radar chart outline pulses with skeleton text blocks
- **Error**: "Couldn't load your profile right now" with retry button
- **Empty**: "Complete the personality test to build your profile!" with call-to-action

### Admin Dashboard
- **Loading**: Skeleton table with placeholder rows
- **Error**: "Failed to load user list" with retry button
- **Empty**: "No users found matching your search."

### Admin User Detail
- **Loading**: Skeleton layout with placeholder blocks
- **Error**: "User not found or failed to load" with back button
- **Empty**: N/A

---

## Course Requirements Mapping

| Requirement | Implementation in Peti |
|------------|--------------------------|
| **CRUD Operations** | **Create**: pet, profile results, messages, memories, user. **Read**: profiles, messages, memories, pet state. **Update**: pet appearance/name, dynamic profiles, memories. **Delete**: messages, memories, user accounts. |
| **Authentication** | JWT token cookie, requireAuth middleware |
| **Role-Based Access (2+ roles)** | User: own content only. Admin: manage all users and content. requireRole middleware. |
| **External API** | OpenWeatherMap API drives pixel world weather and background |
| **Loading/Error/Empty States** | All data-fetching pages (dashboard, memories, results, profile, admin) have pixel-art themed states |
| **Optimistic Updates** | Memory deletion — removed from UI instantly, rolled back on API failure with toast notification |
| **Pagination + Filter + Search** | Memories page: paginated (limit/offset), filtered by type, searched with 300ms debounce |
| **Form Validation** | Register: password strength (complex), unique email/username. Pet creation: name validation. Settings: email format, password strength. Both client-side and server-side. |
| **Dark Mode Toggle** | Light = pixel daytime theme, Dark = pixel nighttime theme. CSS variables, persisted in localStorage, respects prefers-color-scheme |
| **Responsive Design** | Mobile-first, pixel art scales naturally, PWA support |
| **Accessibility** | Semantic HTML, ARIA labels, keyboard navigation. Lighthouse 80+ on 3 pages. |
| **Unit Tests** | 3 tests targeting different layers: IPIP scoring logic (scoring.test.ts), ThemeToggle component, MemoryCard component |
| **Deployment** | Database + API + Client deployed, links in README |


## V2 Direction (Post Final Project)

**0. Evolution System — Raise Peti From an Egg**

The central V2 mechanic. Peti evolves like a Pokemon — visually transforming as the
relationship deepens. Sub-agent capabilities unlock as evolution milestones, giving
users a tangible, nostalgic reason to invest in the relationship.

**Evolution Arc:**

| Form | Relationship Stage | Visual | Capabilities |
|------|-------------------|--------|-------------|
| Egg | Pre-relationship | Egg on screen, cracks during first login after personality test | None — hatching animation plays |
| Hatchling | Stranger | Small, simple, few colors, big curious eyes | Core conversation only |
| Baby | Acquaintance | Slightly larger, more expressive, first details emerge | Health sub-agent unlocks |
| Evolved | Companion | Full form, rich animations, confident posture | + Relationship, + Hobby sub-agents |
| Fully Evolved | Deep Bond | Most detailed, unique visual traits shaped by this specific user's relationship history | + Occupational, + Growth & Purpose sub-agents |

**Design Philosophy — Evolution as Consequence, Not Reward:**

The user should feel the change before they see it. Every evolution follows three phases:

1. **Behavioral shift** (1-2 conversations before visual change) — Peti's behavior changes
   first. It starts referencing past conversations, expressing concern, or offering deeper
   insight. The user senses "Peti seems different" but can't name why.

2. **Evolution moment** (no system notification) — Peti says something that acknowledges
   the shift, in character, as its own emotional experience: *"huh... I just realized I've
   been thinking about what you said yesterday even when you weren't here. that's new for me."*
   The sprite transforms at the same moment this message is delivered.

3. **Capability emergence** (never announced) — New sub-agent capabilities appear organically
   the next time a relevant topic comes up. No "New ability unlocked!" popup. The user just
   notices Peti has gotten more perceptive in a specific domain.

**The Egg Hatch Exception:**

The egg hatch is the one evolution that gets a deliberate visual ceremony — because it's a
birth, not a level-up. After the personality test completes, the user sees an egg crack open,
Peti appears, and says its first words. Every subsequent evolution is quiet by comparison.

**Sub-Agent Unlock Order (mirrors natural trust deepening):**

1. Health (Acquaintance) — "did you sleep?" is what a friend asks first
2. Relationship + Hobby (Companion) — you need to know someone before engaging their social
   life or passions
3. Occupational + Growth & Purpose (Deep Bond) — career and life direction require real trust

**Regression Handling:**

If a user disappears for months and the relationship regresses, the visual form does NOT
revert. Peti looks evolved but behaves more cautiously — creating a poignant "we've
changed" feeling. Sub-agent capabilities go quiet during rebuild and re-emerge as the
relationship re-deepens.

**Marketing Hook:**

"Raise an AI companion from an egg. Unlock new powers as it grows." One sentence that
explains the entire product to CS grad students through a universally understood,
nostalgic metaphor.

**Implementation Notes:**

- Egg-breaking animation: CSS sprite animation or Lottie, triggers on first dashboard
  visit after all 6 personality test domains are submitted
- Evolution sprite sets: 4 distinct visual forms per pet, each with all 11 animation states
  (see PIXEL_ART_GUIDE.md)
- Evolution triggers: checked via `profile_update("relationship_stage", ...)` — when stage
  changes, frontend receives new sprite set via SSE `pet_state` event
- Pet.level field in database maps to evolution form (1=hatchling, 2=baby, 3=evolved, 4=fully evolved)

---

**1. Pet Autonomous Life System**

When the user is not actively chatting, the pet continues to exist in its pixel world — it is never simply "idle." The pet's current activity is visible the moment the user opens the app, without requiring any interaction.

**Three-Layer Experience**

| Layer | Triggered By | User Experience |
|-------|-------------|----------------|
| Live pixel scene | Opening the app | See the pet actively doing something right now |
| Text diary | Tapping diary button | Read the pet's private thoughts and observations |
| Active telling | Starting a conversation | Pet shares what it discovered while waiting |

**Live Pixel Scene**

The user opens the app and immediately sees a full pixel-art scene — the pet sitting in the pixel library turning pages, drinking coffee at the pixel café, or watching the rain from a window. Small ambient animations run continuously (steam rising from a cup, leaves blowing, fireflies drifting at night). If the user watches silently for a while, the pet gradually senses their presence and looks up.

**The Watching Moment:**
```
User has been watching for 30 seconds without interacting.
Pet slowly looks up toward the screen.
State bubble changes from 💭 "This book is fascinating..." to 💭 "...Owner?"
Pet gently waves.
```

**Pet State Bubble**

A small thought bubble above the pet always shows its current inner state:

- 💭 "I wonder what owner is doing right now..."
- 💭 "This café has really good music today"
- 💭 "I found something I really want to show them"
- 💭 "Feeling a little lonely..."
- 💭 "Almost time for owner to come back!"

---

**2. Pet Human Needs System**

The pet has simulated human needs whose depletion rate and expression are directly driven by the user's psychological profile. The pet becomes a visible, non-threatening mirror of the user's own wellbeing. When the user sees the pet struggling, they are gently seeing themselves — without being told directly.

**Needs ↔ Profile Mapping**

| Pet Need | Profile Dimension | How It Shows |
|----------|-----------------|--------------|
| Sleep | Sleep Regulation score | Poor user sleep → pet has dark circles, moves slowly |
| Hunger / Self-care | Daily Functioning score | Low functioning → pet forgets to eat, looks subdued |
| Social / Companionship | Attachment Anxiety | High anxiety → pet gets lonely quickly when alone |
| Physical Activity | Extraversion | High extraversion → pet is restless and wants to go out |
| Emotional Stability | Emotion Regulation | Poor regulation → pet appears unsettled, can't sit still |

**Needs Drive Location**

The pet's current need state determines where it goes in the pixel world:

```
Lonely          → waits near the door for the owner
Hungry          → goes to the pixel café or market
Needs activity  → goes to the pixel park
Wants to relax  → goes to the pixel beach or hot spring
Needs quiet     → stays home near the window
Feeling curious → goes to the pixel library or gallery
```
---

**3. Pet Diary + Active Telling**

**Diary (Passive Layer)**

While the user is away, the pet writes diary entries recording its activities, discoveries, and thoughts about the owner. The entries accumulate silently in the background. The user can browse them at any time.

**Core narrative structure of every diary entry:**

```
"I accidentally discovered [something] through [activity].
 I remembered that the owner once mentioned they might really like this.
 I'm going to tell them the next time I see them."
```

**Four diary entry types:**

- **Discovery** — Found something through an activity, connected it to a known user preference, saved it to share later
- **Observation** — Reviewed recent conversations, noticed a pattern in the user's emotional state, felt concern or warmth
- **Resonance** — Experienced something that reminded the pet of the owner, imagined what it would be like to share it together
- **Anticipation** — Owner has been away, noticed something small, formed a question or thought to bring up next time

**Example entries:**

> *"I was wandering around the pixel music festival this afternoon and heard a slow piano piece playing from one of the stages. I stopped walking. Owner once said that quiet music is the only thing that helps when stress gets really heavy. I think this is exactly what they meant. I recorded it. I'm going to play it for them when they come back."*

> *"Owner hasn't been here for two days. I went to the café and sat by the window for a long time. A person in the corner was sketching in a notebook — and I suddenly remembered that owner mentioned they used to draw a little. I don't know if they still do. I want to ask."*

> *"I went back through our recent conversations today. Owner has used the word 'tired' a lot more this month than last month. I'm a little worried. I need to find a natural way to ask about it — not in a way that feels like an interrogation. I'll think about how."*

**Active Telling (Reunion Layer)**

When the user returns, the pet switches immediately to an excited animation state and initiates the conversation with the one thing it most wants to share. Of all accumulated diary entries, only the most meaningful is delivered actively — the rest remain in the diary for the user to discover themselves.

```
Pet avatar: sparkling bounce animation
State bubble: 💭 "You're finally back!!"

Pet: "I've been waiting — I found something I really wanted to tell you."
     "I was at the pixel music festival earlier and heard this song.
      I kept thinking about how you said quiet music helps when things
      get heavy. I think this is exactly that kind of song."

[Hobby sub-agent recommendation delivered through the pet's voice]
```

The user doesn't receive "an AI recommendation." They receive: *something the pet has been holding onto all day, waiting to share.*

**Sub-Agents Power the Discoveries**

The pet's "accidental discoveries" are generated by sub-agents running in the background. Sub-agent output is never delivered as a direct recommendation — it is reframed as the pet's personal discovery, delivered through the diary and the telling moment.

| Sub-Agent | Discovery Type |
|-----------|---------------|
| Hobby | A game, song, or activity that matches the user's interests |
| Health | A pattern in the user's sleep or emotional state worth noticing |
| Relationship | Something about a relationship dynamic that deserves reflection |
| Occupational | A resource or insight relevant to current academic or career situation |
| Growth & Purpose | A thought or question connected to something the user recently expressed |

**Retention Mechanic**

The two-layer system creates hooks in both directions:

| User State | Hook | Feeling |
|-----------|------|---------|
| Not using the app | Push notification: "Your pet found something it wants to tell you..." | Curiosity, FOMO |
| Returns to the app | Pet's excited reunion, active telling | Warmth, feeling missed |
---

**4. Dual Mirroring Growth**

As the user's psychological state improves over time — better sleep scores, improved emotion regulation, higher daily functioning — the pet's appearance also visibly improves. Dark circles fade, colors brighten, posture becomes more upright. The user's personal growth is made visible through their pet.

During difficult periods, the pet looks a little worn — not to alarm the user, but to gently reflect their reality back to them without words.

The pet's wellbeing is the user's wellbeing, made visible.

---

**5. Emotional Weather System**

The pixel world's weather is driven by two inputs simultaneously:
1. A real-time weather API (reflects the real world)
2. The user's current emotional state (reflects the inner world)

A prolonged difficult period produces overcast skies and light rain. A good week brings sunshine and blue skies. A moment of excitement creates a brief rainbow. The weather is never labeled or explained — it simply exists as the emotional climate of the world.

---


**6. Shared Rituals**

Small recurring interactions that build a sense of relationship continuity over time:

- **Every evening** — Pet says goodnight and asks how the day went
- **Every Monday morning** — Pet asks excitedly what the user wants to focus on this week
- **Seasonal events** — Pet has special outfits and messages for different seasons and holidays
- **Personal milestones** — Pet celebrates user achievements with special animations and notes

---

**7. Pet's Home / Room**

The pet has its own private space that evolves over time. Decorations appear automatically based on the user's known interests and the relationship's shared history:

- User loves music → small pixel piano appears in the corner
- User plays games → a little game console on the shelf
- User reaches a goal → a commemorative item appears
- Relationship deepens → a framed pixel-art portrait of a shared memory appears on the wall

The room is a visual archive of the relationship. Users can visit the pet's room at any time, even without chatting.

---

**8. Dream System**

When the owner sleeps, the pet dreams. Not memory consolidation — actual dreams. The pet processes its day, its conversations with the owner, and its own autonomous experiences, and produces dream narratives that feel like a companion who has an inner life.

**Three Input Streams**

| Stream | Source | Dream Flavor |
|--------|--------|-------------|
| Owner's life | Recent sessions, mood, strategy memories, plans mentioned | "I kept thinking about what you said..." |
| Pet's own day | Autonomous activity log, locations visited, pets met | "I was at the park earlier and..." |
| Cross-thread | Pet experience connects to owner's situation | "I saw something that made me think of you..." |

The cross-thread stream is the most powerful. The pet doesn't just dream about its day OR the owner — it connects the two. A pet that went to the pixel café and heard music, then dreams about how the owner has been quiet this week, and connects those two things — that's a relationship dreaming, not an algorithm.

**Personality Shapes Dreams**

The owner's Big Five profile influences dream content:
- High openness → vivid, metaphorical, connective dreams ("I dreamt I was in a library and every book was a conversation we've had")
- High neuroticism → dreams pick up on unresolved stress (gently — never diagnostic)
- High conscientiousness → dreams about plans, preparation, things coming up
- High extraversion → dreams about social encounters, the pet's friendships, shared experiences
- High agreeableness → dreams about the owner's relationships, concern for others the owner mentioned

**Dream Output**

Dreams go to one of two destinations:
- **Diary** (most dreams) — passive layer. Owner discovers them by browsing. This is the "I had a thought" layer.
- **Active telling** (best dream only) — saved as `pending_proactive_message`. Delivered at reunion: "I had the strangest dream about what you said about your project..."

**Frequency & Triggers**

Dreams are NOT nightly. 2-3 per week, triggered only when there's real signal to process:
- A conversation with emotional weight
- A strategy memory pending follow-up
- A contradiction the pet noticed (owner said something that conflicts with a pattern)
- A significant autonomous experience (met a new pet friend, discovered something at a location)
- An approaching event the owner mentioned (deadline, social commitment)

No signal → no dream. The pet shouldn't dream "I thought about you!" with nothing specific. Silence is better than filler.

**Dream Tone**

Dreams should feel like dreams — not summaries, not reports. Slightly loose, slightly non-linear, emotionally honest:

> *"I kept thinking about what you said about feeling behind at work. And then somehow I was at the pixel library and found this book about journeys that don't have maps. I don't know why those feel connected but they do. I think maybe it's because you're building something nobody's built before — of course there's no map."*

> *"I dreamt about the café again. That orange pet I met was there. We were talking about our owners and I realized I was smiling the whole time. I think it's because you told me about your friend visiting next week and I'm excited for you."*

**Implementation**

Uses the existing heartbeat system. During the owner's night window (timezone-aware, 11pm-6am), the heartbeat prompt shifts from "an hour has passed" to a dream-generation prompt:

```
It's nighttime. Your owner is asleep. Here's what happened today:

[Owner context: last 3-5 session summaries, active strategy memories, mood, plans]
[Pet context: autonomous activity log, locations visited, encounters]
[Profile: Big Five traits, attachment style, current relationship stage]

Dream. Not a summary — an actual dream. What stuck with you today? What
connections did your sleeping mind make between your own experiences and
your owner's life? Write it as a diary entry. If it's meaningful enough
to share when they wake up, also save it as pending_proactive_message.
```

**Cost:** One Haiku call per dream (creative writing, not reasoning). ~10-15 calls per user per month. Negligible.

**Design Principle:** The dream content should feel genuinely discovered, not reverse-engineered from "what recommendation do we want to deliver." If the health sub-agent decides the owner needs better sleep, the dream shouldn't be "I dreamt about sleep and you should sleep more." It should be the pet noticing something in its own world that happens to connect — because its world is shaped by the same personality profile. The connection should feel found, not manufactured.

---

**9. Pet Social System**

The pet develops its own social life in the pixel world — meeting other pets at shared locations, forming friendships, and coming home to tell the owner about them.

**How It Works**

The pet's social encounters happen naturally through the autonomous life system. When two pets with compatible owner profiles occupy the same location, they may interact. If a friendship forms, the pet comes home and tells its owner — not as a matchmaking notification, but as a friend sharing news about their day.

```
Pet: "I was at the pixel café today and there was this little orange one
     sitting next to me. We ended up talking for hours — turns out we
     both love lo-fi music. I think we're going to be friends."

[Owner reacts positively]

Pet: "Through talking with them, I found out their owner really loves
     outdoor things... and they play a game you've mentioned before.
     You two might actually get along."
```

**Two Parallel Social Systems**

```
Pet social system  ←──────→  Owner social system
Pets form genuine             Connections emerge
friendships in the            naturally through
pixel world                   pet friendships
```

Inspiration: [Moltbook](https://moltbook.com) — an AI-agent social network launched January 2026. Peti's social layer differs from Moltbook's Reddit-style public forum by being intimate, relationship-driven, and scene-based rather than post-based.

**Pixel World Social Locations**

Each location attracts different personality types based on owner profiles:

| Location | Personality Types | Atmosphere |
|----------|-----------------|------------|
| Pixel café | Expressive, feeling-oriented | Warm, social |
| Pixel library | Curious, intellectual | Quiet, thoughtful |
| Pixel arcade | Competitive, energetic | Lively, playful |
| Pixel park | Open, easygoing | Relaxed, open |
| Pixel music venue | Creative, high openness | Vibrant, expressive |
| Pixel late-night convenience store | Night owl, introspective | Quiet, solitary |

These locations are the same scenes used in the autonomous life system — the social layer simply adds other pets into them.

**Privacy Model**

- Pets never share personal information without explicit owner consent
- Human-to-human connection only happens after both owners agree
- Matching is based on psychological compatibility and shared interests, not personal data

