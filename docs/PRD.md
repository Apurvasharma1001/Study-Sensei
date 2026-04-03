# Product Requirements Document (PRD)
## Study Sensei — Smart Study Companion

**Version:** 1.0.0  
**Date:** March 2026  
**Author:** Study Sensei Team  
**Status:** In Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Goals & Success Metrics](#4-goals--success-metrics)
5. [Product Scope](#5-product-scope)
6. [User Stories](#6-user-stories)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Constraints & Assumptions](#9-constraints--assumptions)
10. [Out of Scope](#10-out-of-scope)
11. [Timeline & Milestones](#11-timeline--milestones)
12. [Risks](#12-risks)

---

## 1. Executive Summary

Study Sensei is a web-based AI-powered study companion that helps students plan, learn, and track their academic progress. It combines a Kanban-style planner, an AI tutor powered by the Gemini API, an AI quiz generator, and a performance analytics dashboard — all in a single unified application.

Unlike generic note-taking or flashcard tools, Study Sensei acts as a personalized academic coach: it reads the student's own syllabus, identifies weak areas from quiz performance, and dynamically suggests what to study next.

The product is built for students preparing for exams, coursework, or self-directed learning. It does not train any AI model — all intelligence is delivered via the Google Gemini API (orchestrated agnostically).

---

## 2. Problem Statement

### The Pain Students Face

Students today are overwhelmed. They have:

- Multiple subjects with no unified task management system
- No way to identify which topics they are weakest on
- No accessible tutor available at 11 PM before an exam
- Generic study tools that don't adapt to their specific syllabus
- No visibility into whether they are actually prepared for an exam

### Current Alternatives Fall Short

| Tool | Problem |
|---|---|
| Notion / Google Docs | Good for notes, but no AI, no analytics, no quiz |
| Anki / Quizlet | Flashcards only, you make the cards yourself, no tutor |
| Khan Academy | Fixed curriculum, not tailored to your own syllabus |
| ChatGPT | Smart, but no study planning, no tracking, no structure |
| Google Calendar | Scheduling only, no content, no feedback |

**Study Sensei fills the gap** between generic productivity tools and a dedicated personal tutor.

---

## 3. Target Users

### Primary Persona — "The Exam-Pressured Student"

- **Who:** High school (Grade 10–12) or undergraduate college student
- **Age:** 16–24
- **Context:** Has multiple subjects, upcoming exams, limited time
- **Goals:** Pass exams, understand material faster, track preparation
- **Pain points:** Procrastination, unclear priorities, no tutor access, poor self-assessment
- **Tech comfort:** High — uses apps daily, comfortable with web interfaces

### Secondary Persona — "The Self-Learner"

- **Who:** Working professional or adult learner studying a new skill or certification
- **Age:** 22–35
- **Context:** Learning on the side, limited time, needs structure
- **Goals:** Master a topic, track progress, stay motivated
- **Pain points:** No structure, easy to lose momentum, hard to measure progress

### Out of Scope Personas

- K–8 students (too young for this interface complexity)
- Academic institutions (no B2B/multi-tenant features in v1)
- Teachers creating content for students (no content management features in v1)

---

## 4. Goals & Success Metrics

### Product Goals

| Goal | Description |
|---|---|
| Reduce study anxiety | Students feel organized and prepared, not overwhelmed |
| Increase retention | Spaced repetition via quizzes improves topic recall |
| Personalized experience | AI responds to the student's own syllabus, not generic content |
| Build study habits | Streak system motivates daily engagement |

### Key Performance Indicators (KPIs)

| Metric | Target (3 months post-launch) |
|---|---|
| Daily Active Users (DAU) | 500+ |
| Average session length | > 12 minutes |
| Quiz completion rate | > 70% of started quizzes completed |
| 7-day retention rate | > 40% |
| AI tutor messages per session | > 5 |
| Syllabus upload rate | > 30% of registered users |
| User-reported exam readiness | > 80% feel more prepared |

---

## 5. Product Scope

### Version 1.0 — Core (Now)

- User authentication (register, login, session)
- Dashboard with stats, streak, and AI tip
- Kanban-style study planner
- AI tutor chat (multi-turn, context-aware)
- AI quiz generator (5 MCQs, scored, reviewed)
- Performance analytics (radar, heatmap, subject bars)

### Version 1.1 — Enhanced AI (Weeks 6–10)

- PDF syllabus upload → tutor reads your actual material
- AI-generated weekly study plan
- Pomodoro timer with automatic session logging
- Subject-level exam readiness score (computed from quiz history)

### Version 1.2 — Gamification & Social (Months 3–5)

- Badge and achievement system
- Leaderboard among friends
- Shareable quiz results
- Email reminders and weekly digest

### Version 2.0 — Platform (Future, Not Scoped)

- Institution multi-tenant support
- Teacher content creation mode
- Mobile app (React Native)
- Offline mode with sync

---

## 6. User Stories

### Authentication

- As a new user, I want to register with my name, email, and password so I can create a personal account.
- As a returning user, I want to log in and see my data exactly as I left it.
- As a user, I want to log out securely from any device.

### Dashboard

- As a student, I want to see my study streak, total hours, task completion, and average quiz score at a glance.
- As a student, I want the AI to suggest what I should study today based on my weakest subjects.
- As a student, I want a quick way to start studying, add a task, or take a quiz from the dashboard.

### Planner

- As a student, I want to add tasks with a subject, estimated time, and due date.
- As a student, I want to drag tasks between To Do, In Progress, and Completed columns.
- As a student, I want to see all tasks filtered by subject.

### AI Tutor

- As a student, I want to ask the AI any question about my subjects and get a clear, concise answer.
- As a student, I want the AI to remember what we discussed earlier in the same session.
- As a student, I want the AI to use my uploaded syllabus when answering questions.
- As a student, I want to use quick prompt chips like `/explain`, `/quiz`, `/summarise`.

### Quiz

- As a student, I want to type any topic and get 5 AI-generated multiple-choice questions instantly.
- As a student, I want to see my score at the end and review which questions I got wrong.
- As a student, I want to see my quiz history and how scores have changed over time.
- As a student, I want weak topics automatically identified from my quiz history.

### Analytics

- As a student, I want to see a radar chart of my mastery across all subjects.
- As a student, I want to see a heatmap of my study consistency over the past 90 days.
- As a student, I want to see how many hours I've spent per subject.
- As a student, I want an overall exam readiness percentage to know if I'm on track.

### Syllabus Upload

- As a student, I want to upload my syllabus PDF so the AI tutor can reference it when I ask questions.
- As a student, I want to replace my syllabus if I upload a new version.

---

## 7. Functional Requirements

### FR-01: Authentication

- System must support email + password registration and login
- Passwords must be hashed (bcrypt, min 12 rounds)
- Sessions must expire after 7 days of inactivity
- Protected routes return 401 if no valid session

### FR-02: Dashboard

- Must display: streak count, study hours (this week), task completion ratio, avg quiz score
- AI tip must be generated fresh once per day per user (cached, not called on every render)
- Quick action buttons link to Planner, Tutor, Quiz pages

### FR-03: Planner

- Tasks have: title, subject, status (todo/in-progress/completed), estimated minutes, due date
- Status transitions: todo → in-progress → completed (and reverse)
- All task changes persist to database immediately
- User sees only their own tasks

### FR-04: AI Tutor

- Must maintain full conversation history within a session
- Conversation history must persist across page reloads (stored in DB)
- System prompt includes student's syllabus text if uploaded (truncated to 4000 chars)
- Rate limited to 20 AI requests per minute per user
- New conversation resets history (with user confirmation)

### FR-05: Quiz Generator

- User inputs a topic string; system returns exactly 5 MCQs
- Each question has: question text, 4 options, correct answer index, explanation
- AI response validated with Zod before returning to client
- Score is saved to quiz_results table after completion
- User can review all answers with explanations after submission

### FR-06: Analytics

- Subject mastery radar updates from real quiz score history
- Heatmap shows study activity for the last 91 days (from studySessions table)
- Hours per subject computed from studySessions, not hardcoded
- Exam readiness score = weighted average of quiz scores + tasks completed

### FR-07: PDF Upload

- Accepts PDF files only, max 10 MB
- Extracted text saved to users.syllabusText column
- AI tutor automatically uses this text as context on next session
- User can view the name of their current uploaded syllabus

---

## 8. Non-Functional Requirements

### Performance

- Dashboard must load in < 2 seconds on a 4G connection
- AI tutor response must begin streaming within 3 seconds of sending
- Quiz generation must complete within 8 seconds
- Database queries must execute in < 200ms for simple reads

### Reliability

- Application uptime target: 99.5%
- If Gemini API is unavailable (e.g. rate limits), safely catch the error and execute a native fallback (e.g. mock quiz generation or rate limit apology text) to prevent UI crashes.
- All form submissions must be idempotent (no duplicate tasks on double-click)

### Scalability

- Architecture must support 1,000 concurrent users without changes
- Database schema must support multi-user from day one (userId on every row)

### Accessibility

- All interactive elements keyboard-navigable
- Minimum contrast ratio 4.5:1 (WCAG AA)
- All images have alt text

### Browser Support

- Chrome 110+, Firefox 110+, Safari 16+, Edge 110+
- Mobile browser: iOS Safari 16+, Android Chrome 110+

---

## 9. Constraints & Assumptions

### Constraints

- We use the Google Gemini API — no custom model training or fine-tuning
- The API key must never be exposed to the client browser
- Free tier AI API costs must be monitored; rate limits enforced to control spend
- The initial version is a web app only (no native mobile app)

### Assumptions

- Users have a stable internet connection (no offline mode in v1)
- Users are comfortable typing questions in English
- PostgreSQL is available via a cloud provider (Neon, Railway, etc.)
- The application is deployed on a Node.js-compatible hosting platform

---

## 10. Out of Scope (v1.0)

- Native iOS or Android app
- Real-time collaboration or group study rooms
- Teacher / instructor portal
- Integration with LMS platforms (Canvas, Moodle, Google Classroom)
- Video or audio explanations from the AI
- Automatic calendar sync (Google Calendar, Outlook)
- Payments or subscription billing
- Email / push notifications
- Multi-language support

---

## 11. Timeline & Milestones

| Milestone | Description | Target |
|---|---|---|
| M1 — Foundation | Backend routes, auth, DB schema complete | Day 5 |
| M2 — Data Connected | All pages fetching from real DB (no mock data) | Day 9 |
| M3 — AI Live | Google API integrated server-side, quiz + tutor working | Day 12 |
| M4 — PDF + Plan | Syllabus upload and study plan generation live | Day 14 |
| M5 — Polish | Mobile responsive, loading states, error handling | Day 17 |
| M6 — Launch | Deployed to production, env vars configured | Day 18 |

---

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Gemini API rate limit exceeded | High | High | Rate limiter middleware, strict automatic fallback algorithms |
| API key exposed to client | Low | Critical | Server-side only, env var audit before deploy |
| AI returns invalid JSON for quiz | Medium | Medium | Zod validation + retry logic on parse failure |
| Database connection drops | Low | High | Connection pooling, retry on connect |
| PDF parsing fails on complex layouts | Medium | Low | Fallback: show error, allow manual text input |
| Scope creep delays launch | High | Medium | Strict v1.0 scope, defer all v1.1 features |
