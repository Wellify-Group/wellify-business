-- Migration: Create email_verifications table for custom token-based email confirmation
-- Execute this SQL in Supabase SQL Editor for both DEV and PRODUCTION projects

-- Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role can do anything (for admin operations)
CREATE POLICY "Service role can manage email_verifications"
  ON email_verifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can read their own verification records
CREATE POLICY "Users can view own email_verifications"
  ON email_verifications FOR SELECT
  USING (auth.uid() = user_id);

