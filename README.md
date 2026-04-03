# Study Sensei — Smart Study Companion

> AI-Powered · Analytics-Driven  
> Version 1.0

Study Sensei is a full-stack learning companion that combines traditional study management tools (like task tracking and planners) with AI-powered features. Leveraging a provider-agnostic AI setup (defaulting to HuggingFace Mistral, but compatible with Google Gemini, Anthropic, Groq, etc.), Study Sensei provides students with an interactive AI tutor, automatic quiz generation, dynamic study plans, and comprehensive performance analytics.

---

## 🚀 Features

* **Smart Dashboard**: Instantly view your study streak, current readiness score, total study hours, and task completion metrics.
* **AI Tutor**: A multi-turn conversational AI that helps you overcome difficult subjects and explains concepts in simple terms.
* **Quiz Generator**: Generate contextual 5-question multiple-choice quizzes on any topic instantly.
* **Performance Analytics**: Visual radar charts, weekly heatmaps, and subject mastery tracking using your real DB-backed data.
* **Study Planner**: A drag-and-drop Kanban board to organize your tasks into To Do, In Progress, and Completed statuses.
* **Document Context**: Upload your syllabus for the AI to base its tutoring advice on.

---

## 🛠️ Tech Stack in Detail

**Frontend Stack**
* **React 18 & TypeScript**: Industry-standard, type-safe development using Vite (v5.x) for fast HMR and optimized builds.
* **Wouter**: Lightweight `< 2KB` client-side router for clean, fast navigation.
* **TanStack Query (React Query)**: Caching and Server State Management. Automatically refetches analytics and data when you mutate tasks.
* **Tailwind CSS & shadcn/ui**: Unstyled accessible components built on utility-first CSS.
* **Recharts**: Responsive complex radar and activity charts representing learning hours and mastery.

**Backend Stack & Infrastructure**
* **Node.js (v20+) & Express.js (v4.x)**: Efficient asynchronous event-loop architecture.
* **PostgreSQL & Drizzle ORM (v0.30+)**: Relational mapping using type-safe schemas (`shared/schema.ts`) that keep end-to-end typing perfectly in sync. Native support for Neon Serverless.
* **Multer & pdf-parse**: In-memory syllabus PDF decomposition limiting to 10MB sizes.
* **Zod**: Runtime schema validation verifying inputs on both Frontend and Backend arrays before DB or AI invocation.

**Authentication & Session Management**
* **express-session & connect-pg-simple**: Stateless backend with persistent PostgreSQL-backed sessions instead of complex JWTs. Session cookies are HTTP-only (`httpOnly: true`) preventing Javascript access, and secure in production (`secure: true`). Sessions automatically expire after 7 days.
* **bcrypt**: Hashing passwords using a cost factor of 12 for strong storage encryption without significantly slowing logins.

---

## 🧠 AI Integration

**Agnostic Setup**: Study Sensei abstracts its AI functionality to be completely provider-agnostic. While originally designed for Google's `gemini-2.0-flash`, the current default implementation routes through the **HuggingFace API** using `mistralai/Mistral-7B-Instruct-v0.3`.
* **Extensible**: The internal `ai.service.ts` configuration accepts OpenAI-compatible fallback providers (Groq, Together, OpenRouter) as well as direct endpoints for Anthropic and Cohere.
* **Rate Limited Constraints**: API access routes are rate-limited via `express-rate-limit` (max 20 per minute window for AI features; 10 per 15 minutes for Auth actions) to mitigate DDOS attempts and quota abuse. 
* **Fallback Mechanisms**: In cases of complete rate-limiting (HTTP 429), the application ships heavily defined resilient fallback logic—such as offline mock quizzes and default error responses without crashing the user flow.

---

## 🔒 Security Posture

* **Keys are Shielded**: All AI API tokens are extracted via `process.env` safely on the server and are explicitly disallowed from ever leaking to UI JSON bundles or console logs.
* **Mandatory Object Rights / No IDOR**: Every database transaction (`SELECT`, `DELETE`, etc.) inherently enforces strict verification appending `userId` against object ownership, nullifying Broken Object Level Authorization attempts.
* **Sanitization Layer**: Input strings strictly respect `Zod` coercion preventing prototype injection or raw database bypass. `Drizzle ORM` handles all parameterization defending against SQL Injection vulnerabilities.
* **Strict Transport Security**: Pre-configured for strict HTTPS deployments matching CORS to the frontend domain strictly, disallowing unapproved cross-origin access.
* **File Upload Safety**: Syllabus files are processed entirely in memory, truncated securely, and are discarded without writing to disk.

---

## 📋 Prerequisites

To run Study Sensei locally, ensure you have the following installed:
* **Node.js**: `v20.0.0` or higher
* **npm**: `v10.0.0` or higher
* A **PostgreSQL** database (Local or Cloud like Neon/Supabase)
* An active **API Key** for your preferred AI endpoint (e.g., HuggingFace, Gemini, Anthropic)

---

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Study-Sensei/Frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Duplicate `.env.example` to create a `.env` file in the `Frontend/` root folder:
   ```bash
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   SESSION_SECRET=a_long_random_string_here
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   AI_PROVIDER=huggingface
   ```

4. **Initialize Database**
   Push the Drizzle ORM schemas directly to your PostgreSQL database:
   ```bash
   npx drizzle-kit push
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   *The application will launch on `http://localhost:5000` executing both the Vite frontend and Express backend concurrently.*

---

## 🗂️ Project Structure

```text
Study-Sensei/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # shadcn ui components & layouts
│   │   ├── hooks/          # React Query hooks (useTasks, useAnalytics)
│   │   ├── pages/          # Dashboard, Planner, Tutor, Quiz, Analytics
│   │   └── lib/            # api wrapper & utility functions
│   └── index.html
├── server/                 # Express Backend (Node)
│   ├── controllers/        # Business logic handlers
│   ├── routes.ts           # All 22 active Express API routes
│   ├── services/           # Analytics logic, PDF parser, and Agnostic AI Service
│   └── index.ts            # Server entrypoint & middleware
├── shared/                 # Fullstack Shared Modules
│   └── schema.ts           # Drizzle Postgres tables & Zod schemas
└── drizzle.config.ts       # Database access config
```

---

## 📝 License
This project was developed as a modern portfolio piece highlighting advanced integration of LLM endpoints tied directly to live frontend user data architectures. Do not use API keys belonging to others.
