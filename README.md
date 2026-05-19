# RankPrediction

RankPrediction (rankprediction.com) is a student-focused counseling intelligence platform for KCET and COMEDK aspirants. It turns cutoff data, rank prediction, college discovery, and counseling guidance into one fast web app.

## What it does

- KCET and COMEDK mode-aware rank prediction
- College discovery and cutoff exploration
- College detail pages with historical context
- Counseling enquiry capture and admin review
- Reviews, feedback, and moderation surfaces
- PYQ practice, daily challenge, and counseling utilities
- News feed and automation support
- XLSX-backed cutoff loading for college discovery

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Wouter routing
- Supabase
- Firebase Auth
- Vercel serverless functions
- XLSX, jsPDF, pdfjs-dist, Recharts, Framer Motion

## Project Structure

- `src/pages/` - route-level pages
- `src/components/` - shared UI and layout
- `src/lib/` - business logic, loaders, utilities
- `src/context/` - app state and auth/mode handling
- `api/` - serverless endpoints
- `public/` - static assets and data files
- `supabase/` - database schema and SQL scripts
- `scripts/` - import, extraction, news, and maintenance scripts

## Main Features

### Counseling tools

- Rank Predictor
- Cutoff Explorer
- College Finder
- College Detail
- College Compare surface
- Round Tracker
- Documents and planning support
- Mock Simulator

### Community and support

- Reviews
- Feature requests
- Counseling enquiries
- Admin moderation and review views
- AI Counselor

### Learning and engagement

- Daily Challenge
- PYQ Test
- Cutoff Clash
- Info Centre
- Materials
- News feed

## Key Data Sources

- KCET cutoff datasets in `public/data/`
- COMEDK cutoff datasets in `public/data/`
- College list in `public/colleges-list.json`
- PYQ bank in `src/data/pyqQuestionBank.ts`
- Supabase tables for app settings, counseling enquiries, and user profiles

## Setup

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## Useful Scripts

- `npm run extract:cutoffs`
- `npm run extract:comedk`
- `npm run move:xlsx`
- `npm run fetch:news`
- `npm run fetch:news:advanced`
- `npm run refresh:news`
- `npm run news:webhook`
- `npm run build:summary`

## Environment Notes

The app expects Supabase and Firebase configuration through environment variables. Check `.env.example` if present or review the integration files in `src/integrations/` and `src/lib/`.

## Security and Auth

- Phone-based auth is used for signed-in features
- Admin and developer routes are protected in the app shell
- Counseling enquiries are stored in Supabase
- Sensitive serverless endpoints use validation and logging helpers

## Notes

This project is independent and not affiliated with KEA or COMEDK. Always verify final admission decisions against official documents.

For implementation details, browse the code in `src/`, `api/`, and `supabase/`.
