# Security
## Study Sensei — Security Design & Implementation

**Version:** 1.0.0  
**Date:** March 2026

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Authentication & Session Security](#2-authentication--session-security)
3. [API Key Security](#3-api-key-security)
4. [Input Validation](#4-input-validation)
5. [Authorization & Access Control](#5-authorization--access-control)
6. [Rate Limiting](#6-rate-limiting)
7. [File Upload Security](#7-file-upload-security)
8. [Data Security](#8-data-security)
9. [HTTPS & Transport Security](#9-https--transport-security)
10. [Security Checklist](#10-security-checklist)
11. [Incident Response](#11-incident-response)

---

## 1. Threat Model

### Assets to Protect

| Asset | Value | Risk |
|---|---|---|
| `GEMINI_API_KEY` | Critical | Stolen key = unbounded API costs |
| User passwords | Critical | Credential theft |
| User study data | Medium | Privacy violation |
| Session tokens | High | Account hijacking |
| Uploaded syllabus PDFs | Low-Medium | Private academic content |

### Threat Actors

- **Automated scrapers** — looking for exposed API keys in source code or responses
- **Casual attackers** — trying default credentials, SQL injection, XSS
- **Authenticated users** — trying to access other users' data

### Out of Scope Threats (for v1)

- Nation-state attacks
- Physical server compromise
- Supply chain attacks on npm packages

---

## 2. Authentication & Session Security

### Password Storage

```typescript
// NEVER store plain text passwords
// ALWAYS use bcrypt with cost factor 12

import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// On registration:
const passwordHash = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);
await db.insert(users).values({ email, name, passwordHash });

// On login:
const user = await db.select().from(users).where(eq(users.email, email));
const valid = await bcrypt.compare(plainTextPassword, user.passwordHash);
if (!valid) throw new UnauthorizedError("Invalid credentials");
```

**Why 12 rounds?** At 12 rounds, hashing takes ~250ms — fast enough for login, slow enough to make brute-force computationally expensive.

### Session Configuration

```typescript
app.use(session({
  store: new PgSession({ pool }),    // Sessions stored in PostgreSQL
  secret: process.env.SESSION_SECRET!, // Min 32 random characters
  resave: false,
  saveUninitialized: false,
  name: "ssid",                       // Non-default name avoids fingerprinting
  cookie: {
    secure: process.env.NODE_ENV === "production",  // HTTPS only in prod
    httpOnly: true,                    // Not accessible via JavaScript
    sameSite: "lax",                   // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7-day expiry
  },
}));
```

### Session Security Rules

- Sessions stored server-side in PostgreSQL — clients only hold a session ID cookie
- `httpOnly: true` prevents JavaScript from reading the session cookie (blocks XSS theft)
- `sameSite: "lax"` prevents the cookie from being sent on cross-origin requests (CSRF protection)
- `secure: true` in production ensures the cookie only travels over HTTPS
- Sessions expire after 7 days of inactivity

### Login Error Messages

Do not reveal whether the email or password was wrong:

```typescript
// WRONG — reveals whether email exists
if (!user) throw new Error("No account with that email");
if (!validPassword) throw new Error("Wrong password");

// CORRECT — generic message for both cases
if (!user || !valid) throw new Error("Invalid credentials");
```

---

## 3. API Key Security

The Gemini API key is the most critical secret in this application.

### Rules (Non-Negotiable)

```
✅ Stored ONLY in process.env.GEMINI_API_KEY
✅ Only accessed in server/services/ai.service.ts
✅ Never logged (even in error logs)
✅ Never returned in any API response
✅ Never committed to Git (.env is in .gitignore)
✅ Rotated immediately if accidentally exposed
```

### Implementation

```typescript
// server/services/ai.service.ts

// The key is read from env at service instantiation — never passed as a parameter
const API_KEY = process.env.GEMINI_API_KEY;

// ❌ NEVER do this
function getKey() {
  return process.env.GEMINI_API_KEY; // Don't export or return the key
}

// ❌ NEVER do this in a route response
res.json({ config: { apiKey: process.env.GEMINI_API_KEY } });

// ❌ NEVER log it
console.log("Using API key:", process.env.GEMINI_API_KEY);
```

### Pre-commit Hook (Recommended)

Add a pre-commit hook to prevent accidental key commits:

```bash
# .git/hooks/pre-commit
#!/bin/bash
if git diff --cached --name-only | xargs grep -l "AIza" 2>/dev/null; then
  echo "ERROR: Possible Gemini API key detected in staged files"
  exit 1
fi
```

### If Key is Exposed

1. Immediately rotate the key at `aistudio.google.com`
2. Delete the old key from the Google AI Studio console
3. Update `.env` on the server with the new key
4. Review access logs for unauthorized usage
5. Audit Git history — if committed, use `git filter-branch` or BFG to purge

---

## 4. Input Validation

All incoming data is validated with Zod before any processing.

### Schema Examples

```typescript
// shared/schema.ts — define schemas once, use everywhere

export const createTaskSchema = z.object({
  title:         z.string().min(3).max(200),
  subject:       z.enum(["Chemistry", "Math", "Physics", "History", "English", "Other"]),
  estimatedMins: z.number().int().min(5).max(480).optional().default(30),
  dueDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(2000).trim(),
});

export const generateQuizSchema = z.object({
  topic: z.string().min(3).max(200).trim(),
});

export const registerSchema = z.object({
  name:     z.string().min(2).max(50).trim(),
  email:    z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
});
```

### Validation Middleware

```typescript
// server/middleware/validateBody.ts
import { ZodSchema } from "zod";

export const validateBody = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: result.error.flatten(),
      });
    }
    req.body = result.data;  // Replace body with parsed+coerced data
    next();
  };

// Usage in routes:
router.post("/tasks", requireAuth, validateBody(createTaskSchema), taskController.create);
```

### SQL Injection Prevention

Drizzle ORM uses parameterized queries by default. **Never** use raw SQL string interpolation:

```typescript
// ✅ SAFE — Drizzle parameterizes automatically
const tasks = await db
  .select()
  .from(tasksTable)
  .where(eq(tasksTable.userId, userId));

// ❌ DANGEROUS — never do this
const tasks = await db.execute(
  sql`SELECT * FROM tasks WHERE user_id = ${userId}` // OK, tagged template
);

// ❌❌ NEVER do this
const tasks = await pool.query(
  `SELECT * FROM tasks WHERE user_id = '${userId}'` // Direct interpolation - SQL injection!
);
```

---

## 5. Authorization & Access Control

### Core Rule

Every database query that reads or writes user data **must** include a `userId` check.

```typescript
// ✅ CORRECT — always scope to authenticated user
const task = await db
  .select()
  .from(tasksTable)
  .where(
    and(
      eq(tasksTable.id, taskId),     // The resource requested
      eq(tasksTable.userId, userId)  // Must belong to this user
    )
  );

if (!task.length) {
  // This returns 404 whether the task doesn't exist OR belongs to another user
  // — we don't reveal which, to prevent user enumeration
  return res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
}

// ❌ WRONG — IDOR (Insecure Direct Object Reference) vulnerability
const task = await db
  .select()
  .from(tasksTable)
  .where(eq(tasksTable.id, taskId));  // Any user can access any task ID!
```

### requireAuth Middleware

```typescript
// server/middleware/requireAuth.ts
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({
      error: "Authentication required",
      code: "UNAUTHORIZED"
    });
  }
  next();
};
```

Apply to all routes except `/api/auth/register` and `/api/auth/login`.

---

## 6. Rate Limiting

### Configuration

```typescript
// server/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";

// AI routes — protect against cost abuse
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1-minute window
  max: 20,                // 20 AI requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait a moment.",
    code: "RATE_LIMITED"
  },
  skip: (req) => process.env.NODE_ENV === "test",
});

// Auth routes — prevent brute force
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15-minute window
  max: 10,                    // 10 login attempts per 15 minutes per IP
  message: {
    error: "Too many login attempts. Please wait 15 minutes.",
    code: "RATE_LIMITED"
  },
});

// Apply in routes:
router.post("/auth/login", authRateLimiter, authController.login);
router.post("/chat", requireAuth, aiRateLimiter, chatController.send);
router.post("/quiz/generate", requireAuth, aiRateLimiter, quizController.generate);
```

### Why Rate Limit AI Routes?

Each Gemini API call costs money or quota. Without rate limiting:
- A single user could send thousands of requests in seconds
- A bot or script could deplete your monthly API budget in minutes
- Gemini API has its own rate limits (e.g., Error 429) that, if hit, degrade the service for all users if not gracefully caught.

---

## 7. File Upload Security

```typescript
// server/middleware/upload.ts
import multer from "multer";

export const syllabusUpload = multer({
  storage: multer.memoryStorage(),  // Never write to disk without validation
  limits: {
    fileSize: 10 * 1024 * 1024,    // 10 MB maximum
    files: 1,                       // One file at a time
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are accepted"));
      return;
    }
    // Check file extension as secondary validation
    if (!file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(new Error("File must have .pdf extension"));
      return;
    }
    cb(null, true);
  },
});
```

### Additional Upload Security Rules

- Files are processed in memory and never written to disk in production
- Original filename is sanitized before storing in DB (no path traversal characters)
- Extracted text is truncated at 20,000 characters before storage
- No file content is ever returned to the client (only the filename)
- `uploads/` directory is in `.gitignore`

---

## 8. Data Security

### What Data We Store

| Data | Sensitivity | Storage | Encrypted at Rest? |
|---|---|---|---|
| Passwords | Critical | Bcrypt hash | N/A (one-way hash) |
| Email | Medium | Plain text | Via DB provider (Neon) |
| Syllabus text | Low-Medium | Plain text | Via DB provider |
| Chat messages | Low | Plain text | Via DB provider |
| Quiz results | Low | Plain text | Via DB provider |
| Session data | High | PostgreSQL | Via DB provider |

### What We Never Store

- Plain text passwords
- Full payment information
- Government IDs
- Health records

### Data Deletion

When a user deletes their account:

```typescript
// Cascading deletes handle child records automatically (ON DELETE CASCADE)
await db.delete(users).where(eq(users.id, userId));
// This deletes: tasks, chat_messages, quiz_results, study_sessions automatically
```

---

## 9. HTTPS & Transport Security

### Production Requirements

- All traffic must be HTTPS (enforced by hosting platform — Railway, Render, Replit all do this)
- HTTP requests redirected to HTTPS
- Session cookie `secure: true` in production (only sent over HTTPS)
- `Strict-Transport-Security` header recommended (set by hosting platform)

### CORS Configuration

```typescript
import cors from "cors";

app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? "https://your-production-domain.com"  // Exact origin in production
    : "http://localhost:5173",               // Vite dev server in development
  credentials: true,                        // Allow session cookies
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));
```

---

## 10. Security Checklist

### Before Every Deploy

- [ ] `GEMINI_API_KEY` is set in production environment and not in any code file
- [ ] `SESSION_SECRET` is set in production (min 32 random characters)
- [ ] `DATABASE_URL` is set and the DB is accessible from the server only
- [ ] `.env` file is in `.gitignore`
- [ ] `NODE_ENV=production` is set
- [ ] No `console.log` statements that output sensitive data
- [ ] All AI routes have `requireAuth` middleware
- [ ] All AI routes have `aiRateLimiter` middleware
- [ ] Auth routes have `authRateLimiter` middleware
- [ ] CORS origin is set to your production domain

### Code Review Checklist

- [ ] Every DB query scoped to `userId` for user-owned resources
- [ ] All route inputs validated with Zod before use
- [ ] No raw SQL string interpolation
- [ ] No API key in any response body
- [ ] Error messages don't reveal internal implementation details
- [ ] 404 returned for both "not found" and "access denied" (prevent user enumeration)

---

## 11. Incident Response

### API Key Compromised

1. Log into `aistudio.google.com` immediately
2. Delete the compromised key
3. Generate a new key
4. Update the production environment variable
5. Restart the server process
6. Check Google API usage logs for unauthorized calls
7. If unauthorized usage found: contact Google support

### Database Breach

1. Rotate `DATABASE_URL` credentials immediately
2. Invalidate all active sessions: `DELETE FROM session` in PostgreSQL
3. Force all users to re-login (session invalidation accomplishes this)
4. Notify users (passwords are hashed, but emails were exposed)
5. Review database access logs

### Unusual Traffic / Suspected Abuse

1. Review rate limiter logs for IP patterns
2. Temporarily increase rate limit strictness if needed
3. Block specific IPs at the hosting platform level if necessary
4. Check Gemini API usage dashboard for cost spikes
