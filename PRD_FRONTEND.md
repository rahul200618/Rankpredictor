# 📋 PRODUCT REQUIREMENT DOCUMENT & FUNCTIONAL SPECIFICATION
## Project: Rankmaster (Counseling Intelligence Platform)

This document is a comprehensive Frontend Product Requirement Document (PRD) detailing all functional requirements, features, state management parameters, routing contracts, and API structures. 

> [!IMPORTANT]
> **Design Theme & Aesthetics Guidance**:
> The visual identity, layout structure, color schemes, card stylings (e.g., solid cards, borders, glassmorphic effects), typography, micro-animations, and general UI aesthetics are **entirely left to the choice of the generating AI model**. The generating AI should choose the most beautiful, modern, professional, and accessible look-and-feel (e.g., standard light/dark modes, dashboard layouts, icons) that best represents a premium engineering counseling platform.

---

## 🗺️ 1. Core Site Architecture & Layouts

### 🗂️ Navigation Mechanics
*   **System Layout**: An accessible navigation system (e.g., sidebar, top header, or mobile dock) with vertical/horizontal icon menus.
*   **Exam Toggle Switch**: An interactive switcher that toggles the global state between **KCET** and **COMEDK** modes via a global context provider, updating all page data sources dynamically.
*   **Active States**: Visual indicators representing the currently active route.

### 🚥 Route Map (React Router v7)
1.  `/` — **Homepage**: Introduction to the platform's primary tools.
2.  `/dashboard` — **Counseling Hub**: High-level statistics, action timeline, and community dashboard.
3.  `/rank-predictor` — **Rank Predictor**: Calculations, PCM score sliders, and downloadable rank certificate generation.
4.  `/cutoff-explorer` — **Cutoff Explorer**: Historical database browser for cutoffs.
5.  `/college-finder` — **College Finder**: Smart college and branch recommender tool.
6.  `/ai-counselor` — **AI Counselor**: Generative AI chat counselor for admissions FAQs.
7.  `/college/:collegeCode` — **College Detail**: Profiling historic placement and cutoff trends for a specific college.
8.  `/reviews` / `/reviews/:collegeCode` — **College Reviews**: User rating and peer reviews module.
9.  `/info-centre` — **Information Centre**: Informational guides on autonomous statuses and college rules.
10. `/donate` — **Support Desk**: Server metrics panel and UPI copy-to-clipboard donation system.

---

## ⚡ 2. Detailed Page-by-Page Specifications

### 🏠 Page 1: Homepage (`/`)
*   **Header Section**: Title **Rankmaster** with a descriptive counseling subtitle. Prominently includes the **Exam Toggle Switch**.
*   **Core Feature Selection**: Clear entry points to the four flagship features:
    1.  *Rank Predictor*: Links to rank prediction logic.
    2.  *Cutoff Explorer*: Links to historic cutoff data search.
    3.  *College Finder*: Links to matching rank recommendations.
    4.  *AI Counselor*: Links to interactive chat counseling.
*   **Micro-interactions**: Interactive states showing clickability and transitions.

### 📊 Page 2: Counseling Hub (`/dashboard`)
*   **High-Level Metric Counters**:
    *   *Total Database Records*: Numeric count (e.g., "200,000+").
    *   *Participating Colleges*: College count (e.g., "250+").
    *   *Academic Branches*: Branch count (e.g., "50+").
    *   *Years of Historical Data*: Calendar span (e.g., "3 Years").
*   **Counseling Process Timeline**: A structured step-by-step track mapping the admissions lifecycle:
    1.  *Preparation & Mock Exams* (Completed state indicator)
    2.  *Expected Rank Evaluation* (Active state indicator)
    3.  *Option Entry Sequence Planning* (Upcoming state indicator)
    4.  *Seat Allotment & Document Verification* (Upcoming state indicator)
*   **Quick Actions & Community**: Shortcuts to primary calculator tools alongside a feed of recent student discussions.

### 🧮 Page 3: Rank Predictor (`/rank-predictor`)
*   **Interactive Input Controls**:
    *   *Exam PCM Marks Selector*: Slider/input adjusting score from 0 to 180. Stepper buttons (`+`/`-`) for micro-adjustments.
    *   *Board PCM Percentage Selector*: Slider/input adjusting percentage from 35% to 100%.
    *   *Calibrated Live Outputs*: Computed dynamically using the composite formula:
        `KEA Score = (KCET Score / 1.8) * 0.5 + (PUC Score) * 0.5`
*   **Prediction Output Panel**:
    *   Displays predicted rank range (e.g. *3,200 - 4,100*).
    *   Confidence level indicator (e.g. *High Confidence*, *Moderate Confidence*, *Borderline*).
*   **Card Download Feature**:
    *   **"Download Rank Card" Action**: Triggers `html2canvas` library to take a snapshot of the prediction card and download it as a branded PNG file.

### 🔍 Page 4: Cutoff Explorer (`/cutoff-explorer`)
*   **Multi-Dimensional Filter Header**:
    *   Text search box matching college names, codes, or common abbreviations (e.g., typing "RVCE" instantly returns "R.V. College of Engineering").
    *   Dropdown filters for: *Year* (2023, 2024, 2025), *Round* (Round 1, Round 2, Second Extended), *Reservation Category* (GM, 2AR, 3BG, SCG, STG, etc.), *Branch Stream*.
*   **Data Grid/Table View**:
    *   Columns: College Code, College Name, Branch, Category, Round, Cutoff Rank, Year.
    *   **"View Source" Action**: Triggering a row option displays a popup showing the official KEA cutoff PDF page source from which the row was derived.

### 🎯 Page 5: College Finder (`/college-finder`)
*   **Sidebar/Filter Setup**:
    *   Direct rank numeric input, category picker dropdown, and district boundary checkboxes.
*   **Smart Recommendation Results**:
    *   Outputs list of matches, flagging each with an admission probability classification:
        *   `High Probability` (Student's rank is significantly safer than historic cutoffs).
        *   `Moderate Probability` (Student's rank is near the borderline cutoff range).
        *   `Borderline` (Student's rank is tight against the cutoff limit).
*   **Cutoff Trend Sparklines**:
    *   A miniature line graph next to each college recommendation depicting cutoff trends over the last three years (2023-2025).
*   **Allotment List Export**:
    *   **"Export Allotment List (PDF)" Action**: Compiles the recommended college listings into a clean, printable PDF choice sheet.

### 🏢 Page 6: College Detail Page (`/college/:collegeCode`)
*   **Profile Analytics Summary**: Statistics displaying VTU Autonomous status, engineering stream ratings, annual placement percentage, and package CTC ranges.
*   **Cutoff Trend Charting**: Recharts-powered interactive multi-line chart comparing historic cutoff ranks across categories and branches over the years.

### 🤖 Page 7: AI Counselor (`/ai-counselor`)
*   **Safety Disclaimer Dialog**: Active warning popup: *"Currently powered by Google Gemini 1.5 Flash (Primary). Verify all suggestions with official resources."*
*   **Chat Window View**:
    *   Scrollable message area and keyboard input dock containing quick question recommendations (e.g., *"What is option entry sequence?"*).
    *   Visual typing feedback indicator.
    *   Message nodes rendering Markdown, bold, lists, and active route links.

### 📰 Page 8: Information Centre & Reviews (`/info-centre`)
*   **Autonomous Comparison Hub**: Information guides comparing VTU Affiliated vs Autonomous college rules and structures.
*   **Interactive Myths Cards**: Question-and-answer cards explaining admissions guidelines (e.g., clicking flips from Myth to Reality).
*   **Student Review Portal**: Interactive star rating forms evaluating Infrastructure, Placement, Faculty, and Campus Life.

### ☕ Page 9: Support Desk & Donate (`/donate`)
*   **Resource Metrics Dashboard**: Progress indicators displaying server bandwidth, Web request limits, and data storage levels to explain hosting costs.
*   **UPI Copy Box**:
    *   Text box rendering the environment variable `VITE_UPI_ID` (defaults to `counselor@ybl`).
    *   **"Copy ID"** button action copying the UPI ID string to clipboard, displaying active copy feedback ("Copied!" status).

---

## 🗄️ 3. State Management, APIs, and Variables Contract

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
