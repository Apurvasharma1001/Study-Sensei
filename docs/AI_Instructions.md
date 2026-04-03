# AI Instructions
## Study Sensei — Gemini API Integration Guide

**Model:** `gemini-2.0-flash`  
**Provider:** Google  
**SDK:** `@google-ai/sdk`  
**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Setup & Configuration](#2-setup--configuration)
3. [Feature 1 — AI Tutor Chat](#3-feature-1--ai-tutor-chat)
4. [Feature 2 — Quiz Generator](#4-feature-2--quiz-generator)
5. [Feature 3 — Study Plan Generator](#5-feature-3--study-plan-generator)
6. [Feature 4 — Daily Dashboard Tip](#6-feature-4--daily-dashboard-tip)
7. [Prompt Engineering Guidelines](#7-prompt-engineering-guidelines)
8. [Error Handling & Retry Logic](#8-error-handling--retry-logic)
9. [Token Budget & Cost Control](#9-token-budget--cost-control)
10. [Testing AI Features](#10-testing-ai-features)

---

## 1. Overview

Study Sensei uses the **Google Gemini API** for all AI features. We access intelligence via API key — no model training, no fine-tuning, no model hosting. The API is called exclusively from the server (`server/services/gemini.service.ts`).

### AI Features Summary

| Feature | Endpoint | Prompt Style | Max Tokens | Avg Latency |
|---|---|---|---|---|
| AI Tutor | POST /api/chat | Multi-turn conversation | 1024 | 1–3s |
| Quiz Generator | POST /api/quiz/generate | JSON-structured output | 1500 | 3–6s |
| Study Plan | POST /api/plan/generate | Free-form structured text | 1500 | 3–7s |
| Daily Tip | (internal, cached) | Short motivational insight | 256 | 1–2s |

### Key Rules

- API key only in `process.env.GEMINI_API_KEY`
- All calls via `server/services/gemini.service.ts`
- All AI responses validated before returning to client
- Rate limited: 20 requests/minute/user on AI routes
- Never stream (simpler error handling with full responses)

---

## 2. Setup & Configuration

### Installation

```bash
npm install @google-ai/sdk
```

### Base Service File

```typescript
// server/services/gemini.service.ts

import Google from "@google-ai/sdk";

const client = new Google({
  apiKey: process.env.GEMINI_API_KEY,
  // maxRetries: 2,   // SDK-level retry on network errors (optional)
  // timeout: 30000,  // 30s timeout (optional, default is 10 min)
});

// Model used for all features — change here to update everywhere
export const GEMINI_MODEL = "gemini-2.0-flash";
```

### Environment Check on Startup

```typescript
// server/index.ts — fail fast if key is missing
if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL: GEMINI_API_KEY environment variable is not set");
  process.exit(1);
}
```

---

## 3. Feature 1 — AI Tutor Chat

### Purpose

Multi-turn conversational tutoring. The student asks questions, the AI answers in the context of the full conversation history. If the student has uploaded a syllabus PDF, its extracted text is injected into the system prompt.

### System Prompt

```typescript
export function buildTutorSystemPrompt(syllabusText?: string): string {
  return `You are Study Sensei, an expert AI tutor for students.

Your role:
- Answer questions clearly and concisely about any academic subject
- Use simple language; break down complex ideas step by step
- Be encouraging and supportive — students may be stressed or confused
- If asked for practice questions, provide exactly 3–5 with clear answers
- If asked to summarise a topic, keep it under 200 words
- Format responses with numbered lists when listing multiple points
- Do NOT use markdown symbols like ** or ## — use plain text only
- Do NOT begin your response with "Certainly!" or "Great question!" — get straight to the answer

${syllabusText
  ? `The student has provided their syllabus. When relevant, base your answers on this material:
---
${syllabusText.slice(0, 4000)}
---
Always prefer referencing the student's own curriculum when the topic is covered in their syllabus.`
  : ""}`.trim();
}
```

### API Call

```typescript
export async function tutorChat(
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  syllabusText?: string
): Promise<string> {
  const response = await client.messages.create({
    model: GEMINI_MODEL,
    max_tokens: 1024,
    system: buildTutorSystemPrompt(syllabusText),
    messages: conversationHistory,  // Full history sent each time
  });

  if (response.content[0].type !== "text") {
    throw new Error("Unexpected response type from Gemini API");
  }

  return response.content[0].text;
}
```

### Controller Integration

```typescript
// server/controllers/chatController.ts

export const chatController = {
  async sendMessage(req: Request, res: Response) {
    const userId = req.session.userId!;
    const { message } = sendMessageSchema.parse(req.body);

    // 1. Fetch conversation history (last 20 messages)
    const history = await db
      .select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(20);

    // 2. Get user's syllabus context
    const [user] = await db
      .select({ syllabusText: users.syllabusText })
      .from(users)
      .where(eq(users.id, userId));

    // 3. Build messages for Gemini (history + new message)
    const messages = [
      ...history,
      { role: "user" as const, content: message }
    ];

    // 4. Call Gemini API
    const reply = await tutorChat(messages, user?.syllabusText ?? undefined);

    // 5. Save both messages to DB
    await db.insert(chatMessages).values([
      { userId, role: "user", content: message },
      { userId, role: "assistant", content: reply },
    ]);

    res.json({ data: { reply } });
  }
};
```

### Context Window Management

The Gemini API has a context window limit. To stay within it:
- Send only the **last 20 messages** of conversation history
- Truncate `syllabusText` to **4000 characters** (roughly 1000 tokens)
- Ensure the system prompt is under **500 tokens**

```typescript
// Truncate syllabus before building the prompt
const truncatedSyllabus = syllabusText?.slice(0, 4000);

// Limit history to prevent context overflow
const recentHistory = fullHistory.slice(-20);
```

---

## 4. Feature 2 — Quiz Generator

### Purpose

Generate exactly 5 multiple-choice questions on any topic. The response must be valid JSON that conforms to a specific schema — the Zod validator rejects anything that doesn't match.

### Prompt

```typescript
export function buildQuizPrompt(topic: string): string {
  return `Create exactly 5 multiple-choice questions about "${topic}" for a student.

Requirements:
- Questions should test real understanding, not just memorization
- Each question has exactly 4 options
- Options should NOT begin with A) B) C) D) — write the answer text only
- Exactly one option is correct
- Provide a brief explanation (1–2 sentences) for why the correct answer is right
- Vary difficulty: 2 easy, 2 medium, 1 hard

Return ONLY a raw JSON object. No backticks, no preamble, no markdown. Exactly this structure:
{
  "questions": [
    {
      "question": "The question text goes here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct": 0,
      "explanation": "Brief explanation of why Option 1 is correct."
    }
  ]
}

The "correct" field is the 0-based index of the correct option.`;
}
```

### Zod Validation Schema

```typescript
// shared/schema.ts
import { z } from "zod";

export const QuizQuestionSchema = z.object({
  question:    z.string().min(10).max(500),
  options:     z.array(z.string().min(1).max(200)).length(4),
  correct:     z.number().int().min(0).max(3),
  explanation: z.string().min(5).max(500),
});

export const QuizResponseSchema = z.object({
  questions: z.array(QuizQuestionSchema).length(5),
});

export type QuizResponse = z.infer<typeof QuizResponseSchema>;
```

### API Call with Validation and Retry

```typescript
export async function generateQuiz(topic: string): Promise<QuizResponse> {
  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.messages.create({
        model: GEMINI_MODEL,
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: buildQuizPrompt(topic)
        }],
      });

      const text = response.content[0].type === "text"
        ? response.content[0].text
        : "";

      // Strip any accidental markdown code fences
      const cleaned = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      const validated = QuizResponseSchema.parse(parsed);  // Throws if invalid

      return validated;

    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error(`Quiz generation failed after ${MAX_RETRIES} attempts:`, error);
        throw new Error("Quiz generation failed — please try again");
      }
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error("Quiz generation failed");
}
```

### Why JSON Validation Matters

Gemini generally follows instructions well, but occasionally:
- Returns extra text before or after the JSON
- Wraps the JSON in markdown code fences (```json)
- Returns 4 questions instead of 5
- Uses a different field name (e.g., `answer` instead of `correct`)

The Zod schema catches all of these. The retry logic handles transient failures.

---

## 5. Feature 3 — Study Plan Generator

### Purpose

Generate a 7-day personalized study plan. Inputs are derived from the user's quiz history (weak subjects) and upcoming task due dates.

### Prompt

```typescript
export function buildStudyPlanPrompt(
  weakSubjects: string[],
  upcomingDeadlines: { title: string; subject: string; dueDate: string }[],
  currentDate: string
): string {
  const deadlineList = upcomingDeadlines
    .map(d => `- ${d.title} (${d.subject}) due ${d.dueDate}`)
    .join("\n");

  const weakList = weakSubjects.length > 0
    ? weakSubjects.join(", ")
    : "No specific weak areas identified yet";

  return `Create a personalized 7-day study plan for a student.

Today's date: ${currentDate}

Subjects needing most attention (based on quiz performance):
${weakList}

Upcoming deadlines and tasks:
${deadlineList || "No upcoming deadlines"}

Guidelines for the plan:
- Each day should have 2–3 focused study sessions
- Allocate more time to weak subjects
- Ensure deadline tasks have adequate preparation time
- Include review sessions for topics studied earlier in the week
- Be specific about what to study each day (not just "study Chemistry")
- Keep the total daily study time realistic (2–3 hours per day)
- Write in a clear, encouraging tone

Format the plan as:
Day 1 — [Day Name]:
  Morning/Evening: [Specific topic, duration]
  ...

Day 2 — [Day Name]:
  ...

End with a brief "Key Focus" paragraph summarizing the week's priorities.`;
}
```

### API Call

```typescript
export async function generateStudyPlan(
  weakSubjects: string[],
  upcomingDeadlines: { title: string; subject: string; dueDate: string }[],
  currentDate: string
): Promise<string> {
  const response = await client.messages.create({
    model: GEMINI_MODEL,
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: buildStudyPlanPrompt(weakSubjects, upcomingDeadlines, currentDate)
    }],
  });

  if (response.content[0].type !== "text") {
    throw new Error("Unexpected response type");
  }

  return response.content[0].text;
}
```

### Controller Integration

```typescript
// server/controllers/planController.ts

export const planController = {
  async generate(req: Request, res: Response) {
    const userId = req.session.userId!;

    // Compute weak subjects from quiz history (avg score < 70%)
    const quizData = await db
      .select({
        topic: quizResults.topic,
        avgScore: sql<number>`avg(percentage)`,
      })
      .from(quizResults)
      .where(eq(quizResults.userId, userId))
      .groupBy(quizResults.topic)
      .having(sql`avg(percentage) < 70`);

    // Subjects from quiz results that scored below 70%
    const weakSubjects = quizData.map(q => q.topic);

    // Get tasks due in the next 14 days
    const today = new Date().toISOString().slice(0, 10);
    const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const upcomingTasks = await db
      .select({ title: tasks.title, subject: tasks.subject, dueDate: tasks.dueDate })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          ne(tasks.status, "completed"),
          gte(tasks.dueDate, today),
          lte(tasks.dueDate, in14Days)
        )
      );

    const plan = await generateStudyPlan(weakSubjects, upcomingTasks, today);

    res.json({ data: { plan, generatedAt: new Date().toISOString() } });
  }
};
```

---

## 6. Feature 4 — Daily Dashboard Tip

### Purpose

A short, personalized AI tip shown on the Dashboard. Generated once per day per user and cached in the database to avoid unnecessary API calls.

### Caching Strategy

```typescript
// server/controllers/dashboardController.ts

async function getDailyTip(userId: number): Promise<string> {
  const [user] = await db
    .select({ dailyTip: users.dailyTip, tipGeneratedAt: users.tipGeneratedAt })
    .from(users)
    .where(eq(users.id, userId));

  // Regenerate if tip is older than 24 hours or doesn't exist
  const isStale = !user.tipGeneratedAt ||
    Date.now() - new Date(user.tipGeneratedAt).getTime() > 24 * 60 * 60 * 1000;

  if (!isStale && user.dailyTip) {
    return user.dailyTip;  // Return cached tip
  }

  // Generate new tip
  const newTip = await generateDailyTip();

  // Cache in DB
  await db
    .update(users)
    .set({ dailyTip: newTip, tipGeneratedAt: new Date() })
    .where(eq(users.id, userId));

  return newTip;
}
```

### Prompt

```typescript
export async function generateDailyTip(): Promise<string> {
  const tips = [
    "spaced repetition study technique",
    "active recall vs passive reading",
    "the Pomodoro technique for focus",
    "how sleep consolidates memory",
    "interleaving subjects for better retention",
    "the importance of practice testing",
    "managing exam anxiety",
  ];

  // Pick a random topic for variety
  const topic = tips[Math.floor(Math.random() * tips.length)];

  const response = await client.messages.create({
    model: GEMINI_MODEL,
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `Give a student one practical, specific study tip about: ${topic}.
Keep it to 2–3 sentences maximum. Be direct and actionable, not generic.
Do not start with "Here's a tip:" or similar preamble. Just the tip itself.`
    }],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "Try to study in focused 25-minute blocks with short breaks to maximize retention.";
}
```

---

## 7. Prompt Engineering Guidelines

### General Principles

**Be Explicit About Format**
```
❌ Vague: "Return the questions as JSON"
✅ Specific: "Return ONLY a raw JSON object with no backticks, no preamble.
              The object must have exactly this structure: {...}"
```

**Constrain Output Length**
```
❌ Vague: "Explain this concept"
✅ Specific: "Explain this concept in 3–4 sentences, suitable for a high school student"
```

**Forbid Unwanted Behaviors**
```
✅ Include: "Do NOT use markdown symbols like ** or ##"
✅ Include: "Do NOT begin with 'Certainly!' or 'Great question!'"
✅ Include: "Do NOT include any text outside the JSON object"
```

**Provide Examples When Format Matters**
```typescript
// For quiz generation, showing the exact JSON structure expected
// is far more reliable than describing it in words
```

**Separate Instructions from Content**
```typescript
// System prompt: permanent instructions, persona, rules
// User messages: the actual content/question

// Bad: mixing instructions and data in the user message
// Good: instructions → system prompt, data → user message
```

### Prompt Versioning

All prompts live in `server/services/gemini.service.ts`. When you change a prompt:

1. Test the new prompt manually in the Google console playground
2. Update the function in `gemini.service.ts`
3. Add a comment with the date and reason for the change
4. Test the affected endpoint

```typescript
// Prompt updated 2026-03-22: Added "Do NOT begin with Certainly!" to reduce
// sycophantic openings in tutor responses
export function buildTutorSystemPrompt(syllabusText?: string): string {
  // ...
}
```

---

## 8. Error Handling & Retry Logic

### Error Types from Gemini API

| Error | Cause | Handling |
|---|---|---|
| `AuthenticationError` | Invalid API key | Log error, return 503 to client |
| `RateLimitError` | Too many requests to Google | Retry with exponential backoff |
| `APIConnectionError` | Network failure | Retry 2x, then return 503 |
| `APIStatusError` | 5xx from Google | Retry 1x, then return 503 |
| `InvalidJSON` | Gemini returned non-JSON for quiz | Retry, then return 503 |

### Standard Error Handler

```typescript
// server/services/gemini.service.ts

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (error instanceof Google.RateLimitError) {
        if (isLastAttempt) throw new AIServiceError("Rate limit exceeded", "RATE_LIMIT", false);
        await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
        continue;
      }

      if (error instanceof Google.APIConnectionError) {
        if (isLastAttempt) throw new AIServiceError("AI service unavailable", "AI_UNAVAILABLE", true);
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      throw error;  // Unknown errors: don't retry
    }
  }
  throw new AIServiceError("Max retries exceeded", "MAX_RETRIES", false);
}
```

### Client-Facing Error Messages

```typescript
// server/controllers/chatController.ts
try {
  const reply = await tutorChat(messages, syllabusContext);
  res.json({ data: { reply } });
} catch (error) {
  if (error instanceof AIServiceError) {
    return res.status(503).json({
      error: "The AI tutor is temporarily unavailable. Please try again in a moment.",
      code: "AI_ERROR"
    });
  }
  throw error;  // Let global error handler catch unexpected errors
}
```

---

## 9. Token Budget & Cost Control

### Token Estimates Per Feature

| Feature | System Tokens | Input Tokens | Output Tokens | Total/Request |
|---|---|---|---|---|
| Tutor chat | ~200 (no syllabus) | ~1000 (20-msg history) | ~300 | ~1500 |
| Tutor chat w/ syllabus | ~800 (4000-char syllabus) | ~1000 | ~300 | ~2100 |
| Quiz generation | 0 | ~200 (prompt) | ~800 (5 questions) | ~1000 |
| Study plan | 0 | ~400 (data + prompt) | ~600 | ~1000 |
| Daily tip | 0 | ~80 | ~100 | ~180 |

### Cost Estimates (Gemini 2.0 Flash pricing)

```
Input:  ~$3 per million tokens
Output: ~$15 per million tokens

Per user per day (moderate usage):
  5 tutor messages:   5 × 2100 tokens = 10,500 input + 5 × 300 = 1,500 output
  2 quizzes:          2 × 200 = 400 input + 2 × 800 = 1,600 output
  1 daily tip:        80 input + 100 output

  Total/user/day: ~11,000 input + 3,200 output
  Cost/user/day:  ~$0.033 input + $0.048 output = ~$0.081/user/day
  100 daily users: ~$8/day = ~$240/month
```

### Cost Control Mechanisms

```typescript
// 1. Max tokens per request — hard cap on output length
max_tokens: 1024  // Tutor: prevents runaway responses

// 2. History limit — control input tokens
const recentHistory = fullHistory.slice(-20);  // Max 20 messages sent

// 3. Syllabus truncation — control system prompt size
const truncatedSyllabus = syllabusText?.slice(0, 4000);

// 4. Daily tip caching — one AI call per user per day (not per page load)
const CACHE_DURATION = 24 * 60 * 60 * 1000;  // 24 hours

// 5. Rate limiting — prevent abuse
rateLimit({ windowMs: 60_000, max: 20 })  // 20 AI calls/minute/user
```

---

## 10. Testing AI Features

### Manual Testing (Quick)

Use the Google Console playground at `aistudio.google.com`:
1. Paste your system prompt
2. Send test messages
3. Verify format, tone, and accuracy before deploying to production

### Unit Testing (Recommended)

Mock the Google SDK in tests to avoid real API calls:

```typescript
// tests/quiz.test.ts
import { vi, describe, it, expect } from "vitest";
import * as sdk from "@google-ai/sdk";

vi.mock("@google-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{
          type: "text",
          text: JSON.stringify({
            questions: Array(5).fill({
              question: "Test question?",
              options: ["A", "B", "C", "D"],
              correct: 0,
              explanation: "Because A is correct."
            })
          })
        }]
      })
    }
  }))
}));

describe("generateQuiz", () => {
  it("returns exactly 5 validated questions", async () => {
    const quiz = await generateQuiz("Test Topic");
    expect(quiz.questions).toHaveLength(5);
    expect(quiz.questions[0]).toHaveProperty("correct");
  });

  it("validates Zod schema", async () => {
    const quiz = await generateQuiz("Test Topic");
    // Zod parsing is inside generateQuiz — if it didn't throw, it passed
    expect(quiz.questions[0].options).toHaveLength(4);
  });
});
```

### Integration Testing (Before Deploy)

After any prompt change, manually test these scenarios:

**AI Tutor:**
- [ ] Simple factual question returns a clear answer
- [ ] Follow-up question references previous message
- [ ] Long question (2000 chars) is processed correctly
- [ ] Request with syllabus context references the syllabus in the answer

**Quiz Generator:**
- [ ] Returns exactly 5 questions
- [ ] All `correct` values are 0–3
- [ ] No question has fewer than 4 options
- [ ] Unusual topics (obscure science, niche history) still return valid JSON

**Study Plan:**
- [ ] Plan covers exactly 7 days
- [ ] Weak subjects receive more coverage
- [ ] Upcoming deadlines appear in the plan
- [ ] Plan is readable and not JSON/markdown

**Daily Tip:**
- [ ] Returns 2–3 sentences max
- [ ] Actionable, not generic
- [ ] Does not begin with "Certainly!" or similar
