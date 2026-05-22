-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Migration: Prevent duplicate rank predictions & enquiries     ║
-- ║  Paste into Supabase SQL Editor → Run                            ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ━━━ 1. Clean up duplicate rank results, keeping only the newest entry per (phone, exam_mode) ━━━
WITH ranked_rank_results AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY phone, exam_mode 
           ORDER BY created_at DESC, id DESC
         ) as rn
  FROM public.student_rank_results
)
DELETE FROM public.student_rank_results
WHERE id IN (
  SELECT id FROM ranked_rank_results WHERE rn > 1
);

-- ━━━ 2. Add UNIQUE constraint on (phone, exam_mode) to student_rank_results ━━━
ALTER TABLE public.student_rank_results
  ADD CONSTRAINT student_rank_results_phone_exam_mode_unique UNIQUE (phone, exam_mode);

-- ━━━ 3. Clean up duplicate counseling enquiries, keeping only the newest entry per phone ━━━
WITH ranked_enquiries AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY phone 
           ORDER BY created_at DESC
         ) as rn
  FROM public.counseling_enquiries
)
DELETE FROM public.counseling_enquiries
WHERE id IN (
  SELECT id FROM ranked_enquiries WHERE rn > 1
);

-- ━━━ 4. Add UNIQUE constraint on phone to counseling_enquiries ━━━
ALTER TABLE public.counseling_enquiries
  ADD CONSTRAINT counseling_enquiries_phone_unique UNIQUE (phone);
