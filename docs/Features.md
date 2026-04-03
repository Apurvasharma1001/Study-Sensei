# Features Specification
## Study Sensei — Complete Feature Breakdown

**Version:** 1.0.0  
**Status:** In Development

---

## Table of Contents

1. [Feature Map](#1-feature-map)
2. [F01 — Authentication](#f01--authentication)
3. [F02 — Dashboard](#f02--dashboard)
4. [F03 — Study Planner](#f03--study-planner)
5. [F04 — AI Tutor](#f04--ai-tutor)
6. [F05 — Quiz Generator](#f05--quiz-generator)
7. [F06 — Analytics](#f06--analytics)
8. [F07 — PDF Syllabus Upload](#f07--pdf-syllabus-upload)
9. [F08 — AI Study Plan](#f08--ai-study-plan)
10. [F09 — Pomodoro Timer](#f09--pomodoro-timer)
11. [F10 — Settings](#f10--settings)

---

## 1. Feature Map

| ID | Feature | Priority | Phase | AI? | Status |
|---|---|---|---|---|---|
| F01 | Authentication | 🔴 Critical | 1 | No | To Build |
| F02 | Dashboard | 🔴 Critical | 1 | Partial | Built (mock) |
| F03 | Study Planner | 🔴 Critical | 1 | No | Built (mock) |
| F04 | AI Tutor | 🔴 Critical | 1 | Yes | Built (mock AI) |
| F05 | Quiz Generator | 🔴 Critical | 1 | Yes | Built (mock AI) |
| F06 | Analytics | 🟡 High | 1 | No | Built (mock) |
| F07 | PDF Upload | 🟡 High | 2 | Yes | To Build |
| F08 | AI Study Plan | 🟡 High | 2 | Yes | To Build |
| F09 | Pomodoro Timer | 🟢 Medium | 2 | No | To Build |
| F10 | Settings | 🟢 Medium | 3 | No | To Build |

---

## F01 — Authentication

### Description
Secure user registration and login system with persistent sessions.

### Pages
- `/login` — Email + password form
- `/register` — Name + email + password form
- Redirect to `/` after successful auth

### Acceptance Criteria

- [ ] User can register with name, email, password
- [ ] Duplicate email shows an error message
- [ ] Password must be at least 8 characters
- [ ] Successful login redirects to Dashboard
- [ ] Invalid credentials show error without revealing which field is wrong
- [ ] Session persists across browser refresh (7-day cookie)
- [ ] Logout clears session and redirects to `/login`
- [ ] All `/app/*` routes redirect to `/login` if unauthenticated

### UI Components
- `<Input>` for email and password
- `<Button>` for submit
- Error `<Alert>` for validation messages
- Link between login and register pages

### API Endpoints Used
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

---

## F02 — Dashboard

### Description
The landing page after login. Shows a personalized overview of the student's study status, upcoming tasks, study activity chart, and an AI-generated daily tip.

### Sections

#### 2a. Hero Banner
- Personalized greeting: "Good morning, {name}!"
- Current streak badge
- AI insight: "You should review X today" (based on weakest quiz subject)
- CTA buttons: "Ask AI Tutor" and "Quick Quiz"

#### 2b. Stats Row (4 cards)
- Study Hours This Week (from studySessions table)
- Tasks Done / Total (from tasks table)
- Average Quiz Score % (from quizResults table)
- Current Streak in days (computed from studySessions)

#### 2c. Study Activity Bar Chart
- X-axis: Days of current week (Mon–Sun)
- Y-axis: Hours studied
- Data from: studySessions table, grouped by date

#### 2d. Today's Tasks
- Shows next 4 incomplete tasks sorted by due date
- Each shows: title, subject, time estimate, due date
- "View Planner" link

#### 2e. Exam Readiness Card
- Overall % (weighted avg of quiz scores + tasks done)
- Per-subject mini progress bars (Chemistry, Math, Physics)
- Sourced from quizResults and SUBJECT_DATA

#### 2f. AI Daily Tip Card
- Generated once per day by the AI Service
- Cached in DB as `users.dailyTip` + `users.tipGeneratedAt`
- Only regenerated if tip is > 24 hours old

### Acceptance Criteria

- [ ] All stats show real data from the database
- [ ] Dashboard loads in under 2 seconds
- [ ] Streak is calculated correctly (breaks if no session logged today or yesterday)
- [ ] Clicking "Ask AI Tutor" navigates to `/tutor`
- [ ] Tasks list shows only tasks belonging to the logged-in user

---

## F03 — Study Planner

### Description
A three-column Kanban board for managing study tasks. Tasks move between To Do, In Progress, and Completed.

### Task Properties

| Field | Type | Required |
|---|---|---|
| title | string | Yes |
| subject | enum (Chemistry, Math, Physics, History, English, Other) | Yes |
| status | todo \| in-progress \| completed | Yes |
| estimatedMins | number | No (default: 30) |
| dueDate | string (YYYY-MM-DD) | No |

### Interactions

- **Add Task:** Click "+ Add Task" → inline form appears → save creates task in DB
- **Move Task:** Arrow buttons (← →) move task to previous/next column, updates DB immediately
- **Delete Task:** Trash icon on card → confirm dialog → delete from DB
- **Filter by Subject:** Dropdown at top filters all columns simultaneously

### Kanban Columns

| Column | Color | Meaning |
|---|---|---|
| To Do | Gray | Not yet started |
| In Progress | Amber | Currently working on |
| Completed | Green | Done, marked with strikethrough |

### Acceptance Criteria

- [ ] Tasks persist after page refresh
- [ ] Move action updates status immediately (optimistic update)
- [ ] Add task form validates: title required, subject required
- [ ] Completed tasks show strikethrough styling
- [ ] Filter shows "No tasks" state when column is empty after filter

### API Endpoints Used
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

---

## F04 — AI Tutor

### Description
A multi-turn chat interface where students can ask questions about any subject. The AI uses the student's uploaded syllabus as context and maintains conversation history across sessions.

### Chat Interface

- Messages appear in bubbles (user: right-aligned amber, AI: left-aligned dark)
- AI avatar shows a robot icon
- Timestamps shown on hover
- Scroll to bottom automatically on new messages
- Typing indicator (animated dots) while AI is generating

### Quick Prompt Chips

Clickable chips that pre-fill the input:

| Chip | Action |
|---|---|
| `/explain` | "Explain this concept simply" |
| `/quiz` | "Give me 3 practice questions on this" |
| `/summarise` | "Summarise the key points" |
| `/formula` | "What are the key formulas I need?" |

### Syllabus Context

- If user has uploaded a syllabus PDF, its extracted text (max 4000 chars) is included in the AI system prompt
- A banner shows "Using your syllabus: {fileName}" at the top of the chat
- If no syllabus, banner shows "Upload your syllabus for personalised answers →"

### Conversation Management

- History persists across page reloads (stored in chatMessages table)
- "Clear Chat" button → confirmation dialog → deletes history → fresh start
- Max history sent to API: last 20 messages (to stay within token limits)

### Acceptance Criteria

- [ ] Messages appear correctly aligned by role
- [ ] Enter key sends message (Shift+Enter for new line)
- [ ] AI responses render with proper line breaks and numbered lists
- [ ] Chat history is restored when user revisits the page
- [ ] Typing indicator appears while waiting for AI response
- [ ] Empty message cannot be submitted
- [ ] Rate limit error shows a helpful message (not a crash)

### API Endpoints Used
- `POST /api/chat` — send message, get reply
- `GET /api/chat/history` — restore conversation
- `DELETE /api/chat/history` — clear conversation

---

## F05 — Quiz Generator

### Description
Students type any topic and instantly receive 5 AI-generated multiple-choice questions. They answer one at a time, then see their score with explanations for each answer.

### States

```
idle → [user enters topic] → generating → active → done
                                  ↑                   |
                               error                   └──→ idle (new quiz)
                                  └──→ idle (retry)         or active (retry)
```

### Quiz Flow

1. **Idle:** Text input for topic + suggested topic chips + "Generate" button
2. **Generating:** Loading animation while AI processes (< 8 seconds)
3. **Active:** One question at a time with 4 option buttons (A/B/C/D)
4. **Done:** Score ring, "Excellent/Good/Keep Studying" message, review answers, retry or new quiz

### Question Card

- Question text in serif font
- 4 options as full-width buttons (A. B. C. D.)
- On click: correct = green highlight, wrong = red highlight + show correct
- Progress bar at top shows question X/5
- No ability to go back to previous questions

### Results Screen

- Score ring with percentage (green ≥80%, amber ≥60%, red <60%)
- Score count (e.g., "4/5")
- "Review Answers" toggle — shows all 5 questions with correct answer and explanation
- Buttons: "New Quiz" (resets to idle) and "Retry" (same questions, reset answers)

### Score Persistence

- On quiz completion → `POST /api/quiz/result` saves to quizResults table
- Past scores shown as badges above the generate form (last 4 quizzes)
- Analytics page radar chart updates from these stored scores

### Acceptance Criteria

- [ ] Quiz generates within 8 seconds for any topic
- [ ] Invalid AI JSON response triggers retry (up to 2 attempts) then shows error
- [ ] Answers cannot be changed after submission
- [ ] Score is saved to DB after completion
- [ ] Retry uses the same questions without re-calling the API
- [ ] "New Quiz" shows suggested topic chips again

### API Endpoints Used
- `POST /api/quiz/generate`
- `POST /api/quiz/result`
- `GET /api/quiz/history`

---

## F06 — Analytics

### Description
A data dashboard showing detailed learning insights: subject mastery, time invested, study consistency heatmap, and per-subject progress.

### Sections

#### 6a. Summary Stats Row
- Tasks Completed (count)
- Tasks In Progress (count)
- Average Quiz Score % (from quizResults)
- Current Streak (from studySessions)

#### 6b. Subject Mastery Radar Chart
- 5 axes: Chemistry, Math, Physics, History, English
- Values derived from average quiz scores per subject
- Falls back to default data if no quizzes taken

#### 6c. Hours per Subject Bar Chart
- Horizontal bar chart
- Data from studySessions grouped by subject
- Each bar has a different color per subject

#### 6d. Study Consistency Heatmap
- 91 cells (13 weeks × 7 days)
- Intensity based on minutes studied that day (from studySessions)
- Hover shows: "Date: X.Xh studied"
- Legend: Less → More (5 shades of green)

#### 6e. Subject Detail Cards
- One row per subject
- Shows mastery %, status badge (Mastered / Developing / Needs Work), progress bar

### Acceptance Criteria

- [ ] All charts reflect real data from the database
- [ ] Heatmap is deterministic (not random) — same data = same heatmap
- [ ] Radar updates after user completes a quiz in a subject
- [ ] Charts render correctly at 1280px and 768px viewport widths
- [ ] "No data" states shown gracefully when user has no history

### API Endpoints Used
- `GET /api/analytics`

---

## F07 — PDF Syllabus Upload

### Description
Students upload a PDF of their course syllabus. The text is extracted and stored. The AI tutor then uses this text as context for all future conversations.

### Upload Flow

1. Button: "Upload Syllabus" in Tutor page header
2. File picker opens → user selects PDF
3. Progress indicator while uploading and parsing
4. Success: banner shows "Using: {filename}" and tutor gains context
5. Failure: error message with retry option

### Constraints

- PDF only (no Word, images, etc.)
- Max file size: 10 MB
- Max extracted text sent to AI: 4000 characters (first 4000 chars of extracted text)
- Only one syllabus per user (upload replaces previous)

### Acceptance Criteria

- [ ] Only `.pdf` files accepted (MIME type validation)
- [ ] Files > 10 MB rejected with clear error message
- [ ] Uploaded file name displayed in tutor banner
- [ ] AI tutor uses syllabus context in next message after upload
- [ ] Uploading new PDF replaces old syllabus text in DB

### API Endpoints Used
- `POST /api/upload/syllabus`

---

## F08 — AI Study Plan

### Description
A one-click AI-generated 7-day study plan based on the student's weak subjects and upcoming exam dates.

### Trigger
- Button on Dashboard: "Generate My Study Plan"
- Opens a modal with the generated plan

### Inputs (sent to AI Service)
- Weak subjects (from quiz history: subjects with avg score < 70%)
- Upcoming task due dates (from tasks table, next 7 days)
- Current date

### Output
- Day-by-day schedule rendered in a modal
- Each day shows: subjects to focus on, suggested topics, time allocation
- Option to "Copy to Planner" — creates tasks in the Planner from the plan

### Acceptance Criteria

- [ ] Plan generates in < 10 seconds
- [ ] If no weak subjects and no due tasks, show "You're on track!" message
- [ ] Plan renders in readable format (not raw JSON)
- [ ] "Copy to Planner" creates real tasks in DB

### API Endpoints Used
- `POST /api/plan/generate`

---

## F09 — Pomodoro Timer

### Description
A 25/5 minute focus timer embedded in the Planner page. Completing a Pomodoro session automatically logs study time and updates the streak.

### Timer States

- **Idle:** Start button visible, subject selector, task selector
- **Focus:** 25:00 counting down, subject shown, pause/stop buttons
- **Break:** 5:00 counting down, "Take a break!" message
- **Done:** Session saved, congratulations message, option to start another

### Session Logging

On completing a 25-minute focus session:
- Insert into `studySessions` table: `{ userId, subject, durationMins: 25, sessionDate: today }`
- Streak recalculated
- Dashboard stats update on next load

### Acceptance Criteria

- [ ] Timer counts down accurately (tested over 60 seconds)
- [ ] Page navigation during a timer shows a warning ("Timer is running")
- [ ] Completed session saved to DB
- [ ] Partial sessions (stopped early) are not logged
- [ ] Browser tab title shows remaining time when timer is running (e.g., "23:45 — Study Sensei")

---

## F10 — Settings

### Description
User preferences and account management page.

### Sections

- **Profile:** Change display name, avatar initials
- **Syllabus:** View current syllabus name, upload new, delete
- **Notifications:** Toggle email reminders (v1.1)
- **Appearance:** Light / Dark theme toggle (stored in localStorage)
- **Data:** Clear quiz history, clear chat history, delete account

### Acceptance Criteria

- [ ] Name change persists after page refresh
- [ ] Theme toggle works immediately without full page reload
- [ ] "Delete Account" requires typing "DELETE" to confirm
- [ ] Deleted account removes all associated data (tasks, quizzes, sessions, messages)

### API Endpoints Used
- `GET /api/user/profile`
- `PATCH /api/user/profile`
- `DELETE /api/user/account`
