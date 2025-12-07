-- Migration: Add phone column to profiles table
-- Execute this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Add phone column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';

