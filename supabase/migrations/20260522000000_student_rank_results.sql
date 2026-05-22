-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Migration: student_rank_results + user_profiles.interested_subjects ║
-- ║  Paste into Supabase SQL Editor → Run                            ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ━━━ 1. Add interested_subjects column to user_profiles ━━━
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS interested_subjects TEXT[] DEFAULT '{}';

-- ━━━ 2. Create student_rank_results table ━━━
CREATE TABLE IF NOT EXISTS public.student_rank_results (
  id                  BIGSERIAL PRIMARY KEY,
  phone               TEXT NOT NULL,
  full_name           TEXT,
  interested_subjects TEXT[] DEFAULT '{}',
  exam_mode           TEXT NOT NULL DEFAULT 'KCET',
  kcet_total          INTEGER,
  board_avg           DECIMAL(5, 2),
  kea_score           DECIMAL(6, 2),
  predicted_rank_low  INTEGER,
  predicted_rank_high INTEGER,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ━━━ 3. Enable RLS ━━━
ALTER TABLE public.student_rank_results ENABLE ROW LEVEL SECURITY;

-- ━━━ 4. RLS Policies — open insert/select for phone-auth users ━━━
DROP POLICY IF EXISTS "Anyone can insert rank results"  ON public.student_rank_results;
DROP POLICY IF EXISTS "Anyone can view rank results"    ON public.student_rank_results;

CREATE POLICY "Anyone can insert rank results"
  ON public.student_rank_results FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view rank results"
  ON public.student_rank_results FOR SELECT USING (true);

-- ━━━ 5. Indexes for Admin queries ━━━
CREATE INDEX IF NOT EXISTS idx_rank_results_phone      ON public.student_rank_results(phone);
CREATE INDEX IF NOT EXISTS idx_rank_results_created_at ON public.student_rank_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rank_results_exam_mode  ON public.student_rank_results(exam_mode);

-- ━━━ 6. user_profiles: allow anonymous insert (needed for phone-auth flow) ━━━
DROP POLICY IF EXISTS "Anyone can insert user_profiles" ON public.user_profiles;
CREATE POLICY "Anyone can insert user_profiles"
  ON public.user_profiles FOR INSERT WITH CHECK (true);
