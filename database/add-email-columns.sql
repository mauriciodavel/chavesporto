-- SQL to add email tracking columns to key_history table
-- Run this in Supabase SQL Editor

ALTER TABLE public.key_history
ADD COLUMN IF NOT EXISTS email_first_alert_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Verify columns were created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'key_history' 
AND column_name LIKE 'email%'
ORDER BY column_name;
