# Tech Stack
## Study Sensei — Technology Decisions

**Version:** 1.0.0  
**Date:** March 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Frontend Stack](#2-frontend-stack)
3. [Backend Stack](#3-backend-stack)
4. [Database Layer](#4-database-layer)
5. [AI Integration](#5-ai-integration)
6. [Dev Tools & Build Pipeline](#6-dev-tools--build-pipeline)
7. [Deployment & Hosting](#7-deployment--hosting)
8. [Dependency List](#8-dependency-list)
9. [Decision Log](#9-decision-log)

---

## 1. Overview

Study Sensei is a **monorepo full-stack TypeScript application**. The frontend (React/Vite) and backend (Express/Node) share type definitions from a common `/shared` directory. All AI features are delivered via an **Agnostic AI API** (currently mapped to Google Gemini) — no model training or hosting.

```
Client (React + Vite)
      ↕ HTTP/JSON
Server (Express + Node.js)
      ↕ Drizzle ORM
PostgreSQL Database
      ↕ REST
Google Gemini API (external)
```

---

## 2. Frontend Stack

### React 18

- **Why:** Industry-standard component model, mature ecosystem, excellent TypeScript support
- **Key features used:** hooks (useState, useEffect, useCallback, useMemo, useRef), context
- **Version:** 18.x

### TypeScript

- **Why:** Catches bugs at compile time; enables shared types between client and server
- **Strictness:** `strict: true` in tsconfig
- **Benefit:** The `shared/schema.ts` types flow end-to-end from DB → API → UI

### Vite

- **Why:** Dramatically faster dev server than Webpack/CRA; native ESM; instant HMR
- **Config:** `vite.config.ts` proxies `/api/*` to the Express server in development
- **Version:** 5.x

### Wouter

- **Why:** Lightweight (< 2KB) client-side router; simpler than React Router for this app size
- **Usage:** `<Switch>`, `<Route>`, `useLocation()` for navigation

### TanStack Query (React Query)

- **Why:** Eliminates manual loading/error state management for API calls
- **Usage:** `useQuery` for GET requests with caching, `useMutation` for write operations
- **Key benefit:** Automatic cache invalidation after mutations (update task → dashboard re-fetches stats)

### Tailwind CSS

- **Why:** Utility-first — faster development, consistent spacing/sizing, no CSS file bloat
- **Configuration:** Custom dark theme colors in `tailwind.config.ts`
- **Version:** 3.x

### shadcn/ui

- **Why:** Accessible, unstyled-by-default components; we own the code (not a runtime dependency)
- **Components used:** Button, Card, Dialog, Input, Select, Badge, Progress, Avatar, ScrollArea, Calendar, Popover, Toast
- **Note:** Components live in `client/src/components/ui/` — customizable

### Recharts

- **Why:** React-native charting; declarative API; responsive containers built-in
- **Used for:** Bar chart (activity), Radar chart (mastery), Horizontal bar (hours per subject)

### Google Fonts

- **Playfair Display** — headings, display numbers (academic serif)
- **Plus Jakarta Sans** — body text, UI labels (modern, readable)
- **JetBrains Mono** — stats, quiz option labels (technical precision)

---

## 3. Backend Stack

### Node.js 20+

- **Why:** JavaScript throughout the stack; native fetch; excellent async performance; LTS version
- **Runtime:** `tsx` for direct TypeScript execution in development

### Express.js

- **Why:** Minimal, unopinionated, battle-tested HTTP framework; ideal for REST API
- **Version:** 4.x
- **Middleware used:** `express.json()`, `cors`, `express-session`, `multer`

### TypeScript (Node)

- Shared via root `tsconfig.json`
- Server files in `server/` directory
- Types shared from `shared/schema.ts`

### express-session + connect-pg-simple

- **Why:** Simple session-based auth; no JWT complexity needed for this app
- **Storage:** Sessions stored in PostgreSQL (not in-memory) for persistence across deploys
- **Config:**
  ```typescript
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
  }
  ```

### bcrypt

- **Why:** Industry standard for password hashing with configurable salt rounds
- **Cost factor:** 12 rounds (good security/performance balance)

### Multer

- **Why:** Standard Express middleware for `multipart/form-data` file uploads
- **Storage:** `memoryStorage()` — buffer in memory, then pass to pdf-parse
- **Limits:** 10 MB per file, PDF MIME type only

### pdf-parse

- **Why:** Pure JavaScript PDF text extraction; no external binaries needed
- **Usage:** Extract text from uploaded syllabus PDF before storing in DB

### Zod

- **Why:** TypeScript-first schema validation; works on both client and server
- **Usage:** Validate all incoming request bodies before hitting DB or AI
- **Benefit:** Zod schemas can generate TypeScript types (`z.infer<typeof schema>`)

### express-rate-limit

- **Why:** Prevent abuse and control AI API costs
- **Usage:** Applied to `/api/chat`, `/api/quiz/generate`, `/api/plan/generate`
- **Config:** 20 requests per minute per IP

---

## 4. Database Layer

### PostgreSQL

- **Why:** Relational, ACID-compliant, excellent JSON support, industry standard
- **Version:** 15+
- **Hosting options:** Neon (serverless, free tier), Railway, Supabase, or local

### Drizzle ORM

- **Why:** Type-safe, lightweight ORM that works well with Vite/Vite SSR; great TypeScript DX
- **Advantage over Prisma:** Smaller bundle, faster cold start, schema defined in TypeScript
- **Usage:** Table definitions in `shared/schema.ts`; migrations via Drizzle Kit
- **Version:** 0.30+

### Drizzle Kit

- **Why:** CLI companion for Drizzle ORM — generates and runs migrations
- **Commands:**
  - `drizzle-kit push:pg` — dev (push schema directly)
  - `drizzle-kit generate:pg` — generate migration SQL
  - `drizzle-kit studio` — visual DB inspector
- **Config:** `drizzle.config.ts` in project root

### @neondatabase/serverless

- **Why:** Neon's PostgreSQL driver works in serverless/edge environments
- **Alternative:** `pg` (node-postgres) for traditional hosting

---

## 5. AI Integration

### Agnostic AI Service (Gemini Default)

- **Provider:** Google (`generativelanguage.googleapis.com`)
- **Integration:** Native `fetch` with REST JSON payload limits
- **Model used:** `gemini-2.0-flash` (best balance of speed and free tier allocations)

### How It's Used

```typescript
// All requests are abstracted by ai.service.ts
const systemPrompt = `You are Study Sensei...`;
const responseText = await callAI(systemPrompt, messages, 1024);
```

### Features Powered by AI API

| Feature | AI Role | Max Tokens |
|---|---|---|
| AI Tutor chat | Multi-turn conversation with system prompt | 1024 |
| Quiz generation | JSON-structured 5-question output | 1500 |
| Study plan generation | Day-by-day schedule text | 1500 |
| Daily dashboard tip | Short motivational insight | 256 |

### Key Constraints

- API key stored only in `process.env.GEMINI_API_KEY`
- Never passed to browser, never logged, never returned in API responses
- All requests managed from `server/services/ai.service.ts` only. Native fallbacks (like hardcoded mock quizzes or status error catches) are deployed here.
- Rate limited at middleware level before reaching Gemini

---

## 6. Dev Tools & Build Pipeline

### Development

```bash
npm run dev
# Starts Vite dev server (port 5173) + Express server (port 5000) concurrently
# Vite proxies /api/* → Express
# Hot Module Replacement for React components
# tsx watches server files for changes
```

### Build

```bash
npm run build
# 1. TypeScript type check (tsc --noEmit)
# 2. Vite builds client → dist/public/
# 3. esbuild bundles server → dist/index.js
```

### Testing (Recommended Setup)

| Tool | Purpose |
|---|---|
| Vitest | Unit tests for utility functions, Zod schemas |
| React Testing Library | Component tests |
| Supertest | Express route integration tests |
| Playwright | E2E tests (optional) |

### Linting & Formatting

```json
{
  "eslint": "flat config, typescript-eslint",
  "prettier": "2-space indent, single quotes, no semi"
}
```

### Environment Variables

```env
# .env (never commit)
GEMINI_API_KEY=AIza...
DATABASE_URL=postgresql://...
SESSION_SECRET=random-32-char-string
NODE_ENV=development
PORT=5000
```

---

## 7. Deployment & Hosting

### Recommended: Railway

- One-click deploy from GitHub
- Built-in PostgreSQL (no separate DB signup)
- Automatic HTTPS
- Environment variable management
- Zero-config Node.js deploy

### Alternative: Replit

- Already the current development environment
- Add Secrets for env vars
- Auto-deploy on push to main

### Alternative: Render

- Free tier available
- Separate Web Service (Node) + PostgreSQL database
- Auto-deploys from GitHub

### Build Commands for Production

```bash
Build:   npm run build
Start:   node dist/index.js
```

---

## 8. Dependency List

### Production Dependencies

```json
{
  "@neondatabase/serverless": "^0.9.0",
  "@neondatabase/serverless": "^0.9.0",
  "@tanstack/react-query": "^5.0.0",
  "bcrypt": "^5.1.1",
  "connect-pg-simple": "^9.0.1",
  "drizzle-orm": "^0.30.0",
  "express": "^4.18.2",
  "express-rate-limit": "^7.0.0",
  "express-session": "^1.17.3",
  "multer": "^1.4.5",
  "pdf-parse": "^1.1.1",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "recharts": "^2.10.0",
  "wouter": "^3.0.0",
  "zod": "^3.22.0"
}
```

### Development Dependencies

```json
{
  "@types/bcrypt": "^5.0.2",
  "@types/express": "^4.17.21",
  "@types/express-session": "^1.17.10",
  "@types/multer": "^1.4.11",
  "@types/node": "^20.0.0",
  "@vitejs/plugin-react": "^4.2.0",
  "drizzle-kit": "^0.20.0",
  "tailwindcss": "^3.4.0",
  "tsx": "^4.7.0",
  "typescript": "^5.4.0",
  "vite": "^5.0.0"
}
```

---

## 9. Decision Log

| Decision | Chosen | Rejected | Reason |
|---|---|---|---|
| AI Provider | Google Gemini API (Agnostic implementation) | OpenAI GPT | Fast TTFB, extensive free tier limits compared to Claude and GPT |
| ORM | Drizzle | Prisma | Lighter, better Vite compatibility, faster cold start |
| Auth | express-session | JWT | Simpler for server-rendered sessions; no token refresh logic |
| Router | Wouter | React Router | 10x smaller bundle, sufficient for this app |
| Database | PostgreSQL | MongoDB | Relational model fits task/user/score relationships better |
| Styling | Tailwind | CSS Modules / Styled Components | Faster iteration, no naming overhead |
| UI Library | shadcn/ui | MUI / Ant Design | Own the code, no runtime dependency, fully customizable |
| Charts | Recharts | Chart.js / D3 | React-native, declarative, good TypeScript types |
| Build tool | Vite | Webpack / CRA | 10–50x faster dev server, ESM-native |
| PDF Parsing | pdf-parse | pdfjs-dist | Simpler API, no worker thread setup, Node-only use case |
