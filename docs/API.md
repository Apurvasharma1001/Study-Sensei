# API Reference
## Study Sensei — REST API Specification

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api` (development)  
**Auth:** Session cookie (`connect.sid`)  
**Content-Type:** `application/json`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User Profile](#2-user-profile)
3. [Tasks](#3-tasks)
4. [AI Tutor Chat](#4-ai-tutor-chat)
5. [Quiz](#5-quiz)
6. [Analytics](#6-analytics)
7. [Uploads](#7-uploads)
8. [Study Plan](#8-study-plan)
9. [Study Sessions](#9-study-sessions)
10. [Error Reference](#10-error-reference)

---

## Conventions

### Success Responses

```json
HTTP 200 OK
{ "data": { ... } }

HTTP 201 Created
{ "data": { ... } }
```

### Error Responses

```json
HTTP 4xx / 5xx
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Authentication

All routes except `/api/auth/*` require a valid session cookie.  
Unauthenticated requests return `401 Unauthorized`.

---

## 1. Authentication

### POST /api/auth/register

Register a new user account.

**Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Validation Rules**
- `name`: required, min 2 chars, max 50 chars
- `email`: required, valid email format
- `password`: required, min 8 chars

**Response `201`**
```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "avatarInitials": "JD",
      "createdAt": "2026-03-22T10:00:00Z"
    }
  }
}
```

**Errors**
| Code | Status | Meaning |
|---|---|---|
| `EMAIL_TAKEN` | 409 | Email already registered |
| `VALIDATION_ERROR` | 400 | Missing/invalid fields |

---

### POST /api/auth/login

Authenticate and create a session.

**Request Body**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response `200`**
```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "avatarInitials": "JD",
      "syllabusName": "chem_syllabus.pdf"
    }
  }
}
```

**Errors**
| Code | Status | Meaning |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `VALIDATION_ERROR` | 400 | Missing fields |

---

### POST /api/auth/logout

🔒 Requires auth

Destroy the current session.

**Request Body:** None

**Response `200`**
```json
{ "data": { "message": "Logged out" } }
```

---

## 2. User Profile

### GET /api/user/profile

🔒 Requires auth

Get the authenticated user's profile and basic stats.

**Response `200`**
```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "avatarInitials": "JD",
      "syllabusName": "chem_syllabus.pdf",
      "hasSyllabus": true,
      "createdAt": "2026-03-22T10:00:00Z"
    }
  }
}
```

---

### PATCH /api/user/profile

🔒 Requires auth

Update user's profile fields.

**Request Body** (all fields optional)
```json
{
  "name": "Johnny Doe",
  "avatarInitials": "JD"
}
```

**Response `200`**
```json
{
  "data": {
    "user": { "id": 1, "name": "Johnny Doe", "avatarInitials": "JD" }
  }
}
```

---

### DELETE /api/user/account

🔒 Requires auth

Permanently delete user account and all associated data.

**Request Body**
```json
{ "confirmation": "DELETE" }
```

**Response `200`**
```json
{ "data": { "message": "Account deleted" } }
```

**Errors**
| Code | Status | Meaning |
|---|---|---|
| `CONFIRMATION_REQUIRED` | 400 | Confirmation string doesn't match |

---

## 3. Tasks

### GET /api/tasks

🔒 Requires auth

Get all tasks for the authenticated user.

**Query Parameters**
| Param | Type | Description |
|---|---|---|
| `status` | string | Filter by: `todo`, `in-progress`, `completed` |
| `subject` | string | Filter by subject name |

**Response `200`**
```json
{
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "Read Chapter 12: Organic Reactions",
        "subject": "Chemistry",
        "status": "todo",
        "estimatedMins": 45,
        "dueDate": "2026-03-25",
        "createdAt": "2026-03-22T10:00:00Z",
        "completedAt": null
      }
    ]
  }
}
```

---

### POST /api/tasks

🔒 Requires auth

Create a new task.

**Request Body**
```json
{
  "title": "Read Chapter 12: Organic Reactions",
  "subject": "Chemistry",
  "estimatedMins": 45,
  "dueDate": "2026-03-25"
}
```

**Validation**
- `title`: required, min 3 chars, max 200 chars
- `subject`: required, one of: `Chemistry | Math | Physics | History | English | Other`
- `estimatedMins`: optional, integer 5–480
- `dueDate`: optional, ISO date string `YYYY-MM-DD`

**Response `201`**
```json
{
  "data": {
    "task": {
      "id": 7,
      "title": "Read Chapter 12: Organic Reactions",
      "subject": "Chemistry",
      "status": "todo",
      "estimatedMins": 45,
      "dueDate": "2026-03-25",
      "createdAt": "2026-03-22T12:00:00Z"
    }
  }
}
```

---

### PATCH /api/tasks/:id

🔒 Requires auth

Update a task. All fields optional.

**Request Body**
```json
{
  "status": "in-progress",
  "title": "Updated title",
  "estimatedMins": 60
}
```

**Business Logic**
- If `status` changes to `"completed"`, server sets `completedAt = now()`
- If `status` moves away from `"completed"`, server clears `completedAt = null`

**Response `200`**
```json
{
  "data": {
    "task": { "id": 7, "status": "in-progress", "completedAt": null }
  }
}
```

**Errors**
| Code | Status | Meaning |
|---|---|---|
| `NOT_FOUND` | 404 | Task doesn't exist or belongs to another user |
| `VALIDATION_ERROR` | 400 | Invalid status value |

---

### DELETE /api/tasks/:id

🔒 Requires auth

Delete a task permanently.

**Response `200`**
```json
{ "data": { "deleted": true } }
```

---

## 4. AI Tutor Chat

### POST /api/chat

🔒 Requires auth · 🚦 Rate limited (20 req/min)

Send a message to the AI tutor and receive a response.

**Request Body**
```json
{
  "message": "Explain the difference between alkanes and alkenes"
}
```

**Server Behavior**
1. Validates message (not empty, max 2000 chars)
2. Fetches last 20 chat messages from DB for this user
3. Fetches user's `syllabusText` from DB (if available)
4. Builds system prompt with syllabus context
5. Calls Gemini API with full conversation history + new message
6. Saves both user message and AI response to `chat_messages` table
7. Returns AI response

**Response `200`**
```json
{
  "data": {
    "reply": "Alkanes and alkenes are both hydrocarbons, but differ in their bonding...",
    "messageId": 47
  }
}
```

**Errors**
| Code | Status | Meaning |
|---|---|---|
| `RATE_LIMITED` | 429 | Too many requests |
| `AI_ERROR` | 503 | API Provider unavailable |
| `MESSAGE_TOO_LONG` | 400 | Message exceeds 2000 chars |

---

### GET /api/chat/history

🔒 Requires auth

Get the user's conversation history.

**Query Parameters**
| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 50 | Max messages to return |
| `offset` | number | 0 | Pagination offset |

**Response `200`**
```json
{
  "data": {
    "messages": [
      {
        "id": 1,
        "role": "assistant",
        "content": "Hi! I'm your AI Study Companion...",
        "createdAt": "2026-03-22T09:00:00Z"
      },
      {
        "id": 2,
        "role": "user",
        "content": "Explain alkanes",
        "createdAt": "2026-03-22T09:01:00Z"
      }
    ],
    "total": 24
  }
}
```

---

### DELETE /api/chat/history

🔒 Requires auth

Clear all chat messages for the user. Irreversible.

**Response `200`**
```json
{ "data": { "deleted": true, "count": 24 } }
```

---

## 5. Quiz

### POST /api/quiz/generate

🔒 Requires auth · 🚦 Rate limited (20 req/min)

Generate 5 AI-powered multiple-choice questions on a topic.

**Request Body**
```json
{
  "topic": "Organic Chemistry — Hydrocarbons"
}
```

**Validation**
- `topic`: required, min 3 chars, max 200 chars

**Server Behavior**
1. Calls Gemini API with a structured JSON prompt
2. Parses and validates the response with Zod schema
3. Retries once if response is invalid JSON
4. Returns validated quiz data

**Response `200`**
```json
{
  "data": {
    "quiz": {
      "topic": "Organic Chemistry — Hydrocarbons",
      "questions": [
        {
          "question": "Which functional group characterises an alkene?",
          "options": [
            "Single C-C bond",
            "Double C=C bond",
            "Triple C≡C bond",
            "Hydroxyl -OH group"
          ],
          "correct": 1,
          "explanation": "Alkenes are defined by the presence of at least one carbon-carbon double bond (C=C)."
        }
      ]
    }
  }
}
```

**Errors**
| Code | Status | Meaning |
|---|---|---|
| `AI_GENERATION_FAILED` | 503 | Model returned invalid JSON after 2 retries |
| `RATE_LIMITED` | 429 | Too many requests |
| `TOPIC_TOO_SHORT` | 400 | Topic under 3 characters |

---

### POST /api/quiz/result

🔒 Requires auth

Save a completed quiz result to the database.

**Request Body**
```json
{
  "topic": "Organic Chemistry — Hydrocarbons",
  "score": 4,
  "totalQuestions": 5
}
```

**Response `201`**
```json
{
  "data": {
    "result": {
      "id": 23,
      "topic": "Organic Chemistry — Hydrocarbons",
      "score": 4,
      "totalQuestions": 5,
      "percentage": 80.0,
      "takenAt": "2026-03-22T15:30:00Z"
    }
  }
}
```

---

### GET /api/quiz/history

🔒 Requires auth

Get the user's quiz history.

**Query Parameters**
| Param | Type | Default |
|---|---|---|
| `limit` | number | 20 |
| `offset` | number | 0 |

**Response `200`**
```json
{
  "data": {
    "results": [
      {
        "id": 23,
        "topic": "Organic Chemistry",
        "score": 4,
        "totalQuestions": 5,
        "percentage": 80.0,
        "takenAt": "2026-03-22T15:30:00Z"
      }
    ],
    "total": 12
  }
}
```

---

## 6. Analytics

### GET /api/analytics

🔒 Requires auth

Get all analytics data for the authenticated user in one call.

**Response `200`**
```json
{
  "data": {
    "stats": {
      "streak": 5,
      "hoursThisWeek": 14.5,
      "tasksCompleted": 8,
      "tasksTotal": 12,
      "avgQuizScore": 78.4
    },
    "subjectMastery": [
      { "subject": "Chemistry",  "mastery": 65, "quizCount": 3 },
      { "subject": "Math",       "mastery": 88, "quizCount": 5 },
      { "subject": "Physics",    "mastery": 79, "quizCount": 2 },
      { "subject": "History",    "mastery": 91, "quizCount": 1 },
      { "subject": "English",    "mastery": 85, "quizCount": 0 }
    ],
    "hoursPerSubject": [
      { "subject": "Chemistry", "hours": 8.2 },
      { "subject": "Math",      "hours": 12.5 },
      { "subject": "Physics",   "hours": 6.0 }
    ],
    "weeklyActivity": [
      { "day": "Mon", "hours": 2.5 },
      { "day": "Tue", "hours": 3.0 },
      { "day": "Wed", "hours": 0.0 },
      { "day": "Thu", "hours": 4.5 },
      { "day": "Fri", "hours": 1.5 },
      { "day": "Sat", "hours": 2.0 },
      { "day": "Sun", "hours": 0.5 }
    ],
    "heatmap": [
      { "date": "2026-01-01", "mins": 50 },
      { "date": "2026-01-02", "mins": 0 },
      { "date": "2026-01-03", "mins": 75 }
    ],
    "examReadiness": 82
  }
}
```

---

## 7. Uploads

### POST /api/upload/syllabus

🔒 Requires auth

Upload a PDF syllabus. The extracted text is stored in the user record and used as AI tutor context.

**Request:** `multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `syllabus` | File (PDF) | Yes |

**Constraints**
- MIME type: `application/pdf` only
- Max file size: 10 MB

**Server Behavior**
1. Receive file buffer via Multer
2. Extract text with `pdf-parse`
3. Truncate extracted text to 20,000 characters
4. Save to `users.syllabusText` and `users.syllabusName`

**Response `200`**
```json
{
  "data": {
    "fileName": "chemistry_syllabus.pdf",
    "extractedChars": 8432,
    "message": "Syllabus uploaded. AI tutor will now use it for context."
  }
}
```

**Errors**
| Code | Status | Meaning |
|---|---|---|
| `INVALID_FILE_TYPE` | 400 | File is not a PDF |
| `FILE_TOO_LARGE` | 400 | File exceeds 10 MB |
| `PARSE_FAILED` | 422 | PDF could not be parsed (corrupt/image-only PDF) |

---

## 8. Study Plan

### POST /api/plan/generate

🔒 Requires auth · 🚦 Rate limited

Generate an AI-powered 7-day study plan based on weak subjects and upcoming deadlines.

**Request Body** (optional — server fetches from DB if not provided)
```json
{
  "focusSubjects": ["Chemistry", "Physics"],
  "upcomingExams": [
    { "subject": "Chemistry", "date": "2026-04-05" }
  ]
}
```

**Server Behavior**
1. If `focusSubjects` not provided: compute from quiz history (subjects with avg < 70%)
2. If `upcomingExams` not provided: pull from tasks with `dueDate` in next 14 days
3. Call Gemini API for plan generation
4. Return the plan as formatted text

**Response `200`**
```json
{
  "data": {
    "plan": "**Day 1 — Monday:** Focus on Organic Chemistry...\n\n**Day 2 — Tuesday:**...",
    "generatedAt": "2026-03-22T16:00:00Z"
  }
}
```

---

## 9. Study Sessions

### POST /api/sessions

🔒 Requires auth

Log a completed study session (called automatically by Pomodoro timer).

**Request Body**
```json
{
  "subject": "Chemistry",
  "durationMins": 25,
  "sessionDate": "2026-03-22"
}
```

**Response `201`**
```json
{
  "data": {
    "session": {
      "id": 101,
      "subject": "Chemistry",
      "durationMins": 25,
      "sessionDate": "2026-03-22",
      "createdAt": "2026-03-22T18:30:00Z"
    },
    "newStreak": 6
  }
}
```

---

## 10. Error Reference

### HTTP Status Codes Used

| Status | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error — bad request body |
| 401 | Unauthenticated — no valid session |
| 403 | Forbidden — authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict — e.g. duplicate email |
| 422 | Unprocessable — valid format, logic error |
| 429 | Rate limited |
| 503 | External service (AI API) unavailable |
| 500 | Internal server error |

### Error Code Reference

| Code | Status | Route | Meaning |
|---|---|---|---|
| `EMAIL_TAKEN` | 409 | POST /auth/register | Email already registered |
| `INVALID_CREDENTIALS` | 401 | POST /auth/login | Wrong email or password |
| `NOT_FOUND` | 404 | Any /:id route | Resource not found or not owned by user |
| `VALIDATION_ERROR` | 400 | Any | Zod schema validation failed |
| `RATE_LIMITED` | 429 | AI routes | Too many requests per minute |
| `AI_ERROR` | 503 | /chat, /quiz/generate | AI Provider unavailable |
| `AI_GENERATION_FAILED` | 503 | /quiz/generate | Model returned invalid JSON after retries |
| `INVALID_FILE_TYPE` | 400 | /upload/syllabus | Non-PDF file uploaded |
| `FILE_TOO_LARGE` | 400 | /upload/syllabus | File > 10 MB |
| `PARSE_FAILED` | 422 | /upload/syllabus | PDF text extraction failed |
| `CONFIRMATION_REQUIRED` | 400 | DELETE /user/account | Confirmation string not "DELETE" |
