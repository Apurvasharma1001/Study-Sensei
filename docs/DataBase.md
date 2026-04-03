# Database Design
## Study Sensei — Schema, Relationships & Query Patterns

**Version:** 1.0.0  
**Database:** PostgreSQL 15+  
**ORM:** Drizzle ORM  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Table Definitions](#3-table-definitions)
4. [Indexes](#4-indexes)
5. [Query Patterns](#5-query-patterns)
6. [Migration Strategy](#6-migration-strategy)
7. [Seed Data](#7-seed-data)

---

## 1. Overview

The database has **5 core tables**, all tied to a central `users` table via foreign key relationships. Every table enforces user ownership — a user can only read and write their own data.

| Table | Rows per user (est.) | Purpose |
|---|---|---|
| `users` | 1 | Identity, auth, syllabus storage |
| `tasks` | 10–200 | Kanban study tasks |
| `chat_messages` | 50–2000 | AI tutor conversation history |
| `quiz_results` | 20–500 | Completed quiz scores per topic |
| `study_sessions` | 100–2000 | Pomodoro/timer session logs |

---

## 2. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                              users                                   │
│                                                                     │
│  id (PK)          INT        serial                                 │
│  name             TEXT       not null                               │
│  email            TEXT       not null, unique                       │
│  password_hash    TEXT       not null                               │
│  avatar_initials  TEXT       nullable                               │
│  syllabus_text    TEXT       nullable  ← extracted PDF text        │
│  syllabus_name    TEXT       nullable  ← original filename         │
│  daily_tip        TEXT       nullable  ← AI-generated tip          │
│  tip_generated_at TIMESTAMP  nullable                               │
│  created_at       TIMESTAMP  default now()                          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ id
              ┌────────────┼─────────────┬─────────────┬──────────────┐
              │            │             │             │              │
              ▼            ▼             ▼             ▼              ▼
         ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
         │ tasks   │ │chat_msgs │ │quiz_res. │ │study_ses.│ │(future)  │
         └─────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Relationships

```
users 1 ──── ∞ tasks           (user_id FK, not null)
users 1 ──── ∞ chat_messages   (user_id FK, not null)
users 1 ──── ∞ quiz_results    (user_id FK, not null)
users 1 ──── ∞ study_sessions  (user_id FK, not null)
```

All relationships are `ON DELETE CASCADE` — deleting a user removes all their data.

---

## 3. Table Definitions

### 3.1 users

```typescript
export const users = pgTable("users", {
  id:             serial("id").primaryKey(),
  name:           text("name").notNull(),
  email:          text("email").notNull().unique(),
  passwordHash:   text("password_hash").notNull(),
  avatarInitials: text("avatar_initials"),
  syllabusText:   text("syllabus_text"),       // Extracted text from PDF (max ~20k chars)
  syllabusName:   text("syllabus_name"),       // Original filename e.g. "chem_syllabus.pdf"
  dailyTip:       text("daily_tip"),           // AI-generated tip, cached for 24h
  tipGeneratedAt: timestamp("tip_generated_at"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});
```

**Notes:**
- `email` is unique — duplicate registration returns a 409 error
- `passwordHash` stores bcrypt hash (never plain text)
- `syllabusText` is capped at 20,000 characters on write (enforced in controller)
- `dailyTip` is refreshed when `tipGeneratedAt` is > 24 hours ago

---

### 3.2 tasks

```typescript
export const tasks = pgTable("tasks", {
  id:            serial("id").primaryKey(),
  userId:        integer("user_id")
                   .references(() => users.id, { onDelete: "cascade" })
                   .notNull(),
  title:         text("title").notNull(),
  subject:       text("subject").notNull(),
  status:        text("status").notNull().default("todo"),
                 // Allowed: "todo" | "in-progress" | "completed"
  estimatedMins: integer("estimated_mins").default(30),
  dueDate:       text("due_date"),             // ISO string: "2026-04-01"
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  completedAt:   timestamp("completed_at"),    // Set when status → "completed"
});
```

**Valid status values:** `"todo"`, `"in-progress"`, `"completed"`

**Business rules:**
- When status changes to `"completed"`, set `completedAt = now()`
- When status moves back from `"completed"`, clear `completedAt = null`
- `dueDate` stored as ISO date string for easy display without timezone issues

---

### 3.3 chat_messages

```typescript
export const chatMessages = pgTable("chat_messages", {
  id:        serial("id").primaryKey(),
  userId:    integer("user_id")
               .references(() => users.id, { onDelete: "cascade" })
               .notNull(),
  role:      text("role").notNull(),     // "user" | "assistant"
  content:   text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Notes:**
- Messages are returned in `createdAt ASC` order
- When building the context for the LLM API, send only the last 20 messages (to control token count)
- A "clear history" action deletes all rows for `userId`

---

### 3.4 quiz_results

```typescript
export const quizResults = pgTable("quiz_results", {
  id:             serial("id").primaryKey(),
  userId:         integer("user_id")
                    .references(() => users.id, { onDelete: "cascade" })
                    .notNull(),
  topic:          text("topic").notNull(),          // e.g. "Organic Chemistry"
  score:          integer("score").notNull(),        // e.g. 4 (questions correct)
  totalQuestions: integer("total_questions").notNull().default(5),
  percentage:     real("percentage").notNull(),      // e.g. 80.0
  takenAt:        timestamp("taken_at").defaultNow().notNull(),
});
```

**Notes:**
- `percentage` is computed before insert: `(score / totalQuestions) * 100`
- Used by Analytics page to populate the radar chart (average by subject keyword match)
- The quiz history badges on the Quiz page come from the last 4 rows ordered by `takenAt DESC`

---

### 3.5 study_sessions

```typescript
export const studySessions = pgTable("study_sessions", {
  id:           serial("id").primaryKey(),
  userId:       integer("user_id")
                  .references(() => users.id, { onDelete: "cascade" })
                  .notNull(),
  subject:      text("subject"),                // nullable: can be an untagged session
  durationMins: integer("duration_mins").notNull(),
  sessionDate:  text("session_date").notNull(), // "YYYY-MM-DD" — used for streak/heatmap
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});
```

**Notes:**
- One row = one completed Pomodoro (or manually logged session)
- `sessionDate` is stored as a string (`"2026-03-22"`) to avoid timezone drift in streak calculation
- **Streak algorithm:**
  ```
  SELECT DISTINCT session_date
  FROM study_sessions
  WHERE user_id = $1
  ORDER BY session_date DESC

  Walk the sorted dates:
    streak = 1
    if date[i+1] == date[i] - 1 day → streak++
    else → break
  ```
- **Hours per subject:**
  ```sql
  SELECT subject, SUM(duration_mins) / 60.0 AS hours
  FROM study_sessions
  WHERE user_id = $1
  GROUP BY subject
  ```

---

## 4. Indexes

```sql
-- Frequently queried by userId on every request
CREATE INDEX idx_tasks_user_id         ON tasks(user_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_quiz_results_user_id  ON quiz_results(user_id);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);

-- For streak and heatmap calculations (ordered date scans)
CREATE INDEX idx_study_sessions_date   ON study_sessions(user_id, session_date DESC);

-- For quiz analytics grouped by topic
CREATE INDEX idx_quiz_results_topic    ON quiz_results(user_id, topic);

-- For task queries filtered by status
CREATE INDEX idx_tasks_status          ON tasks(user_id, status);

-- Unique email for auth lookups
CREATE UNIQUE INDEX idx_users_email    ON users(email);
```

---

## 5. Query Patterns

### 5.1 Get all tasks for a user

```typescript
const tasks = await db
  .select()
  .from(tasksTable)
  .where(eq(tasksTable.userId, userId))
  .orderBy(asc(tasksTable.createdAt));
```

### 5.2 Get analytics summary

```typescript
// Completed tasks count
const [{ count: completedCount }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(tasksTable)
  .where(and(eq(tasksTable.userId, userId), eq(tasksTable.status, "completed")));

// Average quiz score
const [{ avg }] = await db
  .select({ avg: sql<number>`avg(percentage)` })
  .from(quizResultsTable)
  .where(eq(quizResultsTable.userId, userId));

// Total study hours this week
const weekStart = new Date();
weekStart.setDate(weekStart.getDate() - 7);
const weekStartStr = weekStart.toISOString().slice(0, 10);

const [{ total }] = await db
  .select({ total: sql<number>`sum(duration_mins)` })
  .from(studySessionsTable)
  .where(
    and(
      eq(studySessionsTable.userId, userId),
      gte(studySessionsTable.sessionDate, weekStartStr)
    )
  );

const hoursThisWeek = (total ?? 0) / 60;
```

### 5.3 Get quiz results for radar chart (grouped by subject keyword)

```typescript
const results = await db
  .select({
    topic: quizResultsTable.topic,
    avgScore: sql<number>`avg(percentage)`,
  })
  .from(quizResultsTable)
  .where(eq(quizResultsTable.userId, userId))
  .groupBy(quizResultsTable.topic);

// Map topics to subjects by keyword matching
const subjectScores = SUBJECTS.map(subject => {
  const relevant = results.filter(r =>
    r.topic.toLowerCase().includes(subject.toLowerCase())
  );
  const avg = relevant.length
    ? relevant.reduce((sum, r) => sum + r.avgScore, 0) / relevant.length
    : DEFAULT_MASTERY[subject];
  return { subject, mastery: Math.round(avg) };
});
```

### 5.4 Calculate streak

```typescript
const sessions = await db
  .selectDistinct({ date: studySessionsTable.sessionDate })
  .from(studySessionsTable)
  .where(eq(studySessionsTable.userId, userId))
  .orderBy(desc(studySessionsTable.sessionDate));

const today = new Date().toISOString().slice(0, 10);
let streak = 0;
let expectedDate = today;

for (const { date } of sessions) {
  if (date === expectedDate) {
    streak++;
    const d = new Date(expectedDate);
    d.setDate(d.getDate() - 1);
    expectedDate = d.toISOString().slice(0, 10);
  } else {
    break;
  }
}
```

### 5.5 Get heatmap data (last 91 days)

```typescript
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 91);
const cutoffStr = cutoff.toISOString().slice(0, 10);

const sessions = await db
  .select({
    date: studySessionsTable.sessionDate,
    totalMins: sql<number>`sum(duration_mins)`,
  })
  .from(studySessionsTable)
  .where(
    and(
      eq(studySessionsTable.userId, userId),
      gte(studySessionsTable.sessionDate, cutoffStr)
    )
  )
  .groupBy(studySessionsTable.sessionDate);

// Build a 91-slot array with 0 for missing days
const heatmapMap = Object.fromEntries(sessions.map(s => [s.date, s.totalMins]));
const heatmapData = Array.from({ length: 91 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (90 - i));
  const key = d.toISOString().slice(0, 10);
  return { date: key, mins: heatmapMap[key] ?? 0 };
});
```

---

## 6. Migration Strategy

### Development

Use `drizzle-kit push:pg` — directly applies schema to the database without generating SQL files. Fast for iteration.

```bash
npx drizzle-kit push:pg
```

### Production

Use generated migration files for auditable, reversible changes.

```bash
# Generate SQL migration file
npx drizzle-kit generate:pg

# Review the generated file in drizzle/migrations/
# Then apply
npx drizzle-kit migrate:pg
```

### Initial Migration (0000_initial.sql)

The first migration creates all 5 tables and all indexes. Run once on a fresh database before first deploy.

---

## 7. Seed Data

For development and testing, seed the database with sample data:

```typescript
// scripts/seed.ts
import { db } from "../server/db";
import { users, tasks, quizResults, studySessions } from "../shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  // Create test user
  const hash = await bcrypt.hash("password123", 12);
  const [user] = await db.insert(users).values({
    name: "John Doe",
    email: "john@example.com",
    passwordHash: hash,
    avatarInitials: "JD",
  }).returning();

  // Create tasks
  await db.insert(tasks).values([
    { userId: user.id, title: "Read Chapter 12", subject: "Chemistry", status: "todo", dueDate: "2026-03-25", estimatedMins: 45 },
    { userId: user.id, title: "Integration Practice", subject: "Math", status: "in-progress", dueDate: "2026-03-24", estimatedMins: 60 },
    { userId: user.id, title: "WWI Timeline Review", subject: "History", status: "completed", estimatedMins: 30 },
  ]);

  // Create quiz results
  await db.insert(quizResults).values([
    { userId: user.id, topic: "Organic Chemistry", score: 3, totalQuestions: 5, percentage: 60.0 },
    { userId: user.id, topic: "Calculus Integration", score: 4, totalQuestions: 5, percentage: 80.0 },
    { userId: user.id, topic: "Newton's Laws Physics", score: 5, totalQuestions: 5, percentage: 100.0 },
  ]);

  // Create study sessions (last 7 days)
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    await db.insert(studySessions).values({
      userId: user.id,
      subject: ["Chemistry", "Math", "Physics", "History", "English", "Math", "Chemistry"][i],
      durationMins: [25, 50, 25, 0, 25, 75, 25][i],
      sessionDate: d.toISOString().slice(0, 10),
    });
  }

  console.log("Seed complete — user: john@example.com / password123");
}

seed().catch(console.error);
```

Run with: `npx tsx scripts/seed.ts`
