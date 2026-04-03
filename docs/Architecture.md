# Architecture
## Study Sensei — System Design & Structure

**Version:** 1.0.0  
**Date:** March 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Application Architecture](#2-application-architecture)
3. [Directory Structure](#3-directory-structure)
4. [Request Lifecycle](#4-request-lifecycle)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Data Layer](#7-data-layer)
8. [AI Service Layer](#8-ai-service-layer)
9. [State Management](#9-state-management)
10. [Module Dependency Graph](#10-module-dependency-graph)

---

## 1. System Overview

Study Sensei is a **full-stack monolith** with a clear internal separation between frontend, backend, and shared types. It is not a microservices architecture — everything runs as one deployable unit, which is appropriate for this scale.

```
┌─────────────────────────────────────────────────────────────────────┐
│                           STUDY SENSEI                              │
│                                                                     │
│  ┌─────────────────────┐           ┌─────────────────────────────┐  │
│  │    CLIENT (React)    │    HTTP   │     SERVER (Express)        │  │
│  │                      │◄─────────►                             │  │
│  │  Pages + Components  │           │  Routes + Controllers       │  │
│  │  TanStack Query      │           │  Services + Middleware      │  │
│  │  Tailwind + shadcn   │           │  Drizzle ORM               │  │
│  └─────────────────────┘           └────────────┬────────────────┘  │
│                                                  │                   │
│                                    ┌─────────────▼───────────────┐  │
│                                    │     EXTERNAL SERVICES        │  │
│                                    │                             │  │
│                                    │  Google Gemini API       │  │
│                                    │  PostgreSQL Database        │  │
│                                    └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Architecture style | Monolith | Simpler deploy, shared types, no network overhead |
| API style | REST | Simple CRUD operations, well-understood |
| Auth mechanism | Session-based | No token management complexity |
| AI access pattern | Server-side only | API key security, rate limiting, response validation |
| Type sharing | `/shared` directory | Single source of truth for DB types + Zod schemas |
| Client state | TanStack Query | Server state cache with automatic revalidation |

---

## 2. Application Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│   Pages          Components         Hooks           Lib             │
│   ───────────    ──────────────     ──────────────  ─────────────   │
│   Dashboard      layout/           use-auth.ts     queryClient.ts  │
│   Planner        AppLayout         use-tasks.ts    api.ts          │
│   Tutor          Sidebar           use-chat.ts     utils.ts        │
│   Quiz                             use-analytics   mockData.ts     │
│   Analytics      ui/ (shadcn)      use-mobile                      │
│   Login          planner/                                          │
│   Register       tutor/                                            │
│                  analytics/                                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP/JSON (fetch via /api/*)
┌──────────────────────────▼──────────────────────────────────────────┐
│                         SERVER LAYER                                │
│                                                                     │
│   index.ts → Express app setup, middleware                          │
│   routes.ts → Route definitions (calls controllers)                │
│                                                                     │
│   Middleware             Controllers           Services             │
│   ──────────────────     ──────────────────   ──────────────────   │
│   requireAuth.ts         authController       ai.service.ts    │
│   validateBody.ts        taskController       pdf.service.ts       │
│   rateLimiter.ts         chatController       analytics.service.ts │
│                          quizController                             │
│                          analyticsController                        │
│                          uploadController                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ Drizzle ORM
┌──────────────────────────▼──────────────────────────────────────────┐
│                         DATA LAYER                                  │
│                                                                     │
│   shared/schema.ts → Drizzle table defs + Zod schemas               │
│                                                                     │
│   PostgreSQL Tables                                                 │
│   users · tasks · chat_messages · quiz_results · study_sessions     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ External API
┌──────────────────────────▼──────────────────────────────────────────┐
│                      EXTERNAL SERVICES                              │
│                                                                     │
│   Google Gemini API     generativelanguage.googleapis.com           │
│   Model: gemini-2.0-flash                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
Study-Sensei/
│
├── client/                          # Vite + React frontend
│   ├── index.html                   # HTML entry point
│   └── src/
│       ├── main.tsx                 # React DOM render
│       ├── App.tsx                  # Router + QueryClient + providers
│       ├── index.css                # Tailwind base + custom CSS vars
│       │
│       ├── pages/                   # One file per route
│       │   ├── Dashboard.tsx
│       │   ├── Planner.tsx
│       │   ├── Tutor.tsx
│       │   ├── Quiz.tsx
│       │   ├── Analytics.tsx
│       │   ├── Login.tsx            ← TO BUILD
│       │   ├── Register.tsx         ← TO BUILD
│       │   └── not-found.tsx
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx    # Sidebar + main area wrapper
│       │   │   └── Sidebar.tsx      # Navigation + user profile
│       │   │
│       │   ├── ui/                  # shadcn/ui generated components
│       │   │   └── *.tsx
│       │   │
│       │   ├── planner/             ← TO BUILD
│       │   │   ├── TaskCard.tsx
│       │   │   ├── KanbanColumn.tsx
│       │   │   └── AddTaskModal.tsx
│       │   │
│       │   ├── tutor/               ← TO BUILD
│       │   │   ├── MessageBubble.tsx
│       │   │   ├── ChatInput.tsx
│       │   │   └── SyllabusUpload.tsx
│       │   │
│       │   └── analytics/           ← TO BUILD
│       │       ├── SubjectRadar.tsx
│       │       ├── StudyHeatmap.tsx
│       │       └── ProgressDetail.tsx
│       │
│       ├── hooks/
│       │   ├── use-auth.ts          ← TO BUILD
│       │   ├── use-tasks.ts         ← TO BUILD
│       │   ├── use-chat.ts          ← TO BUILD
│       │   ├── use-analytics.ts     ← TO BUILD
│       │   ├── use-mobile.tsx
│       │   └── use-toast.ts
│       │
│       └── lib/
│           ├── queryClient.ts       # TanStack Query setup
│           ├── api.ts               ← TO BUILD (typed fetch helpers)
│           ├── utils.ts             # cn() + helpers
│           └── mockData.ts          # Remove after DB connected
│
│
├── server/                          # Express backend
│   ├── index.ts                     # Entry: creates app, mounts middleware
│   ├── routes.ts                    # All route registrations
│   ├── static.ts                    # Serve Vite build in production
│   ├── vite.ts                      # Dev: proxy Vite HMR
│   ├── storage.ts                   # (legacy — replace with DB layer)
│   │
│   ├── controllers/                 ← TO BUILD
│   │   ├── authController.ts
│   │   ├── taskController.ts
│   │   ├── chatController.ts
│   │   ├── quizController.ts
│   │   ├── analyticsController.ts
│   │   └── uploadController.ts
│   │
│   ├── middleware/                  ← TO BUILD
│   │   ├── requireAuth.ts
│   │   ├── validateBody.ts
│   │   └── rateLimiter.ts
│   │
│   └── services/                   ← TO BUILD
│       ├── ai.service.ts            # Agnostic LLM abstractions
│       ├── pdf.service.ts           # PDF text extraction
│       └── analytics.service.ts    # Stats computation
│
│
├── shared/                          # Shared between client + server
│   └── schema.ts                    # Drizzle tables + Zod schemas + TS types
│
│
├── drizzle/                         # Auto-generated by drizzle-kit
│   └── migrations/
│       ├── 0000_initial.sql
│       └── meta/
│
├── uploads/                         # Temp file storage (gitignored)
│   └── .gitkeep
│
├── scripts/
│   └── seed.ts                      # DB seed script for development
│
├── .env                             # Secret config (gitignored)
├── .env.example                     # Template (committed)
├── .gitignore
├── drizzle.config.ts                # Drizzle CLI config
├── package.json
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
├── tailwind.config.ts
└── components.json                  # shadcn config
```

---

## 4. Request Lifecycle

### Standard API Request (e.g., "Get Tasks")

```
1. Browser
   └─ React component mounts
   └─ useQuery(['tasks'], fetchTasks) runs
   └─ fetchTasks() → GET /api/tasks

2. Network
   └─ Cookie header sent automatically (session cookie)

3. Express
   └─ routes.ts matches GET /api/tasks
   └─ [requireAuth middleware] → checks req.session.userId
      → 401 if missing
   └─ [validateBody middleware] → Zod validates query params
   └─ taskController.getAllTasks(req, res)

4. Controller
   └─ Extracts userId from req.session.userId
   └─ Calls db.select().from(tasks).where(eq(tasks.userId, userId))
   └─ Returns JSON: { data: { tasks: [...] } }

5. Browser
   └─ React Query caches the response
   └─ Component re-renders with task data
```

### AI Chat Request

```
1. Browser
   └─ User types message, presses Enter
   └─ useMutation(sendMessage) fires
   └─ Optimistic update: message appears in UI immediately
   └─ POST /api/chat { message: "Explain alkanes" }

2. Express
   └─ requireAuth checks session
   └─ rateLimiter checks IP/user frequency
   └─ chatController.sendMessage(req, res)

3. chatController
   └─ Validate: message not empty, not > 2000 chars
   └─ Fetch last 20 messages from chat_messages table (DB)
   └─ Fetch user.syllabusText from users table (DB)
   └─ Build system prompt with syllabus context
   └─ Call ai.service.chat(messages, systemPrompt)

4. ai.service.ts
   └─ Google Gemini API: generateContent({ ... })
   └─ Await response from Gemini API (1–4s)
   └─ Return response text

5. chatController (continued)
   └─ Save user message to chat_messages table
   └─ Save AI reply to chat_messages table
   └─ Return { data: { reply: "..." } }

6. Browser
   └─ useMutation onSuccess: append AI message to UI
   └─ Scroll to bottom of chat
```

---

## 5. Frontend Architecture

### Component Hierarchy

```
App.tsx
├── QueryClientProvider
│   └── TooltipProvider
│       └── Toaster
│           └── Router (Wouter)
│               └── AppLayout
│                   ├── Sidebar
│                   └── <main>
│                       ├── /         → Dashboard
│                       ├── /planner  → Planner
│                       ├── /tutor    → Tutor
│                       ├── /quiz     → Quiz
│                       ├── /analytics→ Analytics
│                       ├── /login    → Login
│                       ├── /register → Register
│                       └── *         → NotFound
```

### Custom Hooks Pattern

Each domain has a custom hook that wraps TanStack Query:

```typescript
// hooks/use-tasks.ts
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => api.get('/api/tasks', { params: filters }),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: NewTask) => api.post('/api/tasks', task),
    onMutate: async (newTask) => {
      // Optimistic update
      await qc.cancelQueries(['tasks']);
      const previous = qc.getQueryData(['tasks']);
      qc.setQueryData(['tasks'], (old: Task[]) => [...old, { ...newTask, id: 'temp', status: 'todo' }]);
      return { previous };
    },
    onError: (_, __, context) => {
      qc.setQueryData(['tasks'], context?.previous); // Revert on error
    },
    onSettled: () => {
      qc.invalidateQueries(['tasks']); // Refetch from server
    },
  });
}
```

---

## 6. Backend Architecture

### Controller Pattern

Controllers are thin — they validate input, call a service or DB query, and return the response.

```typescript
// controllers/taskController.ts
export const taskController = {
  async getAll(req: Request, res: Response) {
    const userId = req.session.userId!;
    const tasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.userId, userId));
    res.json({ data: { tasks } });
  },

  async create(req: Request, res: Response) {
    const userId = req.session.userId!;
    const body = createTaskSchema.parse(req.body);  // Zod validation
    const [task] = await db
      .insert(tasksTable)
      .values({ ...body, userId })
      .returning();
    res.status(201).json({ data: { task } });
  },
};
```

### Service Pattern

Services encapsulate business logic that spans multiple data sources or external APIs.

```typescript
// services/ai.service.ts
export class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY!;
  }

  async chat(messages: Message[], syllabusContext?: string): Promise<string> {
    const systemPrompt = buildSystemPrompt(syllabusContext);
    return callAI(systemPrompt, messages, 1024);
  }
}

export const aiService = new AIService();
```

### Middleware Chain

Every request passes through this chain:

```
Request
  ↓
express.json()        — Parse JSON body
  ↓
cors()                — Allow client origin
  ↓
express-session()     — Attach session to req
  ↓
Route match
  ↓
requireAuth()         — Check req.session.userId (if protected route)
  ↓
rateLimiter()         — Check request frequency (if AI route)
  ↓
validateBody()        — Zod schema validation
  ↓
Controller
  ↓
Response
```

---

## 7. Data Layer

### Drizzle Setup

```typescript
// server/db.ts
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import * as schema from "../shared/schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Type Flow

```typescript
// shared/schema.ts defines the table
export const tasks = pgTable("tasks", { ... });

// Drizzle infers TypeScript types automatically
export type Task    = typeof tasks.$inferSelect;  // SELECT result type
export type NewTask = typeof tasks.$inferInsert;  // INSERT input type

// These types are used in both server controllers and client hooks
import { Task, NewTask } from "@/shared/schema";  // Client
import { Task, NewTask } from "../shared/schema"; // Server
```

---

## 8. AI Service Layer

All AI API calls are centralized in `server/services/ai.service.ts`. No component or route file should ever call the LLM SDK directly.

```
Routes
  └─ chatController
      └─ ai.service.chat()
          └─ fetch → Gemini API

Routes
  └─ quizController
      └─ ai.service.generateQuiz()
          └─ fetch → Gemini API

Routes
  └─ planController
      └─ ai.service.generatePlan()
          └─ fetch → Gemini API

Routes
  └─ dashboardController
      └─ ai.service.generateDailyTip()
          └─ fetch → Gemini API
```

This single-service pattern means:
- API key is referenced in exactly one file
- All prompts are version-controlled in one place
- Rate limiting and error handling logic is written once
- Easy to swap model versions across all features at once

---

## 9. State Management

### Client State Philosophy

Study Sensei uses **server state** (TanStack Query) for all persistent data and **local component state** (useState) for ephemeral UI state only.

| Data | Storage | Why |
|---|---|---|
| Tasks list | TanStack Query cache | Server-owned, needs sync |
| Chat messages | TanStack Query cache | Server-owned, needs sync |
| Quiz questions | Component useState | Generated on-demand, not persisted until done |
| Quiz current question index | Component useState | Pure UI state |
| Input field values | Component useState | Ephemeral, no cache needed |
| Active page | Wouter (URL) | URL is the source of truth |
| Theme preference | localStorage | Device-local preference |
| Session/auth state | TanStack Query | Fetched from `/api/user/profile` |

### Cache Invalidation Strategy

```typescript
// After creating a task:
queryClient.invalidateQueries(['tasks'])        // Refetch task list
queryClient.invalidateQueries(['analytics'])    // Stats may have changed

// After completing a quiz:
queryClient.invalidateQueries(['quiz-history']) // Show new score
queryClient.invalidateQueries(['analytics'])    // Radar chart updates

// After uploading syllabus:
queryClient.invalidateQueries(['user-profile']) // Show new filename
```

---

## 10. Module Dependency Graph

```
client/src/pages/Dashboard.tsx
  └─ hooks/use-analytics.ts
      └─ lib/api.ts
          └─ (HTTP) → server/routes.ts
              └─ controllers/analyticsController.ts
                  └─ server/db.ts
                      └─ shared/schema.ts
                  └─ services/analytics.service.ts
                  └─ services/ai.service.ts


client/src/pages/Tutor.tsx
  └─ hooks/use-chat.ts
      └─ lib/api.ts
          └─ (HTTP) → server/routes.ts
              └─ controllers/chatController.ts
                  └─ services/ai.service.ts
                  └─ server/db.ts (save messages)
                      └─ shared/schema.ts


client/src/pages/Quiz.tsx
  └─ local useState (quiz questions, answers)
  └─ hooks/use-quiz.ts
      └─ lib/api.ts
          └─ (HTTP) → server/routes.ts
              └─ controllers/quizController.ts
                  └─ services/ai.service.ts
                  └─ server/db.ts (save results)
```
