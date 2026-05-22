-- ─── user_profiles table ───────────────────────────────────────────────────
-- Run this in your Supabase SQL Editor to create the user profiles table
-- that gets auto-populated when a user verifies their OTP.

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone                text,
  full_name            text,
  interested_subjects  text[] DEFAULT '{}',
  created_at           timestamptz DEFAULT now(),
  last_seen_at         timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role (admin) can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (auth.role() = 'service_role');

-- ─── Trigger: auto-create profile on signup ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, phone, full_name)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Trigger: update last_seen_at on login ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS trigger AS $$
BEGIN
  UPDATE public.user_profiles
  SET last_seen_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
