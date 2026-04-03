# UI/UX Design Specification
## Study Sensei — Interface & Experience Guide

**Version:** 1.0.0  
**Date:** March 2026

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Component Library](#5-component-library)
6. [Page Layouts](#6-page-layouts)
7. [Interaction Patterns](#7-interaction-patterns)
8. [Loading & Error States](#8-loading--error-states)
9. [Responsive Breakpoints](#9-responsive-breakpoints)
10. [Accessibility](#10-accessibility)
11. [Animation Guidelines](#11-animation-guidelines)
12. [Dark Theme Tokens](#12-dark-theme-tokens)

---

## 1. Design Philosophy

### Aesthetic Direction: "Dark Academic"

Study Sensei uses a **dark academic** aesthetic — the visual language of late-night study sessions, candlelit libraries, and scholarly focus. The interface is:

- **Dark by default** — reduces eye strain during long study sessions
- **Warm accents** — amber/gold for primary actions, creating a sense of illumination
- **Editorial typography** — Playfair Display serif for headings evokes academic authority
- **Information-dense but breathable** — plenty of data without feeling cluttered
- **Focused** — no distracting decorations; every element earns its place

### Core Design Principles

**Clarity First** — A student in exam panic mode should understand every interface action without reading instructions.

**Reduce Friction** — Critical paths (start studying, ask AI, take quiz) should be reachable in ≤ 2 clicks from anywhere.

**Trustworthy** — The design should communicate competence. This is a tool students rely on before exams — it cannot look unfinished or toy-like.

**Responsive Feedback** — Every action (click, hover, load, error) has a visual response. The UI is never silent.

---

## 2. Color System

### Base Palette

```css
/* Background layers (dark, layered) */
--bg-base:       #0b0b15;   /* Page background */
--bg-surface:    #0d0d1a;   /* Sidebar */
--bg-card:       #13131f;   /* Cards */
--bg-elevated:   #1a1a2c;   /* Modals, message bubbles, elevated cards */
--bg-input:      rgba(255, 255, 255, 0.05); /* Inputs */

/* Primary — Amber/Gold (AI, action, attention) */
--amber-400:     #f59e0b;
--amber-500:     #d97706;
--amber-muted:   rgba(245, 158, 11, 0.12);
--amber-border:  rgba(245, 158, 11, 0.22);

/* Success — Emerald */
--green-400:     #10b981;
--green-muted:   rgba(16, 185, 129, 0.12);

/* Info — Indigo */
--indigo-400:    #6366f1;
--indigo-light:  #818cf8;
--indigo-muted:  rgba(99, 102, 241, 0.12);

/* Danger */
--red-400:       #ef4444;
--red-muted:     rgba(239, 68, 68, 0.10);

/* Neutrals */
--gray-100:      #f1f1f9;   /* Primary text */
--gray-200:      #e2e8f5;   /* Secondary text */
--gray-400:      #9ca3af;   /* Muted text */
--gray-600:      #6b7280;   /* Hint text */
--gray-700:      #4b5563;   /* Placeholders */
--gray-800:      #374151;   /* Disabled elements */

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.06);
--border-normal: rgba(255, 255, 255, 0.09);
--border-strong: rgba(255, 255, 255, 0.15);
```

### Semantic Color Usage

| Context | Color | Usage |
|---|---|---|
| Primary action | `--amber-400` | Buttons, active nav, progress fills |
| Success / complete | `--green-400` | Completed tasks, correct answers, badges |
| Info / neutral | `--indigo-light` | Stats, charts, info badges |
| Danger / error | `--red-400` | Errors, wrong answers, destructive actions |
| AI-related UI | `--amber-400` | Chat bubbles user sends, AI avatar accent |
| Passive text | `--gray-600` | Timestamps, labels, metadata |

---

## 3. Typography

### Font Stack

```css
/* Headings — editorial authority */
--font-heading: 'Playfair Display', Georgia, serif;

/* Body — clean readability */
--font-body: 'Plus Jakarta Sans', -apple-system, sans-serif;

/* Code / monospace (quiz labels, stats) */
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```

### Type Scale

| Token | Size | Weight | Font | Usage |
|---|---|---|---|---|
| `text-display` | 52px | 800 | Heading | Hero numbers (exam readiness %) |
| `text-h1` | 27–32px | 700 | Heading | Page titles |
| `text-h2` | 18–21px | 700 | Heading | Section titles, card headings |
| `text-h3` | 15–16px | 700 | Heading | Card subtitles |
| `text-body-lg` | 15px | 400 | Body | Primary content text |
| `text-body` | 13.5px | 400 | Body | Default body text |
| `text-body-sm` | 12–13px | 400 | Body | Secondary metadata |
| `text-label` | 10–11px | 600–700 | Body | Badges, uppercase labels |
| `text-mono` | 13–15px | 500 | Mono | Score display, option labels (A. B. C.) |

### Line Heights

- Headings: `1.2–1.3`
- Body text in cards: `1.55`
- Chat messages: `1.65`
- Labels and badges: `1`

---

## 4. Spacing & Layout

### Spacing Scale

```css
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
```

### Border Radius

```css
--radius-sm:   8px    /* Badges, chips, small inputs */
--radius-md:   10px   /* Inputs, buttons, small cards */
--radius-lg:   16px   /* Cards */
--radius-xl:   20px   /* Hero banner, large modals */
--radius-full: 9999px /* Pills, avatar circles */
```

### App Shell

```
┌─────────────────────────────────────┐
│  Sidebar (224px fixed)  │  Main     │
│                         │  Content  │
│  Logo                   │  Area     │
│  Nav items              │  (flex-1) │
│                         │  padding: │
│                         │  32px 40px│
│  User profile (bottom)  │           │
└─────────────────────────────────────┘
```

### Main Content Max Width

- Cards in a grid: no max width (fill available)
- Chat: `max-width: 900px; margin: 0 auto`
- Quiz single column: `max-width: 620px`
- Form modals: `max-width: 560px`

---

## 5. Component Library

### Buttons

```
Primary (amber):    bg #f59e0b, text #0b0b15, font-weight 600
Secondary:          bg rgba(255,255,255,0.07), text #e2e8f5, border rgba(255,255,255,0.1)
Ghost:              bg transparent, text #6b7280, border rgba(255,255,255,0.08)
Danger:             bg rgba(239,68,68,0.12), text #ef4444, border rgba(239,68,68,0.2)

Sizes:
  sm:   padding 5px 11px, font 12px, radius 8px
  md:   padding 9px 16px, font 13px, radius 10px  (default)
  lg:   padding 12px 22px, font 14px, radius 12px

States:
  hover:    brightness +10%, translateY(-1px)
  active:   brightness -5%, translateY(0)
  disabled: opacity 0.45, cursor not-allowed, no transform
  loading:  spinner replaces text, disabled state
```

### Cards

```
Default card:
  background: #13131f
  border: 1px solid rgba(255,255,255,0.07)
  border-radius: 16px
  padding: 20px

Elevated card (modals, active states):
  background: #1a1a2c

Hero/Accent card:
  background: linear-gradient(...) — see Dashboard hero
  border: 1px solid rgba(245,158,11,0.14)
```

### Badges / Pills

```
Amber:  bg rgba(245,158,11,0.14)  text #f59e0b  border rgba(245,158,11,0.22)
Green:  bg rgba(16,185,129,0.14)  text #10b981  border rgba(16,185,129,0.22)
Red:    bg rgba(239,68,68,0.11)   text #ef4444  border rgba(239,68,68,0.20)
Indigo: bg rgba(99,102,241,0.14)  text #818cf8  border rgba(99,102,241,0.22)
Gray:   bg rgba(255,255,255,0.07) text #9ca3af  border rgba(255,255,255,0.10)

Size: padding 3px 9px, font-size 11px, font-weight 600, border-radius 20px
```

### Inputs & Selects

```
background:   rgba(255,255,255,0.05)
border:       1px solid rgba(255,255,255,0.10)
border-radius: 10px
padding:      9px 13px
font-size:    13px
color:        #e2e8f5
placeholder:  #4b5563

Focus state:  border-color rgba(245,158,11,0.38)
Error state:  border-color rgba(239,68,68,0.50)
```

### Progress Bars

```
Track:    height 4px, background rgba(255,255,255,0.09), border-radius 2px
Fill:     border-radius 2px, color varies by context
  Primary:  #f59e0b (amber)
  Success:  #10b981 (green)
  Danger:   #ef4444 (red)
  Gradient: linear-gradient(90deg, colorA, colorB)
```

### Stat Cards (Dashboard)

```
background: #13131f
border: 1px solid rgba(255,255,255,0.07)
border-radius: 16px
padding: 18px 20px
display: flex; align-items: center; gap: 14px

Icon container: 46px × 46px, border-radius 13px, colored muted bg
Value: Playfair Display, 24px, weight 700, #f1f1f9
Label: 11.5px, #6b7280, weight 500

Hover: border-color rgba(245,158,11,0.28)
```

---

## 6. Page Layouts

### Dashboard Grid

```
┌─────────────────────────────────────────────────┐
│  Hero Banner (full width, gradient bg)           │
└─────────────────────────────────────────────────┘
┌──────────┬──────────┬──────────┬────────────────┐
│ Stat 1   │ Stat 2   │ Stat 3   │ Stat 4         │
└──────────┴──────────┴──────────┴────────────────┘
┌──────────────────────────┬──────────────────────┐
│ Study Activity Chart      │ Exam Readiness       │
│ Today's Tasks             │ AI Daily Tip         │
│                           │ Quick Actions        │
└──────────────────────────┴──────────────────────┘

Grid: `grid-template-columns: 2fr 1fr`
```

### Planner Layout

```
┌─────────────────────────────────────────────────┐
│ Header: Title, Subject Filter, "+ Add Task"      │
└─────────────────────────────────────────────────┘
┌──────────────┬──────────────┬───────────────────┐
│  To Do       │  In Progress │  Completed        │
│  (gray)      │  (amber)     │  (green)          │
│  ─────────   │  ─────────   │  ─────────        │
│  TaskCard    │  TaskCard    │  TaskCard         │
│  TaskCard    │              │  (strikethrough)  │
│  TaskCard    │              │                   │
│  + Add new   │              │                   │
└──────────────┴──────────────┴───────────────────┘

Grid: `grid-template-columns: repeat(3, 1fr)`
Column height: `calc(100vh - 180px)`, overflow-y: auto
```

### AI Tutor Layout

```
┌─────────────────────────────────────────────────┐
│ Header: "AI Tutor" title + syllabus banner       │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│                                                  │
│  Chat messages area (flex-1, overflow-y: auto)   │
│                                                  │
│  🤖 AI bubble (left-aligned, dark card)          │
│                     User bubble (right, amber) 👤│
│                                                  │
├─────────────────────────────────────────────────┤
│ Quick chips: [/explain] [/quiz] [/summarise]     │
├─────────────────────────────────────────────────┤
│ [textarea input                       ] [Send →] │
└─────────────────────────────────────────────────┘

Outer card: no padding, overflow hidden
Height: calc(100vh - 148px)
```

### Quiz Layout

```
Idle state:           Single card, max-width 560px, centered
Generating state:     Single card with loading animation
Active (question):    Max-width 620px, question card + options
Done state:           Score ring + review section, max-width 560px
```

### Analytics Grid

```
┌──────────┬──────────┬──────────┬────────────────┐
│ Stat 1   │ Stat 2   │ Stat 3   │ Stat 4         │
└──────────┴──────────┴──────────┴────────────────┘
┌──────────────────────┬──────────────────────────┐
│ Subject Mastery       │ Hours per Subject        │
│ (Radar chart)         │ (Horizontal bar)         │
└──────────────────────┴──────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Study Consistency Heatmap (91 cells)             │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Subject Detail Cards (5 rows, progress bars)     │
└─────────────────────────────────────────────────┘
```

---

## 7. Interaction Patterns

### Hover States

All interactive elements have hover states:

- **Buttons:** `translateY(-1px)` + brightness increase
- **Cards:** `border-color` shift toward amber (subtle)
- **Nav items:** Background fill + text color change
- **Task cards:** `translateY(-1px)` + amber border hint
- **Heatmap cells:** `scale(1.3)` + tooltip

### Click / Active States

- Buttons: `translateY(0)`, slight brightness decrease, scale(0.98)
- Checkbox: Animate fill from transparent to green with check mark
- Quiz options: Color transition (green/red) with 0.18s transition

### Focus States

- All focusable elements: `outline: 2px solid rgba(245,158,11,0.5); outline-offset: 2px`
- Inputs: border-color change (not outline, to avoid double border)

### Optimistic Updates

The following actions update the UI immediately before server confirmation:

- Moving a task between Kanban columns
- Checking off a task as complete
- Sending a chat message (appears instantly, waits for AI response)

On server error: revert the UI change and show a toast notification.

### Toast Notifications

Used for: save confirmations, errors, copy success, upload complete

```
Position: bottom-right
Duration: 3 seconds (errors: 5 seconds)
Variants: success (green), error (red), info (amber)
```

---

## 8. Loading & Error States

### Skeleton Loading

Used on: Dashboard stats, task list, analytics charts, quiz history

```css
/* Skeleton pulse animation */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}

.skeleton {
  background: rgba(255, 255, 255, 0.07);
  border-radius: 6px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
```

### Loading States by Component

| Component | Loading Behavior |
|---|---|
| Dashboard stats | 4 skeleton stat cards |
| Task list | 3 skeleton task rows |
| AI tutor response | Animated 3-dot typing indicator |
| Quiz generation | Centered loading card with brain emoji and dots |
| Chart data | Skeleton rectangle at chart height |
| PDF upload | Progress bar from 0–100% |

### Error States

| Scenario | UI Behavior |
|---|---|
| API network error | Toast: "Couldn't connect. Please try again." |
| AI rate limit hit | Toast: "Too many requests. Wait 60 seconds." |
| Invalid quiz JSON from AI | Retry automatically (up to 2x), then show "Generation failed" |
| Auth error (401) | Redirect to /login with "Session expired" message |
| PDF too large | Inline error below upload button: "File too large (max 10 MB)" |
| Empty page (no tasks, no data) | Friendly empty state illustration + CTA |

### Empty States

```
No tasks in Planner column:
  "No tasks here yet"
  [+ Add Task] button

No chat history:
  Robot icon + "Hi! Ask me anything about your subjects."

No quiz history:
  "Take a quiz to see your performance here"
  [Generate Quiz →] button

No analytics data:
  "Study for a few sessions to see your analytics"
```

---

## 9. Responsive Breakpoints

### Breakpoint Scale

```css
--bp-mobile:  640px   /* sm */
--bp-tablet:  768px   /* md */
--bp-laptop:  1024px  /* lg */
--bp-desktop: 1280px  /* xl */
```

### Layout Adaptations

| Component | Desktop (1024px+) | Tablet (768–1024px) | Mobile (<768px) |
|---|---|---|---|
| App shell | Sidebar 224px fixed + main | Sidebar 64px icon-only | Sidebar hidden, bottom nav |
| Dashboard stats | 4 columns | 2×2 grid | 2×2 grid |
| Dashboard body | 2/3 + 1/3 split | Stacked | Stacked |
| Planner kanban | 3 equal columns | 3 columns, smaller cards | Single column, tab switcher |
| Chat | Full height chat | Full height chat | Full screen chat |
| Analytics charts | 2-column grid | 2-column grid | Single column |

### Mobile Navigation

On mobile (< 768px):
- Sidebar collapses and is hidden
- Bottom navigation bar appears: 5 icons (Dashboard, Planner, Tutor, Quiz, Analytics)
- Active icon highlighted in amber
- Profile/Settings accessible via top-right avatar icon

---

## 10. Accessibility

### Requirements (WCAG 2.1 Level AA)

- **Color contrast:** All text on dark backgrounds must meet 4.5:1 ratio minimum
  - `#e2e8f5` on `#13131f` = 13.8:1 ✓
  - `#6b7280` on `#13131f` = 4.6:1 ✓
  - `#f59e0b` on `#0b0b15` = 7.8:1 ✓

- **Focus visible:** All interactive elements have visible focus rings (amber outline)

- **Keyboard navigation:**
  - Tab order follows visual flow
  - Enter submits forms and activates buttons
  - Escape closes modals and dialogs
  - Arrow keys navigate within select dropdowns

- **Screen readers:**
  - All images have `alt` attributes
  - Icon-only buttons have `aria-label`
  - Chat messages have `role="log"` and `aria-live="polite"`
  - Quiz questions announce each new question to screen readers
  - Progress bars have `role="progressbar"` with `aria-valuenow`

- **Reduced motion:** Respect `prefers-reduced-motion`
  - Disable hover animations and skeleton pulses
  - Keep functional transitions (loading spinner, page transitions) at minimum

---

## 11. Animation Guidelines

### Principles

- **Purposeful:** Every animation communicates something (loading, success, transition)
- **Fast:** UI transitions ≤ 200ms; content transitions ≤ 350ms
- **Subtle:** Motion should never distract from the content

### Timing Reference

```css
--duration-instant:  100ms;   /* Hover states, immediate feedback */
--duration-fast:     150ms;   /* Button active, checkbox tick */
--duration-normal:   200ms;   /* Page element transitions */
--duration-slow:     350ms;   /* Page entry, modal open */

--ease-default:     cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring:      cubic-bezier(0.175, 0.885, 0.32, 1.275);
--ease-out:         cubic-bezier(0, 0, 0.2, 1);
```

### Specific Animations

| Element | Animation | Duration |
|---|---|---|
| Button hover | translateY(-1px) | 150ms ease |
| Card hover | border-color, translateY(-1px) | 200ms ease |
| Quiz option select | background-color (green/red) | 180ms ease |
| Modal open | scale(0.95→1) + opacity(0→1) | 200ms ease-out |
| Typing indicator dots | translateY 0→-5px→0 | 1.1s infinite, staggered |
| Progress bar fill | width transition on mount | 400ms ease-out |
| Score ring | stroke-dashoffset animated | 800ms ease-out |
| Skeleton pulse | opacity 0.4→0.8→0.4 | 1.5s infinite |
| AI message appear | opacity(0→1) + translateY(8px→0) | 300ms ease-out |

---

## 12. Dark Theme Tokens

All theme tokens as CSS custom properties:

```css
:root {
  /* Backgrounds */
  --bg-base:       #0b0b15;
  --bg-surface:    #0d0d1a;
  --bg-card:       #13131f;
  --bg-elevated:   #1a1a2c;
  --bg-input:      rgba(255, 255, 255, 0.05);

  /* Text */
  --text-primary:  #f1f1f9;
  --text-secondary:#e2e8f5;
  --text-muted:    #9ca3af;
  --text-hint:     #6b7280;
  --text-disabled: #4b5563;

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-normal: rgba(255, 255, 255, 0.09);
  --border-strong: rgba(255, 255, 255, 0.15);

  /* Brand */
  --brand:         #f59e0b;
  --brand-dark:    #d97706;
  --brand-muted:   rgba(245, 158, 11, 0.12);
  --brand-border:  rgba(245, 158, 11, 0.22);

  /* Semantic */
  --success:       #10b981;
  --success-muted: rgba(16, 185, 129, 0.12);
  --error:         #ef4444;
  --error-muted:   rgba(239, 68, 68, 0.10);
  --info:          #818cf8;
  --info-muted:    rgba(99, 102, 241, 0.12);
}
```
