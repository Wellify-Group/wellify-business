-- Migration: Create support_messages table for Telegram chat integration
-- Execute this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('client', 'support')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_support_messages_client_id ON support_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role can manage all messages (for API routes)
CREATE POLICY "Service role can manage support messages"
  ON support_messages FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow anonymous inserts for client messages (via API with service role)
-- This is handled by service role policy above

-- Allow reads for authenticated users (optional, if needed in future)
-- For now, we'll rely on service role for all operations

