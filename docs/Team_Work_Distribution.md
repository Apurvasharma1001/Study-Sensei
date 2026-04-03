# 🤝 Study Sensei: Team Work Distribution

Based on the architecture and features of **Study Sensei**, here are two recommended ways to distribute the workload among your 4 team members. You can choose the model that best fits your team's skills and learning goals. 

---

## Model 1: Role-Based Distribution (Horizontal)
*Best if your team members want to specialize in specific technologies (e.g., one person masters React, another masters Databases).*

### 🎨 Member 1: Frontend Lead (UI/UX & Routing)
**Primary Tools**: React, Tailwind CSS, shadcn/ui, Wouter
* **Responsibilities**:
  * Setting up the structural layouts and responsive designs.
  * Building out the visual components (Buttons, Modals, Forms) using `shadcn/ui`.
  * Implementing the drag-and-drop Kanban interface for the Study Planner.
  * Ensuring the application is accessible and the dark/light themes work flawlessly.
* **Key Files**: `client/src/components/*`, `client/src/pages/Planner.tsx`

### ⚙️ Member 2: Backend & Database Engineer
**Primary Tools**: Node.js, Express, PostgreSQL, Drizzle ORM
* **Responsibilities**:
  * Designing the database schemas in `shared/schema.ts` (Users, Tasks, Quizzes, Chats).
  * Implementing all standard CRUD REST APIs (Create, Read, Update, Delete for tasks).
  * Managing user authentication, `express-session`, and `bcrypt` password hashing.
  * Ensuring database queries are protected against IDOR (checking `userId`).
* **Key Files**: `server/index.ts`, `server/routes.ts`, `shared/schema.ts`, `drizzle.config.ts`

### 🤖 Member 3: AI Engineer & Integrations
**Primary Tools**: HuggingFace/Gemini API, Prompts, Node.js, `pdf-parse`
* **Responsibilities**:
  * Managing `ai.service.ts` and ensuring prompts return correctly structured JSON.
  * Fine-tuning the multi-turn conversational Tutor to use syllabus context.
  * Setting up PDF upload middleware (`multer`) and extracting text using `pdf-parse`.
  * Managing rate-limiting fallbacks so the app doesn't crash when API quotas run out.
* **Key Files**: `server/services/ai.service.ts`, `server/controllers/chatController.ts`, `server/services/pdf.service.ts`

### 📊 Member 4: Data Visualization & Full-stack Glue
**Primary Tools**: TanStack Query, Recharts, Express (Aggregations)
* **Responsibilities**:
  * Managing data synchronization using `TanStack Query` (React Query) between the frontend and backend.
  * Building complex SQL/Drizzle queries to calculate "Readiness", "Heatmaps", and "Study Hours".
  * Implementing the radar charts and activity graphs using `Recharts` perfectly.
  * Assisting with end-to-end testing and bug fixing across the stack.
* **Key Files**: `client/src/pages/Analytics.tsx`, `client/src/hooks/*`, `server/services/analytics.service.ts`

---

## Model 2: Feature-Based Distribution (Vertical)
*Best if every member wants experience doing "Full-Stack" work (writing both DB queries AND React components).*

### 👤 Member 1: Authentication & Dashboard
* **Backend**: Setup user registration, login APIs, and session persistence. Setup the base Express framework.
* **Frontend**: Build the Authentication UI (Login/Signup pages). Build the main Dashboard overview page.
* **Goal**: Get the app securely shell running so everyone else can log in.

### 📅 Member 2: Study Planner & Tasks
* **Backend**: Build the API endpoints for adding, moving, and deleting tasks.
* **Frontend**: Build the interactive Kanban board. Hook it up to `React Query` so tasks mutate seamlessly without page reloads.
* **Goal**: Deliver a fully functioning, DB-backed task management system.

### 🎓 Member 3: AI Tutor & Syllabus Uploads
* **Backend**: Implement the PDF upload endpoint, parse the text, and link the HuggingFace API to the chat handler.
* **Frontend**: Build the chat UI interface (message bubbles, typing indicators, auto-scroll) and the PDF dropzone.
* **Goal**: Deliver a smart, contextual chatbot that remembers conversation history.

### 📝 Member 4: Quizzes & Analytics
* **Backend**: Build the AI prompt to generate 5-question JSON quizzes. Build the analytics aggregation logic to calculate scores and heatmaps.
* **Frontend**: Build the interactive Quiz taking UI (score calculation, animations). Implement the `Recharts` dashboards to visualize the data.
* **Goal**: Deliver the assessment and progression tracking features of the app.

---

### 💡 Project Management Tips for your Team:
1. **Use Git Branches**: Never push directly to `main`. Create branches like `feature/ai-tutor` or `fix/login-bug`.
2. **Review Code**: Have at least one other team member approve a Pull Request before merging it.
3. **Share Environment Variables**: Make sure everyone has the correct `.env` variables and the same database URL format, but DO NOT commit the `.env` file to Github.
4. **Communicate Schema Changes**: Because `shared/schema.ts` affects everyone, any change to the database tables should be heavily communicated to the entire team.
