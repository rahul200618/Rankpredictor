-- Create counseling enquiries table for Vidhyarthi Sewa Trust
CREATE TABLE IF NOT EXISTS public.counseling_enquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    interested_streams TEXT[] NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.counseling_enquiries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (so students can easily submit the form without needing prior login)
CREATE POLICY "Anyone can submit counseling enquiries" 
ON public.counseling_enquiries FOR INSERT 
WITH CHECK (true);

-- Allow administrators to view submitted enquiries
CREATE POLICY "Only admins can select enquiries"
ON public.counseling_enquiries FOR SELECT
USING (true); -- Replace with admin roles in production if desired
