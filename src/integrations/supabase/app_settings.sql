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
DROP POLICY IF EXISTS "Allow public read access on app_settings" ON public.app_settings;
CREATE POLICY "Allow public read access on app_settings"
ON public.app_settings FOR SELECT
USING (true);

-- Allow public to update settings (Protected by frontend Developer Page)
DROP POLICY IF EXISTS "Allow authenticated users to update app_settings" ON public.app_settings;
CREATE POLICY "Allow authenticated users to update app_settings"
ON public.app_settings FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert app_settings" ON public.app_settings;
CREATE POLICY "Allow authenticated users to insert app_settings"
ON public.app_settings FOR INSERT
WITH CHECK (true);

-- Enable realtime for instant UI updates
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;

-- Create RPC function for secure updates
DROP FUNCTION IF EXISTS public.secure_update_app_settings(jsonb, text);
CREATE OR REPLACE FUNCTION public.secure_update_app_settings(
  p_updates jsonb,
  p_secret text
)
RETURNS TABLE(success boolean, message text) AS $$
DECLARE
  v_item jsonb;
  v_key text;
  v_value jsonb;
BEGIN
  -- Validate secret key
  IF p_secret != 'my_super_secret_developer_key_2026' THEN
    RETURN QUERY SELECT false, 'Unauthorized: Invalid secret key'::text;
    RETURN;
  END IF;

  -- Process each update
  FOR v_item IN SELECT jsonb_array_elements(p_updates)
  LOOP
    v_key := v_item->>'setting_key';
    v_value := v_item->'setting_value';
    
    -- Upsert the setting
    INSERT INTO public.app_settings (setting_key, setting_value, updated_at)
    VALUES (v_key, v_value, now())
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
      setting_value = v_value,
      updated_at = now();
  END LOOP;

  RETURN QUERY SELECT true, 'Settings updated successfully'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default settings
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES 
    ('feature_kcet', 'true'::jsonb, 'Enable KCET Predictor features'),
    ('feature_comedk', 'false'::jsonb, 'Enable COMEDK Predictor features'),
    ('feature_ads', 'false'::jsonb, 'Enable Ads on the platform')
ON CONFLICT (setting_key) DO NOTHING;
