ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS interested_exams TEXT[] DEFAULT '{}';

ALTER TABLE public.counseling_enquiries
  ADD COLUMN IF NOT EXISTS interested_exams TEXT[] DEFAULT '{}';
