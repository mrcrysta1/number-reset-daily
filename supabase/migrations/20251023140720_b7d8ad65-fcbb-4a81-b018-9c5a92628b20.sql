-- Fix function search_path security issue
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
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;