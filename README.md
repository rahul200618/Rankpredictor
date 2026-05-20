![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)
![Hostinger](https://img.shields.io/badge/Hosted%20on-Hostinger-purple)

# RankPrediction 🎓

🌐 Live: https://rankprediction.com
---
 

RankPrediction is a student-focused counseling intelligence platform for KCET and COMEDK aspirants that combines rank prediction, cutoff analysis, college discovery, and counseling guidance into a single web application.

> Helping students make better admission decisions using data-driven insights.

---


## 🚀 Features

### Counseling Tools
- 🎯 Rank Predictor (KCET & COMEDK mode-aware)
- 📊 Cutoff Explorer
- 🏫 College Finder
- 📈 Round Tracker
- 📖 Counseling Guide
- 🤖 AI Counselor

### Community & Support
- ⭐ Reviews & feedback
- 💡 Feature requests
- 📩 Counseling enquiry system
- 🛡️ Admin moderation dashboard

---

## 🛠 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Wouter
- Framer Motion

### Backend & Services
- Supabase
- Firebase Authentication
- Vercel Serverless Functions
- Node.js API
- Hostinger Hosting 

### Libraries
- XLSX
- jsPDF
- pdfjs-dist
- Recharts

---

## 📂 Project Structure

```bash
RankPrediction/
├── src/
│   ├── pages/         # Route-level pages
│   ├── components/    # Shared UI
│   ├── lib/           # Business logic & utilities
│   ├── context/       # Global state & auth
│
├── api/               # Serverless functions
├── public/            # Assets and datasets
├── supabase/          # SQL schemas & scripts
├── scripts/           # Data processing scripts
```

---

## 📊 Data Sources

- KCET cutoff datasets
- COMEDK cutoff datasets
- College metadata
- Supabase-managed app data

Stored in:

```bash
public/data/
public/colleges-list.json
```

---

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/rankprediction.git
```

Move into project directory:

```bash
cd rankprediction
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open:

```bash
http://localhost:5173
```

---

## 🔧 Scripts

| Command | Description |
|-----------|------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production app |
| `npm run test` | Run tests |
| `npm run extract:cutoffs` | Extract KCET cutoffs |
| `npm run extract:comedk` | Extract COMEDK cutoffs |
| `npm run move:xlsx` | Process XLSX files |
| `npm run build:summary` | Generate summaries |

---

## 🔐 Authentication & Security

- Phone-based authentication
- Protected admin/developer routes
- Supabase-backed enquiry storage
- Validation and logging for serverless endpoints
- reCAPTCHA + phone verification support

---

## 🌍 Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_FIREBASE_API_KEY=your_key
```

Refer to:

```bash
.env.example
```

---

## 📌 Disclaimer

RankPrediction is an independent project and is **not affiliated with KEA or COMEDK**.

Always verify admission information using official counseling notifications and documents.

---

## ⭐ Support

If you found this project useful:

- Star the repository
- Report issues
- Suggest features
- Share feedback




## 🤝 Contributions

Contributions are welcome through pull requests and project collaboration.

By contributing to this repository, contributors agree that all submitted code, fixes, features, and improvements become part of RankPrediction and may be used, modified, or maintained by the project owner.

Contributing does not grant rights to copy, redistribute, or reuse the project outside of RankPrediction.

---

## 📜 License

Copyright © 2026 RankPrediction

All Rights Reserved.

This repository is publicly visible for transparency and collaboration purposes only.

Permission is granted only for viewing and contributing to this project through approved repository workflows (issues, pull requests, and collaboration).

Unauthorized copying, redistribution, commercial use, or creation of derivative works outside this repository is prohibited.

## 📜 License

This project is proprietary software.

Copyright © 2026 RankPrediction

See the `LICENSE` file for details.