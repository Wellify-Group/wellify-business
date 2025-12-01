-- Supabase Migration: Support System Tables
-- Execute this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: support_sessions
-- One session = one client = one Telegram topic
CREATE TABLE IF NOT EXISTS support_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cid TEXT NOT NULL UNIQUE,              -- client id from website (localStorage)
  topic_id BIGINT,                       -- Telegram message_thread_id
  user_name TEXT,
  user_id TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table: support_messages
-- All messages from both client and support
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cid TEXT NOT NULL REFERENCES support_sessions(cid) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('user', 'support')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_read BOOLEAN DEFAULT FALSE          -- for support messages (to track unread)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_support_sessions_cid ON support_sessions(cid);
CREATE INDEX IF NOT EXISTS idx_support_sessions_topic_id ON support_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_cid ON support_messages(cid);
CREATE INDEX IF NOT EXISTS idx_support_messages_is_read ON support_messages(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

-- Row Level Security (RLS) - disable for now, we'll use service role
-- These tables are accessed server-side only via service role
ALTER TABLE support_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages DISABLE ROW LEVEL SECURITY;

