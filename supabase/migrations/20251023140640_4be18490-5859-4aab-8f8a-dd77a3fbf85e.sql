-- Create numbers table
CREATE TABLE public.numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.numbers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read numbers (public access)
CREATE POLICY "Anyone can read numbers"
  ON public.numbers
  FOR SELECT
  USING (true);

-- Create index for performance
CREATE INDEX idx_numbers_used ON public.numbers(used);
CREATE INDEX idx_numbers_last_used_at ON public.numbers(last_used_at);

-- Create function to check if number should be reset (24h+ and past 5 AM PKT)
CREATE OR REPLACE FUNCTION should_reset_number(last_used TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
  -- If never used, no reset needed
  IF last_used IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if 24 hours have passed
  IF (now() - last_used) < INTERVAL '24 hours' THEN
    RETURN false;
  END IF;
  
  -- Convert current time to Pakistan time and check if it's past 5 AM
  -- Pakistan is UTC+5
  DECLARE
    pkt_hour INTEGER;
  BEGIN
    pkt_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE 'Asia/Karachi'));
    RETURN pkt_hour >= 5;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;