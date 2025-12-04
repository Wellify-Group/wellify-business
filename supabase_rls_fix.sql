-- Fix RLS policy for profiles table INSERT operation
-- Execute this SQL in Supabase SQL Editor

-- Add policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- This policy allows authenticated users to insert a profile row
-- where the id matches their own user ID (auth.uid())

