# Cissikar Exam Platform - Project Knowledge Base

Welcome to the **Cissikar Exam Platform** developer knowledge base. This document serves as a comprehensive reference guide to the directory structures, user interfaces, components, themes, and layouts established during the core bootstrapping phase.

---

## 🛠️ Technology Stack & Dependencies

The project is built on a modern, high-performance web architecture:

- **Framework**: [Next.js 16.2 (App Router)](https://nextjs.org/)
- **Core Library**: [React 19.0](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first, no `tailwind.config.js` file required)
- **Component Foundations**: [Shadcn UI](https://ui.shadcn.com/) + [@base-ui/react](https://base-ui.com/)
- **Preset/Theme**: `base-nova` (Density-focused spacing optimized for metrics dashboards)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: Prepared for [Zustand](https://github.com/pmndrs/zustand)
- **Form Handling**: Prepared for [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

---

## 📂 Project Directory Structure

Below is the structured folder mapping of the workspace:

```
exam-platform/
├── app/                  # Next.js App Router folders & page routes
│   ├── (auth)/           # Authentication layout & routes
│   │   └── login/        # Tabbed Student & Admin Login Page
│   ├── (admin)/          # Admin-specific layouts & administrative operations
│   │   └── admin/        # Resolves to /admin (Dashboard, Students, Questions, Exams, Results)
│   ├── (student)/        # Student dashboard, active exams, & results summaries
│   │   └── student/      # Resolves to /student (Dashboard, Exam screen, Results sheets)
│   ├── globals.css       # Tailwind CSS v4 variables & custom global layers
│   └── layout.tsx        # Base root HTML & Font loader configurations
├── components/           # Reusable UI & Layout Components
│   └── ui/               # Tailored UI Primitives (Shadcn + Base UI wrappers)
├── lib/                  # External clients, Supabase adapters, and utility helpers
├── hooks/                # Custom React Hooks
├── services/             # API data-fetching services & mock queries
├── store/                # Client state stores (Zustand)
├── types/                # TypeScript interface declarations
├── utils/                # General utility helper functions
├── constants/            # Global constant descriptors & configurations
├── public/               # Static assets & image elements
├── tsconfig.json         # TypeScript compiler configurations
├── components.json       # Shadcn UI configuration schema
└── package.json          # Dependency packages & dev script shortcuts
```

---

## 🎛️ UI Core Components (`components/ui/`)

These components are scaffolded and fully integrated for UI presentation:

| Component | Path | Description / Details |
| :--- | :--- | :--- |
| **Button** | [`components/ui/button.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/button.tsx) | Extends Base UI button. Includes primary, outline, secondary, ghost, destructive, and link styles. |
| **Input** | [`components/ui/input.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/input.tsx) | Base UI text input with border-ring focus transitions. |
| **Card** | [`components/ui/card.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/card.tsx) | Standard containment structure (Header, Title, Description, Content, Footer). |
| **Modal** | [`components/ui/modal.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/modal.tsx) | **[Custom Custom]** Dynamic wrapper around shadcn Dialog containing title, description, body, and action footer. |
| **Loader** | [`components/ui/loader.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/loader.tsx) | **[Custom Custom]** Spinning loading indicator with color and sizing variables. |
| **Search Box** | [`components/ui/search-box.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/search-box.tsx) | **[Custom Custom]** Combines standard input with left Search icon and right Clear input button triggers. |
| **Badge** | [`components/ui/badge.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/badge.tsx) | Round/oval indicator pill elements. |
| **Table** | [`components/ui/table.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/table.tsx) | Structured grid table definitions. |
| **Pagination** | [`components/ui/pagination.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/pagination.tsx) | Standard page selector link groups. |
| **Alert** | [`components/ui/alert.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/alert.tsx) | Highlighted callouts for notification banners. |
| **Tabs** | [`components/ui/tabs.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/components/ui/tabs.tsx) | Base UI Tabs selectors for switching views. |

---

## 🎨 Theme & Typography (`app/globals.css`)

We configure colors in HSL and OKLCH color spaces. In **Tailwind CSS v4**, theme variables are declared directly inside the stylesheet using `@theme inline`:

- **Primary Colors**: Deep Slate/Navy OKLCH variables.
- **Secondary Colors**: Light muted neutral slate variables.
- **Radius**: Dense spacing standard border-radius `0.625rem`.
- **Global Borders**: Evaluates standard variable boundary configurations automatically across layout edges.

---

## 🖥️ Screen & Layout Overview

### 1. General Landing Page (`/`)
- **File**: [`app/page.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/page.tsx)
- **Features**: Displays available examinations, mock search controls, pagination navigation, and a sign-in header button linking to `/login`.

### 2. Login Portal (`/login`)
- **File**: [`app/(auth)/login/page.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/%28auth%29/login/page.tsx)
- **Features**: Tabbed toggle component switching between:
  - **Student login**: Inputting *Roll Number* and *Password*. Redirects to `/student`.
  - **Admin login**: Inputting *Email* and *Password*. Redirects to `/admin`.

### 3. Administrator Console (`/admin/...`)
- **Main Layout**: [`app/(admin)/layout.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/%28admin%29/layout.tsx)
  - Features a left-hand navigation sidebar (**Dashboard, Students, Questions, Exams, Results, Logout**) that collapses dynamically on mobile screens.
  
- **Admin Dashboard (`/admin`)**: [`app/(admin)/admin/page.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/%28admin%29/admin/page.tsx)
  - KPI Metrics grid (Students, Questions, Exams, Avg score).
  - SVG Gradient performance line chart representing course trends.
  - Lists for recent exam completions, student registrations, and submissions.
  
- **Student Database Manager (`/admin/students`)**: [`app/(admin)/admin/students/page.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/%28admin%29/admin/students/page.tsx)
  - Grid list table with searching, branch/status filters, and page controls.
  - Inlines CRUD overlays (Add Form, Edit Form, and Delete Alert Dialogs).
  
- **Question Pool Manager (`/admin/questions`)**: [`app/(admin)/admin/questions/page.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/%28admin%29/admin/questions/page.tsx)
  - Listing table representing question prompts, marks, difficulty, and correct answers.
  - CRUD modals (Question text area, option fields, correct answer choice dropdown, marks).
  - CSV bulk uploader mock modal.
  
- **Exam Builder (`/admin/exams`)**: [`app/(admin)/admin/exams/page.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/%28admin%29/admin/exams/page.tsx)
  - Left panel: Specifications form inputting Name, Duration, Class, Start/End timing windows.
  - Right panel: Checklist grid question picker detailing marks summary dynamically.
  - Bottom panel: List of previously built exams.

### 4. Student Area (`/student/...`)
- **Main Layout**: [`app/(student)/layout.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/%28student%29/layout.tsx)
  - Collapsible navigation panel (**Dashboard, Upcoming Exams, Results, Profile, Logout**).
  
- **Student Dashboard (`/student`)**: [`app/(student)/student/page.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/%28student%29/student/page.tsx)
  - Cards tracking upcoming, completed exam counts, and overall average scores.
  - Combined examination table displaying scheduled vs taken tests with contextual actions.
  
- **Exam Testing Screen (`/student/exam`)**: [`app/(student)/student/exam/page.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/%28student%29/student/exam/page.tsx)
  - Split interface with secure header showing countdown timer and auto-save pulse markers.
  - Left: Interactive questionnaire displaying choices with active selection state and clear action items.
  - Right: Numbered palette circles tracking visit statuses (*Answered (Green)*, *Marked (Purple)*, *Not Answered (Red)*, *Unvisited (Gray)*).
  - Safety submit warning summary popup dialog.
  
- **Exam Results Review (`/student/results`)**: [`app/(student)/student/results/page.tsx`](file:///Users/rahuljangir/cissikar/cissikar/exam-platform/app/%28student%29/student/results/page.tsx)
  - Visual Scorecard displaying percentage ratios and correct/incorrect ratios.
  - Accordion list of all exam questions displaying choice cards (highlighting student choices vs correct choices) and detailed explanations.

---

## 🚀 Running & Developing

### Development Server
Start the local hot-reloading development server on [http://localhost:3000](http://localhost:3000):
```bash
npm run dev
```

### Type Checking
Ensure type-safety across all components and page files:
```bash
npx tsc --noEmit
```

### Production Build
Test production bundles and compile static outputs:
```bash
npm run build
```
