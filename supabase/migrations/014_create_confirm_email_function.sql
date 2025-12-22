-- Migration: Create function to confirm user email
-- Execute this SQL in Supabase SQL Editor for both DEV and PRODUCTION projects

-- Function to confirm user email (sets email_confirmed_at)
CREATE OR REPLACE FUNCTION confirm_user_email(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update email_confirmed_at in auth.users
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = user_id_param;
END;
$$;

