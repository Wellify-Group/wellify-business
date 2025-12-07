-- Migration: Add fields to profiles table for director registration
-- Execute this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Add columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comments
COMMENT ON COLUMN public.profiles.first_name IS 'User first name';
COMMENT ON COLUMN public.profiles.last_name IS 'User last name';
COMMENT ON COLUMN public.profiles.middle_name IS 'User middle name';
COMMENT ON COLUMN public.profiles.birth_date IS 'User date of birth';
COMMENT ON COLUMN public.profiles.role IS 'User role: director, manager, employee';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number';

