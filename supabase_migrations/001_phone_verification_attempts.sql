-- Migration: Create phone_verification_attempts table
-- Purpose: Track SMS verification attempts to prevent abuse and control costs
-- 
-- This table stores attempts to send SMS verification codes via Twilio.
-- We use it to enforce rate limiting:
-- - Max 1 SMS per 60 seconds per phone number
-- - Max 5 SMS per 24 hours per phone number per action

CREATE TABLE IF NOT EXISTS phone_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  action TEXT NOT NULL, -- 'signup', 'password_reset', 'phone_update', etc.
  attempts_count INTEGER NOT NULL DEFAULT 1,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per phone+action combination
  UNIQUE(phone, action)
);

-- Index for fast lookups by phone and action
CREATE INDEX IF NOT EXISTS idx_phone_verification_attempts_phone_action 
  ON phone_verification_attempts(phone, action);

-- Index for cleanup queries (find old records)
CREATE INDEX IF NOT EXISTS idx_phone_verification_attempts_last_sent 
  ON phone_verification_attempts(last_sent_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_phone_verification_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_phone_verification_attempts_updated_at
  BEFORE UPDATE ON phone_verification_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_verification_attempts_updated_at();

-- Row Level Security (RLS) - only service role can access
ALTER TABLE phone_verification_attempts ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (for admin operations)
CREATE POLICY "Service role can manage phone_verification_attempts"
  ON phone_verification_attempts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Cleanup function: remove records older than 7 days
-- This can be called periodically via a cron job or manually
CREATE OR REPLACE FUNCTION cleanup_old_phone_verification_attempts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM phone_verification_attempts
  WHERE last_sent_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

