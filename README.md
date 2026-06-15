# 📱 Socially — Modern Social Media Platform

> A full-stack, real-time social media application built with Next.js 15, Supabase, and TypeScript — featuring cursor-based pagination, optimistic UI updates, a bi-directional friendship system, and a fully integrated notification engine.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.0-000000?logo=next.js&style=flat-square" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&style=flat-square" alt="TypeScript 6">
  <img src="https://img.shields.io/badge/Supabase-2.0-3FCF8E?logo=supabase&style=flat-square" alt="Supabase">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&style=flat-square" alt="Tailwind CSS v4">
  <img src="https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&style=flat-square" alt="TanStack Query 5">
  <img src="https://img.shields.io/badge/Zustand-5-443E38?logo=react&style=flat-square" alt="Zustand 5">
  <img src="https://img.shields.io/badge/Zod-4-3E67B1?logo=zod&style=flat-square" alt="Zod 4">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome">
</p>

---

## 📖 Project Overview

**Socially** is a production-grade social media platform that delivers a rich, real-time user experience. It combines the **performance of Server-Side Rendering** (Next.js App Router) with the **scalability of Supabase** (PostgreSQL + Auth + Realtime) and the **type safety of strict TypeScript**.

The platform supports the full social-media lifecycle — user registration, post creation, image uploads, a **cursor-based infinite-scroll feed**, **optimistic like/unlike toggling**, **resharing with nested author profiles**, **real-time comments**, a **friend system** (requests, suggestions, accept/reject), and a **notification engine** with read/unread tracking. The entire UI is **Arabic-first (RTL)** with a polished dark/light theme.

---

## ✨ Core Features

- **🔐 Authentication** — Secure SSR-based auth via Supabase Auth with cookie session management, login, registration (with age-gate validation), and email confirmation flow.
- **📰 Dynamic Feed** — Infinite-scroll feed with **cursor-based pagination** (no offset/skip issues), post creation with optional image upload to Supabase Storage, post deletion, and **optimistic like/unlike toggling** with instant UI feedback and automatic rollback on failure.
- **🔄 Resharing System** — Share existing posts with nested author profile fetching via deep PostgREST joins, supporting multi-level shared-post rendering.
- **💬 Real-Time Comments** — Server Actions for comment creation with live updates via Supabase Realtime subscriptions.
- **👥 Friends Management** — Dedicated friends page with **URL-state filtering** (Friend Requests, Suggestions, Friends List tabs), send/cancel/accept/remove actions, and suggested-friend algorithms.
- **🔔 Notification System** — Auto-generated notifications for likes, comments, friend requests, and shares with cursor-based pagination, read/unread state, and bulk mark-as-read.
- **🌙 Dark/Light Theme** — System-aware theming via `next-themes` with smooth transitions.
- **📱 Responsive RTL UI** — Arabic-first interface with mobile sidebar, sticky navigation, and framer-motion micro-interactions.
- **🖼️ Avatar Upload** — Inline avatar editing with Supabase Storage, blob URL management, and real-time preview.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, React 19, Server Actions) |
| **Language** | [TypeScript 6](https://www.typescriptlang.org/) — strict mode, zero `any` |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + CSS custom properties |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) (Radix Primitives, Lucide Icons) |
| **Animations** | [Framer Motion](https://motion.dev/) |
| **State (Server)** | [TanStack React Query 5](https://tanstack.com/query/latest) |
| **State (Client)** | [Zustand 5](https://zustand.docs.pmnd.rs/) |
| **Forms & Validation** | [react-hook-form](https://react-hook-form.com/) + [Zod 4](https://zod.dev/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL 15, PostgREST) |
| **Auth** | [Supabase Auth](https://supabase.com/auth) (SSR cookie-based) |
| **Storage** | [Supabase Storage](https://supabase.com/storage) (user avatars, post images) |
| **Realtime** | [Supabase Realtime](https://supabase.com/realtime) (post/notification subscriptions) |
| **Date Formatting** | [date-fns 4](https://date-fns.org/) (Arabic locale) |
| **Notifications (UI)** | [Sonner](https://sonner.emilkowal.ski/) (toast notifications) |
| **Package Manager** | npm |

---

## 🏗️ Architecture & Project Structure

The project follows **Feature-Sliced Design (FSD)** principles — a modular architecture that groups code by business domain, keeping cross-feature dependencies clean and enforcing separation of concerns.

```
src/
├── app/                           # Next.js App Router (pages, layouts)
│   ├── (auth)/                    # Auth route group (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (main)/                    # Main app route group (protected)
│   │   ├── friends/               # Friends management page
│   │   ├── profile/[id]/          # User profile pages
│   │   ├── layout.tsx             # Main layout: Navbar + Sidebar
│   │   └── page.tsx               # Feed home page
│   ├── globals.css                # Tailwind v4 theme tokens
│   └── layout.tsx                 # Root layout (providers, fonts, RTL)
│
├── components/
│   ├── providers/                 # ThemeProvider, QueryProvider
│   ├── shared/                    # Shared UI (Navbar, Sidebar, NotificationsDropdown, …)
│   └── ui/                        # shadcn/ui primitives (button, dialog, avatar, …)
│
├── features/                      # Feature modules (FSD slices)
│   ├── auth/                      # Authentication feature
│   │   ├── actions.ts             #   Server Actions (loginUser, registerUser)
│   │   ├── components/            #   LoginForm, RegisterForm, AuthLayout
│   │   └── hooks/                 #   useAuth.ts
│   ├── feed/                      # Core feed feature
│   │   ├── actions.ts             #   Server Actions (createPost, toggleLike, …)
│   │   ├── components/            #   PostCard, FeedList, CreatePostDialog, …
│   │   └── hooks/                 #   usePosts.ts (realtime + pagination)
│   ├── friends/                   # Friends feature
│   │   ├── actions.ts             #   Server Actions (send/accept/remove request)
│   │   └── components/            #   FriendshipButton, UserCard, …
│   ├── notifications/             # Notifications feature
│   │   └── actions.ts             #   fetchNotificationsAction, markAsReadAction
│   ├── profile/                   # Profile feature
│   │   ├── actions.ts             #   getProfilePageData, updateProfileAction
│   │   └── components/            #   AvatarUploader, EditProfileDialog
│   ├── search/                    # Global search feature
│   │   └── actions.ts             #   searchProfilesAction
│   ├── chat/                      # Chat (stub — coming soon)
│   │   ├── components/
│   │   └── hooks/
│   └── stories/                   # Stories feature
│       └── components/            # StoryCarousel
│
├── lib/                           # Shared infrastructure
│   ├── supabase/
│   │   ├── server.ts              # SSR server client + requireUser() + getProfile()
│   │   └── client.ts              # Browser client factory
│   ├── zod.ts                     # Zod schemas (login, signup)
│   ├── formatPosts.ts             # Post normalization utility
│   ├── normalize.ts               # Profile type guard + normalizer
│   ├── with-error-handling.ts     # Server Action error wrapper
│   ├── formatDate.ts              # Arabic relative time formatter
│   ├── react-query.tsx            # React Query provider
│   ├── env.ts                     # Validated environment variables
│   └── utils.ts                   # cn() utility (clsx + tailwind-merge)
│
├── store/
│   └── useUIStore.ts              # Zustand store (dialog state, connectivity, mobile sidebar)
│
├── hooks/
│   └── useDebounce.ts             # Generic debounce hook
│
├── types/
│   └── database.types.ts          # Shared TypeScript types (Profile, Post, Comment, …)
│
└── middleware.ts                  # Auth-redirect middleware (Supabase SSR)
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Server Actions** for mutations | Enables cookie-aware requests without building a REST API; fully compatible with Supabase SSR |
| **Cursor-based pagination** over offset | Prevents duplicate/skipped posts on concurrent inserts — uses `lt("created_at", cursor)` |
| **React Query** for server state | Automatic cache invalidation, background refetching, and optimistic updates |
| **Zustand** for client state | Lightweight, TypeScript-native store for UI-specific state (dialog open, sidebar, online status) |
| **FSD over traditional pages router** | Enforces domain boundaries; prevents circular imports; scales with team size |
| **`React.cache(getProfile)`** | Deduplicates profile queries per server request — eliminates N+1 profile lookups |
| **Zero `any` policy** | Full strict TypeScript coverage; every Supabase response is typed via normalizer utilities |

---

## 🗄️ Database & Data Modeling

The application uses **PostgreSQL 15** via Supabase with **PostgREST** for deep relational querying. Supabase's JavaScript client automatically resolves foreign-key joins into nested JSON objects.

### Deep Relational Joins

The feed query demonstrates the complexity of the data model:

```typescript
supabase.from("posts").select(`
  *,
  profiles!posts_user_id_fkey (id, full_name, avatar_url),
  comments (id, content, created_at, user_id, profiles:user_id (id, full_name, avatar_url)),
  likes (post_id, user_id),
  shared_post:posts!posts_shared_post_id_fkey (
    id, content, image_url, profiles:user_id (id, full_name, avatar_url)
  )
`)
```

- **N+1 Resolution** — All related data (author profiles, comments with authors, likes, and reshared posts) is fetched in a **single round-trip** via PostgREST's `*` expansion syntax.
- **Self-Join Resharing** — The `shared_post` column uses a self-referencing foreign key (`posts_shared_post_id_fkey`) on the `posts` table, allowing arbitrary nesting depth for reshared content.
- **Profile Normalization** — Supabase occasionally returns joined single-object relationships as arrays. The `normalizeProfile()` utility safely coerces these back to a single `Profile` object without `as any` type escapes.

### Bi-Directional Friendships

Friendships are modeled as a **unidirectional `friend_requests` table** with requests flowing from `sender_id` (actor) to `receiver_id` (target). A "friend" is defined as two reciprocal `accepted` records. The queries use:

```sql
-- Friends of a user (bi-directional)
receiver_id = :uid AND status = 'accepted'  UNION  sender_id = :uid AND status = 'accepted'
```

- **Suggested Friends** — Users whose friend lists intersect with the current user's friends but who are not already friends themselves.
- **Pending Requests** — Scoped by `receiver_id = :uid AND status = 'pending'` for incoming, and `sender_id = :uid AND status = 'pending'` for outgoing.

### Notifications

The `notifications` table stores per-action events (`like`, `comment`, `friend_request`, `friend_accept`, `share`) with foreign keys back to the relevant post, comment, and actor profile. RLS policies ensure **users can only read their own notifications** and **insert notifications with `actor_id = auth.uid()`** (preventing impersonation).

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x (or **pnpm** >= 9.x)
- A **Supabase** project ([create one free](https://supabase.com/))

### Local Setup

1. **Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/socially.git
cd socially
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the template below into `.env.local` (or rename the existing `.env.local` if cloning from a template):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Found in **Supabase Dashboard → Settings → API**
- `SUPABASE_SERVICE_ROLE_KEY` — Same page (needed for admin-level operations; keep secret)
- `MY_USER_ID` — Optional, for seeding scripts

4. **Initialize the database schema**

Run the SQL migration from `supabase/migrations/` (if available) or create the following tables in the **Supabase SQL Editor**:

```sql
-- Core tables needed (simplified)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  shared_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE likes (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sender_id, receiver_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'friend_request', 'friend_accept', 'share')),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **Enable Row-Level Security (RLS)** on all tables via the Supabase Dashboard and add policies appropriate to your use case.

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page. Register a new account or seed test data via:

```bash
npx tsx scripts/seed.ts
```

6. **Build for production**

```bash
npm run build && npm start
```

---

## 🧪 Code Quality & Tooling

- **Strict TypeScript** — `"strict": true` with zero `any` types across the entire codebase
- **Tailwind CSS v4 `@theme`** — Design tokens defined as CSS custom properties with dark-variant support
- **Zod schema validation** for all forms with Arabic error messages and age-gate enforcement
- **`withErrorHandling`** wrapper — Every Server Action returns a consistent `{ success, data } | { success: false, error }` shape
- **FSD linting** — Feature boundaries are enforced by convention; shared code lives in `lib/` and `components/shared/`

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the **MIT License**.
