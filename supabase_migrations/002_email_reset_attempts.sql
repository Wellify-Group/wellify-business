-- Migration: Create email_reset_attempts table
-- Purpose: Track password reset email attempts to prevent abuse
-- 
-- This table stores attempts to send password reset emails via Supabase.
-- We use it to enforce rate limiting:
-- - Max 1 email per 60 seconds per email address
-- - Max 5 emails per 24 hours per email address

CREATE TABLE IF NOT EXISTS email_reset_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempts_count INTEGER NOT NULL DEFAULT 1,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per email
  UNIQUE(email)
);

-- Index for fast lookups by email
CREATE INDEX IF NOT EXISTS idx_email_reset_attempts_email 
  ON email_reset_attempts(email);

-- Index for cleanup queries (find old records)
CREATE INDEX IF NOT EXISTS idx_email_reset_attempts_last_sent 
  ON email_reset_attempts(last_sent_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_reset_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_email_reset_attempts_updated_at
  BEFORE UPDATE ON email_reset_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_reset_attempts_updated_at();

-- Row Level Security (RLS) - only service role can access
ALTER TABLE email_reset_attempts ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (for admin operations)
CREATE POLICY "Service role can manage email_reset_attempts"
  ON email_reset_attempts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Cleanup function: remove records older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_email_reset_attempts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_reset_attempts
  WHERE last_sent_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

