# Deployment Guide
## Study Sensei — Production Setup & Operations

**Version:** 1.0.0  
**Date:** March 2026

---

## Table of Contents

1. [Deployment Overview](#1-deployment-overview)
2. [Environment Variables Reference](#2-environment-variables-reference)
3. [Build Process](#3-build-process)
4. [Option A: Railway (Recommended)](#4-option-a-railway-recommended)
5. [Option B: Render](#5-option-b-render)
6. [Option C: Replit](#6-option-c-replit)
7. [Database Setup in Production](#7-database-setup-in-production)
8. [First Deploy Checklist](#8-first-deploy-checklist)
9. [Updating the Application](#9-updating-the-application)
10. [Monitoring & Logs](#10-monitoring--logs)
11. [Rollback Procedure](#11-rollback-procedure)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Deployment Overview

Study Sensei deploys as a **single Node.js process** that serves both the API and the built React frontend.

```
Build output:
  dist/
  ├── public/          ← Vite-built React app (static files)
  │   ├── index.html
  │   ├── assets/
  │   └── ...
  └── index.js         ← Bundled Express server

Production server behavior:
  - Express serves dist/public/ for all non-/api/* routes
  - Express handles /api/* routes
  - React Router handles all client-side navigation
```

### Production Request Flow

```
User visits https://studysensei.app/planner

1. Request hits Express server
2. Express: path is not /api/* → serve dist/public/index.html
3. Browser loads React app
4. Wouter (client-side router) renders /planner page
5. React Query fetches /api/tasks (AJAX)
6. Express handles /api/tasks normally
```

---

## 2. Environment Variables Reference

All environment variables must be set before the server starts.

| Variable | Required | Example | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | `AIzaSy...` | From aistudio.google.com |
| `DATABASE_URL` | ✅ Yes | `postgresql://user:pass@host/db?sslmode=require` | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ Yes | `a8f3k2n9...` (32+ chars) | Random string for signing session cookies |
| `NODE_ENV` | ✅ Yes | `production` | Enables production optimizations |
| `PORT` | Optional | `5000` | HTTP port (most platforms set this automatically) |

### Generating SESSION_SECRET

```bash
# Option 1: OpenSSL (Mac/Linux)
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output: a3f8c2e1b4d7a9f0c6e2b8d4a1f7c3e9...
```

### .env.example (commit this)

```env
# Copy this file to .env and fill in real values
# NEVER commit .env to version control

GEMINI_API_KEY=
DATABASE_URL=
SESSION_SECRET=
NODE_ENV=development
PORT=5000
```

---

## 3. Build Process

### Build Script (`package.json`)

```json
{
  "scripts": {
    "dev":   "concurrently \"vite\" \"tsx watch server/index.ts\"",
    "build": "tsc --noEmit && vite build && esbuild server/index.ts --bundle --platform=node --outfile=dist/index.js --external:@neondatabase/serverless",
    "start": "node dist/index.js",
    "db:push": "drizzle-kit push:pg",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit migrate:pg",
    "db:studio": "drizzle-kit studio",
    "seed": "tsx scripts/seed.ts"
  }
}
```

### Build Steps Explained

```bash
npm run build

# Step 1: TypeScript type check
tsc --noEmit
# Fails fast if there are type errors — don't deploy broken types

# Step 2: Vite builds React frontend
vite build
# Output: dist/public/ (static HTML/JS/CSS)

# Step 3: esbuild bundles Express server
esbuild server/index.ts --bundle --platform=node --outfile=dist/index.js
# Output: dist/index.js (single bundled server file)
```

### Verify Build Locally

```bash
# Build
npm run build

# Set production env (temporarily)
export DATABASE_URL="your-db-url"
export SESSION_SECRET="your-secret"
export GEMINI_API_KEY="your-key"
export NODE_ENV=production

# Run production server
node dist/index.js

# Should see: Server running on port 5000
# Visit: http://localhost:5000
```

---

## 4. Option A: Railway (Recommended)

Railway is the easiest deployment option — it provides both a Node.js host and a managed PostgreSQL database.

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Deploy from GitHub

```
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account
4. Select the Study-Sensei repository
5. Railway detects Node.js automatically
```

### Step 3: Add PostgreSQL Database

```
1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway provisions a database in ~30 seconds
4. Click the database → "Connect" tab → copy the DATABASE_URL
```

### Step 4: Set Environment Variables

```
1. Click your app service (not the DB)
2. Go to "Variables" tab
3. Add each variable:

GEMINI_API_KEY = AIzaSy...
DATABASE_URL      = postgresql://... (from step 3)
SESSION_SECRET    = (generated 32-char string)
NODE_ENV          = production
```

### Step 5: Configure Build & Start

```
In Railway service settings:
  Build Command:  npm run build
  Start Command:  node dist/index.js
```

### Step 6: Run Database Migrations

```
1. Go to Railway project
2. Click your app service → "Shell"
3. Run: npm run db:migrate
   (or npm run db:push for development databases)
```

### Step 7: Deploy

```
1. Railway auto-deploys on every push to main branch
2. First deploy triggers automatically after setup
3. Monitor: "Deployments" tab for build logs
4. Your app URL: https://your-app-name.up.railway.app
```

---

## 5. Option B: Render

### Step 1: Create Account

Go to [render.com](https://render.com), sign up with GitHub.

### Step 2: Create PostgreSQL Database

```
1. New → "PostgreSQL"
2. Name: study-sensei-db
3. Region: choose closest to users
4. Plan: Free (for testing) or Starter ($7/mo for production)
5. Copy the "External Database URL"
```

### Step 3: Create Web Service

```
1. New → "Web Service"
2. Connect GitHub repo
3. Settings:
   Runtime:       Node
   Build Command: npm run build
   Start Command: node dist/index.js
   Plan:          Free (spins down after 15min) or Starter ($7/mo)
```

### Step 4: Environment Variables

```
In Web Service → "Environment":
GEMINI_API_KEY = AIzaSy...
DATABASE_URL      = postgresql://... (from step 2)
SESSION_SECRET    = (32-char random string)
NODE_ENV          = production
```

### Step 5: Deploy & Migrate

```bash
# After first deploy, run migrations via Render Shell:
npm run db:migrate
```

**Note:** Render's free tier spins down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds. Use Starter plan ($7/mo) for production use.

---

## 6. Option C: Replit

Replit is where the project was developed — simplest path if already set up there.

### Step 1: Add Secrets (Environment Variables)

```
1. In Replit, click the lock icon (Secrets) in the left sidebar
2. Add each secret:
   Key: GEMINI_API_KEY    Value: AIzaSy...
   Key: DATABASE_URL         Value: postgresql://...
   Key: SESSION_SECRET       Value: (32-char string)
   Key: NODE_ENV             Value: production
```

### Step 2: Configure Run Command

In `.replit`:

```toml
[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "npm run build && node dist/index.js"]
deploymentTarget = "cloudrun"
```

### Step 3: Set Up PostgreSQL

Replit doesn't have built-in PostgreSQL. Use [Neon](https://neon.tech) (free serverless PostgreSQL):

```
1. Go to neon.tech → create free account
2. Create project: "study-sensei"
3. Create database: "studysensei"
4. Copy the connection string
5. Add to Replit Secrets as DATABASE_URL
```

### Step 4: Deploy

```
1. Click "Deploy" button in Replit
2. Select "Cloud Run" deployment
3. Wait for build (~2 minutes)
4. Replit assigns a URL: https://study-sensei.your-username.repl.co
```

### Step 5: Run Migrations

```
1. Open Replit Shell
2. Run: npm run db:push
```

---

## 7. Database Setup in Production

### First-Time Setup

```bash
# On the production server shell (Railway/Render shell, or SSH):

# Option A: Push schema directly (simpler, development-style)
npm run db:push

# Option B: Generate and run migration files (production-style, auditable)
npm run db:generate
npm run db:migrate
```

### Checking the Database

```bash
# Open Drizzle Studio to inspect tables visually
npm run db:studio
# Opens at http://localhost:4983
```

### Running Migrations on Deploy

For Railway, add a migration step to the start command:

```json
{
  "scripts": {
    "start": "node -e \"require('./dist/db-migrate').migrate()\" && node dist/index.js"
  }
}
```

Or use a `postbuild` script:

```json
{
  "scripts": {
    "postbuild": "npm run db:migrate"
  }
}
```

---

## 8. First Deploy Checklist

Run through this list before considering a deploy complete.

### Environment

- [ ] `GEMINI_API_KEY` is set in the production environment
- [ ] `DATABASE_URL` points to the production database
- [ ] `SESSION_SECRET` is set (at least 32 random characters)
- [ ] `NODE_ENV=production` is set
- [ ] No `.env` file is committed to the repository

### Database

- [ ] Migrations have been run (`npm run db:migrate` or `npm run db:push`)
- [ ] All 5 tables exist: `users`, `tasks`, `chat_messages`, `quiz_results`, `study_sessions`
- [ ] Test user can be created via the `/api/auth/register` endpoint

### Application

- [ ] Build completes without errors (`npm run build`)
- [ ] Server starts without errors (`node dist/index.js`)
- [ ] Dashboard loads at the root URL
- [ ] Login and register pages work
- [ ] AI Tutor sends a real response (not a mock)
- [ ] Quiz generates real questions
- [ ] Task created in Planner persists after page refresh

### Security

- [ ] API key does not appear in any HTTP response
- [ ] Unauthenticated requests to `/api/tasks` return 401
- [ ] Session cookie has `Secure` and `HttpOnly` flags (check browser DevTools → Application → Cookies)
- [ ] HTTPS is active (green padlock in browser)

---

## 9. Updating the Application

### Deploying a New Version

```
1. Push changes to GitHub main branch
2. Railway/Render auto-deploys (2–3 minutes)
3. Monitor deployment logs for errors
4. If build fails: fix, push again
```

### Schema Changes

When you modify `shared/schema.ts`:

```bash
# Generate a new migration
npm run db:generate

# Review the generated SQL in drizzle/migrations/
# COMMIT the migration file to Git

# On next deploy, run:
npm run db:migrate
```

**Never** run `db:push` on a production database with existing data — it may drop columns. Always use `db:generate` + `db:migrate` for production.

---

## 10. Monitoring & Logs

### Viewing Logs

**Railway:**
```
Project → Service → Logs tab
Filter by: [Error] [Warn] [Info]
```

**Render:**
```
Dashboard → Service → Logs
```

**Replit:**
```
Console panel in the IDE
```

### Key Things to Monitor

| What to Watch | Why | Action |
|---|---|---|
| 503 errors on /api/chat | API Provider issues | Check Google Gemini status page |
| 429 errors spike | Rate limit being hit | May need to increase limits |
| DB connection errors | Database unreachable | Check DATABASE_URL, DB provider status |
| Memory usage > 512MB | Memory leak | Restart, investigate |
| Build failures | Code error | Check build logs, fix and redeploy |

### Health Check Endpoint (Add This)

```typescript
// server/routes.ts
router.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
});
```

Use this URL in uptime monitoring services (UptimeRobot, BetterStack free tier).

---

## 11. Rollback Procedure

### Railway

```
1. Go to Project → Service → Deployments
2. Find the last working deployment
3. Click the three-dot menu → "Redeploy"
4. Railway rolls back to that version in ~1 minute
```

### Render

```
1. Go to Service → Deploys tab
2. Find the last successful deploy
3. Click "Rollback to this deploy"
```

### Database Rollback

If a migration broke something:

```bash
# Find the previous migration
ls drizzle/migrations/

# Manually write a rollback SQL
# Example: if migration added a column you need to remove:
ALTER TABLE tasks DROP COLUMN IF EXISTS new_column;

# Apply directly via psql or Drizzle Studio
```

---

## 12. Troubleshooting

### "Cannot find module" on start

```bash
# Build is missing. Run:
npm run build
node dist/index.js
```

### "Invalid DATABASE_URL"

```bash
# Check the URL format:
# ✅ postgresql://user:password@hostname/database?sslmode=require
# ❌ postgres://... (missing ql)
# ❌ Missing ?sslmode=require for Neon

# Test connection:
npx tsx -e "const {neon} = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL); sql\`SELECT 1\`.then(console.log)"
```

### "SESSION_SECRET is required"

```bash
# The environment variable is not set.
# In Railway: Variables tab → add SESSION_SECRET
# In Replit: Secrets → add SESSION_SECRET
# Locally: add to .env file
```

### AI Tutor returns "AI service unavailable"

```bash
# 1. Check GEMINI_API_KEY is set correctly
echo $GEMINI_API_KEY  # Should show AIza...

# 2. Check Google API status
# Visit: https://status.cloud.google.com

# 3. Check rate limits in your Google AI Studio console
# Visit: https://aistudio.google.com
```

### "relation 'users' does not exist"

```bash
# Migrations haven't been run yet.
npm run db:push      # development
npm run db:migrate   # production
```

### Session not persisting after deploy

```bash
# 1. Ensure SESSION_SECRET is the same value as before the deploy
#    (Different secret = all existing sessions invalidated)

# 2. Check database has the 'session' table (created by connect-pg-simple)
#    Run: SELECT * FROM session LIMIT 1;

# 3. Verify cookie settings in browser DevTools:
#    Application → Cookies → should show httpOnly + secure flags
```

### Build succeeds but app shows blank page

```bash
# Check browser console for errors
# Usually: wrong base URL in vite.config.ts
# Check: the static.ts file serves dist/public correctly

# server/static.ts should have:
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
```
