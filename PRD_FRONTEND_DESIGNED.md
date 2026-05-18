# 📋 PRODUCT REQUIREMENT DOCUMENT & FRONTEND DESIGN SPECIFICATION
## Project: Rankmaster (Counseling Intelligence Platform)

This document is a comprehensive Frontend Product Requirement Document (PRD) and UI Specification. It includes both all functional feature requirements and a **highly detailed premium visual design system** to instruct an AI generator (such as v0, Lovable, Claude, or Bolt.new) to create a custom light-theme glassmorphic interface.

---

## 🎨 1. Global Visual Identity & Design System

To maintain a luxury, state-of-the-art feel, the application uses a **responsive light glassmorphic design system**.

### 🌌 Background Aura
*   **Fixed Styling**: Apply a fixed backdrop gradient to the main viewport:
    `background: linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)`
*   **Visual Feel**: Light, airy, high-trust blue-mint sky aura that remains static as the user scrolls.

### 🧪 Card Design System (Glassmorphism)
*   **Card Containers**: Translucent white panels with high glass effect:
    `background: rgba(255, 255, 255, 0.75)`
    `backdrop-filter: blur(12px)`
    `border: 1px solid rgba(224, 242, 254, 0.5)` (sky-100/50)
*   **Elevated Shadows**: Smooth multi-layered shadows to give cards three-dimensional depth:
    `box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)`

### 🎨 Brand Color Palette
*   **Primary Call-to-Actions (Positive CTAs)**: Vibrant Emerald Green (`#38b000` / `bg-emerald-500` / `hover:bg-emerald-600`) to highlight primary buttons, success paths, and "high probability" indicators.
*   **Secondary Controls (Info/Guides)**: Clean, high-contrast Sky Blue (`#2563eb` / `bg-blue-600` / `hover:bg-blue-700`) for helper buttons, info badges, and links.
*   **Highlights & Accents**: Curated purple gradients (`from-purple-600 to-blue-600`) reserved exclusively for the **AI Counselor** widgets and active AI states to look premium.
*   **Text Hierarchy**:
    *   Headings: Deep Slate Gray (`#0f172a` / `text-slate-900` / font weight: 800)
    *   Body: Muted Slate (`#475569` / `text-slate-600` / line-height: 1.6)

---

## 🗺️ 2. Core Site Architecture & Layouts

### 🗂️ Navigation Mechanics
*   **Desktop Layout**: Left-aligned sticky sidebar (`AppSidebar.tsx`) with vertical icon lists, an interactive **Exam Toggle Switch** (switching states between **KCET** and **COMEDK** modes via a global context provider), and an active highlight matching the route.
*   **Mobile Layout**: Bottom floating dock bar (`MobileNav.tsx`) with the 4 flagship icons, combined with a top header containing a hamburger menu drawer for legal documents.

### 🚥 Route Map (React Router v7)
1.  `/` — **Homepage**: Main dashboard introduction.
2.  `/dashboard` — **Counseling Hub**: Statistics, timeline, and quick widgets.
3.  `/rank-predictor` — **Rank Predictor**: Calculations, sliders, shareable PNG card.
4.  `/cutoff-explorer` — **Cutoff Explorer**: Historic database explorer.
5.  `/college-finder` — **College Finder**: Smart admission suggestions.
6.  `/ai-counselor` — **AI Counselor**: Instant AI admissions companion.
7.  `/college/:collegeCode` — **College Detail**: Historically comparative college profile.
8.  `/reviews` / `/reviews/:collegeCode` — **College Reviews**: Peer rating desk.
9.  `/info-centre` — **Information Centre**: VTU vs Autonomous guides & FAQs.
10. `/donate` — **Support Desk**: Vercel metrics panel & UPI clipboard.

---

## ⚡ 3. Detailed Page-by-Page Specifications

### 🏠 Page 1: Homepage (`/`) — Asymmetric 2x2 Feature Bento Grid
*   **Header Section**: Branded title **Rankmaster** in slate bold typography with a subheading: *"Your Ultimate Guide to Engineering Admissions."* Includes the **Exam Toggle Switch** prominently.
*   **Interactive Grid**: 2 columns (responsive to 1 column on mobile). Four massive, clickable bento cards:
    1.  **Rank Predictor Card**: Pink-to-purple gradient glow, calculators icon, quick details on marks-to-rank composite formula.
    2.  **Cutoff Explorer Card**: Emerald-to-teal gradient glow, bar-chart icon, quick details on searching 200k+ historical rows.
    3.  **College Finder Card**: Blue-to-cyan gradient glow, search-magnifier icon, details on matching ranks to real colleges.
    4.  **AI Counselor Card**: Violet-to-blue gradient glow, robot icon, details on chatbot answering counseling questions.
*   **Hover Micro-Animations**: Card scales smoothly (`scale-[1.02]`), borders animate to matching accent gradient colors, background glass blurs from 12px to 16px.

### 📊 Page 2: Counseling Hub (`/dashboard`)
*   **Top Row Metrics (4 Cards)**:
    *   *Total Database Records*: Displays "200,000+" with Database icon.
    *   *Participating Colleges*: Displays "250+" with GraduationCap icon.
    *   *Academic Branches*: Displays "50+" with BookOpen icon.
    *   *Years of Historical Data*: Displays "3 Years (2023-2025)" with calendar icon.
*   **Left Column (Interactive Timeline)**: Clean vertical track highlighting counseling steps:
    1.  *Preparation & Mock Exams* (Green checkmark)
    2.  *Expected Rank Evaluation* (Active, pulsates with green ring)
    3.  *KEA Option Entry Sequence Planning* (Upcoming, faded slate)
    4.  *Seat Allotment & Document Verification* (Upcoming, faded slate)
*   **Right Column (Quick Actions & Community)**: Grid of flat shortcut buttons leading to finder, predictor, and AI. Below it, a list showing recent user discussions about engineering colleges.

### 🧮 Page 3: Rank Predictor (`/rank-predictor`)
*   **Interactive Input Controls**:
    *   *Slider 1 (KCET PCM Marks)*: Range 0 to 180. Stepper buttons (`+`/`-`) for micro-adjustments.
    *   *Slider 2 (PUC Board PCM %)*: Range 35% to 100%.
    *   *Calibrated Live Outputs*: Computed dynamically using the official KEA formula:
        `KEA Score = (KCET Score / 1.8) * 0.5 + (PUC Score) * 0.5`
*   **Visualization Panel (Confidence Gauge)**:
    *   A semi-circular circular progress dial showing the predicted rank range (e.g. *3,200 - 4,100*).
    *   Pulsating confidence indicator badge (Green: *High Confidence*, Amber: *Moderate Confidence*).
*   **Core Share Action**:
    *   **"Download Rank Card" Button**: Uses `html2canvas` library to take a snapshot of the card, generating a branded PNG card with the predicted rank, candidate details, and Rankmaster watermark.

### 🔍 Page 4: Cutoff Explorer (`/cutoff-explorer`)
*   **Multi-Dimensional Filter Header**:
    *   Single search bar accepting college names, codes, or abbreviations (e.g. searching "RVCE" instantly returns "R.V. College of Engineering").
    *   Drop-down select lists for: *Year* (2023, 2024, 2025), *Round* (Round 1, Round 2, Second Extended), *Reservation Category* (GM, 2AR, 3BG, SCG, STG, etc.), *Branch Stream*.
*   **Paginated Data Table**:
    *   Glassmorphic table header, row hover highlights.
    *   Columns: College Code, College Name, Branch, Category, Round, Cutoff Rank, Year.
    *   **"View Source" PDF Action**: Clicking the row opens a popup displaying the exact official KEA cutoff PDF page from which the row was scraped, guaranteeing data transparency.

### 🎯 Page 5: College Finder (`/college-finder`)
*   **Finder Inputs Sidebar**:
    *   Direct entry field for student's Rank, drop-down category selection, and desired district filters.
*   **Smart Probability Output Cards**:
    *   Each recommended college row displays a colored badge:
        *   `High Probability` (Green): Student rank is significantly better than the past cutoff.
        *   `Moderate Probability` (Amber): Student rank is very close to the past cutoff.
        *   `Borderline` (Red): Student rank is right at the cutoff.
*   **Cutoff Trend Sparkline**:
    *   A miniature, highly visual line chart drawn next to each college branch showing if the cutoff trend has been rising or falling across the last 3 years.
*   **Export Controls**:
    *   **"Export Allotment List (PDF)" Button**: Bundles results into a print-formatted PDF document showing the student's choices, expected probabilities, and college contact details.

### 🏢 Page 6: College Detail Page (`/college/:collegeCode`)
*   **College Profile Summary**: High-trust layout detailing VTU Autonomous status, engineering stream ratings, annual placement percentage, and average CTC package.
*   **Historical Cutoff Chart**: Recharts-powered interactive multi-line chart comparing different rounds and reservation categories for the college's flagship branches over time.

### 🤖 Page 7: AI Counselor (`/ai-counselor`)
*   **Safety Disclaimer Dialog**: Translucent overlay with a warning note: *"Currently powered by Google Gemini 1.5 Flash (Primary). Verify all suggestions with official resources."*
*   **Chat Window interface**:
    *   Bottom-anchored chat input area with dynamic helper prompts (e.g. *"Suggest best colleges for 10k rank in Bangalore"*).
    *   Typing state indicator with three pulsating dots.
    *   Chat bubbles rendering clean markdown, bolding, lists, and clickable links to College Finder.

### 📰 Page 8: Information Centre & Reviews (`/info-centre`)
*   **Blog-Style Detail Panels**: Specially designed layout comparing **VTU Affiliated vs Autonomous Colleges**.
*   **Myths vs Realities Deck**: Responsive grid of cards displaying popular admissions myths on the front, flipping on click to show realities on the back.
*   **Verified Review Forms**: Rating controls for Infrastructure, Placement, Faculty, and Campus Life.

### ☕ Page 9: Support Desk & Donate (`/donate`)
*   **Vercel Resource Limits Panel**: Four beautiful circular progress dials indicating mock server statistics (Web requests count, bandwidth, data logs) to convey operational costs.
*   **UPI Copy Box (Sleek Clipboard Integration)**:
    *   *No QR Graphic*: Sleek modern copy container displaying `VITE_UPI_ID` (defaults to `counselor@ybl`).
    *   Clicking **"Copy ID"** copies the string to clipboard, updates button icon to a green Check, and shows a transient *"Copied!"* success message.

---

## 🗄️ 4. State Management, APIs, and Variables Contract

### 🌍 Global Context State
*   `useExamMode()` Context: Provides `examMode` string (`"KCET"` or `"COMEDK"`) and `setExamMode` dispatcher. When toggled, all cutoff queries and page configurations dynamically re-route data sources.

### 📡 Supabase Schema Bindings
All queries expect access to a Supabase client (`src/integrations/supabase/client.ts`) referencing these structures:
*   `colleges`: `{ code: text, name: text, district: text, type: text, average_package: numeric }`
*   `branches`: `{ code: text, name: text }`
*   `cutoffs`: `{ college_code: text, branch_code: text, category: text, cutoff_rank: integer, year: integer, round: text }`

### 🔑 Required Environment Variables
Ensure the following variables are declared in the backend hosting `.env`:
*   `VITE_SUPABASE_URL` — Supabase project endpoint reference.
*   `VITE_SUPABASE_ANON_KEY` — Anon API key.
*   `GEMINI_API_KEY` — Google Gemini API key (utilized in `/api/gemini-chat`).
*   `VITE_UPI_ID` — Customized recipient UPI ID (e.g. `yourname@upi`).
