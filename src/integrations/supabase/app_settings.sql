CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on app_settings"
ON public.app_settings FOR SELECT
USING (true);

-- Allow authenticated users to update settings (In production, restrict to admins)
CREATE POLICY "Allow authenticated users to update app_settings"
ON public.app_settings FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert app_settings"
ON public.app_settings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Insert default settings
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES 
    ('feature_kcet', 'true'::jsonb, 'Enable KCET Predictor features'),
    ('feature_comedk', 'false'::jsonb, 'Enable COMEDK Predictor features'),
    ('feature_ads', 'false'::jsonb, 'Enable Ads on the platform')
ON CONFLICT (setting_key) DO NOTHING;
