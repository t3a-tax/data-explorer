# T3A Data Explorer

Interactive data explorer portal for T3A's accounting firm acquisition intelligence dataset. Built with React (Netlify) + Supabase backend.

## What It Does

- **Dashboard** — Overview metrics, state distribution, tier breakdown, pipeline status
- **Firm Explorer** — Searchable, filterable table of 135K+ firms with detail modal
- **Map View** — Geographic distribution by state and individual firm (when geocoded)
- **Data Completeness** — Field-by-field completeness analysis + recommended next steps

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run `supabase/schema.sql` to create the `firms` table + policies
3. Copy your **Project URL** and **anon key** from Project Settings → API

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Fill in your Supabase credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Upload Firm Data

```bash
pip install supabase pandas pyarrow python-dotenv
python supabase/upload_data.py
```

This uploads all 135,156 firms from `../accounting-firm-explorer/data/merged/firms_master.parquet` in batches of 500.

### 4. Create a Test User

```bash
python supabase/create_test_user.py
```

Creates `explorer@t3a.tax` / `T3A-Explorer-2025!`. Change password after first login via the Supabase dashboard.

### 5. Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:5173

### 6. Deploy to Netlify

Connect this repo in the Netlify UI and set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Build command: `npm run build` | Publish dir: `dist`

## Data Sources

| Source | Firms | States | Status |
|--------|-------|--------|--------|
| CPA Directory | 83,488 | 9 | Complete |
| State CPA Boards | 45,628 | AL, FL, TN only | Partial |
| Google Maps | 7,525 | 9 | Complete |
| Google Maps Detail | 7,525 | 7 (no LA, TX) | Partial |
| Accounting Practice Exchange | 285 | 9 | Complete |
| Secretary of State | 3 | SC only | Early stage |

## Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Hosting:** Netlify
- **Charts:** Recharts
- **Maps:** React-Leaflet (OpenStreetMap)
- **Design:** Matches t3a.tax — Inter + Hedvig Letters Serif, #1f514c teal

Source data pipeline: [t3a-tax/accounting-firm-explorer](https://github.com/t3a-tax/accounting-firm-explorer)
