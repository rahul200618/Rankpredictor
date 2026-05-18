# 🌟 Fresh Start: Custom Counseling Intelligence Platform

Welcome to your fresh project! We are transforming the cloned **KCETCoded** platform into your own custom, personalized, and branded website. 

To give you a completely clean slate, we have already **disconnected the old remote database and all previous user records** by removing the hardcoded fallback credentials in [client.ts](file:///c:/Users/asus/Downloads/coded/src/integrations/supabase/client.ts).

This document serves as your master plan. Below, you will find details on the **Tech Stack**, the **Database Schema**, a complete **Feature Atlas** to choose what you want, and a **Questionnaire** to start configuring your new site.

---

## 🛠️ 1. Technical Stack Overview

Your project is built using a modern, fast, and highly interactive technology stack:

### 🎨 Frontend (Client Interface)
*   **Core Framework**: **React 18** (via **Vite 5** for blazing fast local development and builds).
*   **Language**: **TypeScript 5** ensuring type safety, autocompletion, and solid refactoring.
*   **Styling & UI**:
    *   **Tailwind CSS** for responsive utility-first design.
    *   **Radix UI Abstractions** for accessible dropdowns, dialogs, and interactive overlays.
    *   **Framer Motion** for premium, fluid micro-animations and screen transitions.
*   **State & Query Management**:
    *   **TanStack React Query** for robust server-state caching and synchronization.
    *   **Lightweight Custom Store** (`src/store/`) for quick client-side interactions.
*   **Data Visualization**: **Recharts** for drawing interactive trend lines, bar charts, and college analytics.

### ⚙️ Backend & Infrastructure
*   **Platform-as-a-Service**: **Supabase**
    *   **Authentication**: Secure user login/signup using Email/OTP, OAuth, and JWT.
    *   **Storage**: Hosting space for images, upload files, and PDFs.
*   **Serverless Layer**: **Vercel Serverless Functions** (`api/`)
    *   `api/share.ts` & `api/og.tsx` for generating dynamic Open Graph share banners.
    *   `api/nvidia-chat.ts` for integrating AI models like NVIDIA Nemotron for the counseling assistant.

---

## 🗄️ 2. Database Schema (Logic Preserved)

The database schema is preserved in [schema.sql](file:///c:/Users/asus/Downloads/coded/supabase/schema.sql). When you set up your fresh Supabase project, you can simply run this SQL script to construct a brand new database with the exact same structure:

| Table Name | Purpose / Type of Information Stored |
| :--- | :--- |
| **`users`** | Student profiles (email, full name, phone, categories, expected ranks/marks, and preferences). |
| **`colleges`** | Master list of institutions (code, name, district, type, placement stats, and fees). |
| **`branches`** | Master list of academic courses (code, name, duration, and stream category). |
| **`cutoffs`** | Historical seat allocations (opening/closing ranks by year, round, category, and seat quota). |
| **`seat_matrix`** | Annual seat capacities (total, filled, and remaining seats). |
| **`rank_predictions`** | Historical marks-to-rank submissions for prediction accuracy tracking. |
| **`mock_simulations`** | Saved student preference lists and computed simulated allotments. |
| **`college_reviews`** | Verified student reviews and ratings (infrastructure, placements, faculty, helpful votes). |
| **`college_comments`** | Threaded community Q&A/discussions about colleges. |
| **`pyq_questions`** | Physics, Chemistry, and Mathematics previous year questions, answers, and explanations. |
| **`admin_activities`** | Audit logs recording changes, updates, and moderation actions taken by admins. |

> [!NOTE]
> All tables are secured using **Row Level Security (RLS)**, ensuring students can *only* write/modify their own personal records, while cutoff data and master lists remain publicly readable.

---

## 🗺️ 3. Complete Feature Atlas (Choose Your Features)

Review the following catalog of features from the cloned project. You can choose which ones to **Keep**, **Remove**, or **Redesign** for your fresh website.

### Category A: Core Admissions Intelligence
- [ ] **Rank Predictor**: Calculates expected rank based on exam marks and board percentages. Included with shareable result banners.
- [ ] **Cutoff Explorer**: Explores over 200,000 historic cutoff rows (2023–2025) filtered by exam, category, and round.
- [ ] **College Finder**: Suggests matching colleges and branches based on student rank and category. Includes bookmarking and CSV export.
- [ ] **College Cutoffs Matrix**: Displays cutoff tables comparing multiple categories side-by-side.
- [ ] **College Detail Page**: Shows descriptive timelines, placement records, and historical branch cutoff charts for a single college.

### Category B: Planning & Simulator Tools
- [ ] **Mock Simulator**: Allows students to re-order their college selection list and simulate mock allotments based on past cutoffs.
- [ ] **KEA Option Planner**: Parses official Option Entry PDFs and extracts option sequences to prevent manual entry errors.
- [ ] **Round Tracker**: Interactive timeline guiding students through registration, document verification, and seat allocation rounds.
- [ ] **Documents Checklist**: Interactive dashboard showing required certificates, reservation guidelines, and documents.

### Category C: Student Guidance & Engagement
- [ ] **AI Counselor**: Conversational chatbot powered by NVIDIA APIs to guide students through general admission FAQs.
- [ ] **CET News Portal**: Dynamic aggregator page pulling the latest official press notes and announcements.
- [ ] **Study Materials Desk**: Digital shelf containing downloadable resources, syllabus updates, and worksheets.
- [ ] **Daily Challenge**: Gamified daily quizzes with streak tracking to keep students practicing daily.
- [ ] **PYQ Test Center**: Chapter-wise online practice exams for Physics, Chemistry, and Mathematics with explanations.
- [ ] **Cutoff Clash Game**: Interactive higher/lower style game testing students' intuition on college popularity and cutoff ranks.

### Category D: Niche / Lab Features
- [ ] **Squad Finder**: Specialized filter showing colleges where multiple friends can get admitted together based on all of their ranks.
- [ ] **Metro Proximity Mapper**: Filters colleges in Bangalore based on distance to the closest Namma Metro station.
- [ ] **BMTC Route Mapper**: Proximity finder based on BMTC bus connectivity.
- [ ] **Hidden Gems Surfer**: Surfacings underrated colleges offering excellent value-for-money or higher placement-to-cutoff ratios.

---

## 🧹 4. How the Slate was Cleaned

To make your project fresh, safe, and independent:
1.  **Removed Hardcoded Keys**: We updated [client.ts](file:///c:/Users/asus/Downloads/coded/src/integrations/supabase/client.ts) to remove the prior project's URL and Key. The app is now completely detached from the previous database.
2.  **Ready for Your Credentials**: The codebase will now read your own fresh credentials through a `.env` file (copied from `env.example`).
3.  **Wiped User History**: Without the old Supabase credentials, all local cookies, session storage, and remote user profiles are fully wiped. The database will start at `0` records.

---

## 💬 5. Customization Questionnaire (Let's Get Started!)

Please read through these questions and reply with your answers so we can customize the codebase specifically to your vision:

### 🏷️ Question 1: Brand Name & Identity
*   What is the **new name** of your website? (e.g., *AdmissionsHQ*, *CETPlanner*, *MyCollegePredictor*, etc.)
*   Do you have a **slogan or tagline**? (e.g., *Your Ultimate Guide to Engineering Admissions*)

### 🎨 Question 2: Color Scheme & Design
*   What **color palette** or design style would you like? 
    *   *Option A*: Sleek Dark Mode with Indigo/Blue accents (similar to the current setup).
    *   *Option B*: Modern Emerald/Mint theme (great for growth and trust).
    *   *Option C*: Futuristic Cyberpunk Dark Theme with Violet/Orange highlights.
    *   *Option D*: Clean Light/Dark responsive design with Purple/Pink gradients.

### 🧩 Question 3: Core Features Selection
*   Which features from the **Feature Atlas** (Category A, B, C, D) do you want to **KEEP**?
*   Which features do you want to **REMOVE** to keep the site clean and focused?
*   Are there any **NEW** features you'd like to add that aren't in the cloned project?

### 🔐 Question 4: Supabase Database Setup
*   Do you want help creating a **new Supabase project** and executing the [schema.sql](file:///c:/Users/asus/Downloads/coded/supabase/schema.sql) file to set up your tables?
*   Would you like me to walk you through creating your local `.env` file?

---

### Next Action:
Reply with your choices to the questions above, and we will immediately start renaming the application, updating the titles, configuring the design palette, and structuring the route map to match your exact selection!
