-- Add shift column to student_rank_results and saved_marks tables
ALTER TABLE public.student_rank_results
  ADD COLUMN IF NOT EXISTS shift TEXT;

ALTER TABLE public.saved_marks
  ADD COLUMN IF NOT EXISTS shift TEXT;
