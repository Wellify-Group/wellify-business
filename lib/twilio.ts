/**
 * Centralized Twilio client helper
 * 
 * This module provides a single point of access to Twilio services.
 * We use Twilio ONLY for SMS phone verification, NOT for email.
 * 
 * Email verification and password reset are handled by Supabase.
 */

import twilio from "twilio";

/**
 * Get Twilio client instance
 * Uses Account SID + Auth Token (standard authentication method)
 * 
 * @returns Twilio client instance or null if env vars are missing
 */
export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error("[twilio] Missing Twilio environment variables", {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
    });
    return null;
  }

  return twilio(accountSid, authToken);
}

/**
 * Get Twilio Verify Service SID from environment
 * 
 * @returns Verify Service SID or null if not configured
 */
export function getVerifyServiceSid(): string | null {
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  
  if (!verifyServiceSid) {
    console.error("[twilio] Missing TWILIO_VERIFY_SERVICE_SID");
    return null;
  }

  return verifyServiceSid;
}

/**
 * Twilio configuration constants
 * 
 * These should be set in your .env.local or Vercel environment variables:
 * 
 * Required:
 * - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 * - TWILIO_VERIFY_SERVICE_SID: Your Twilio Verify Service SID (for SMS verification)
 * 
 * Optional (for future use):
 * - TWILIO_MESSAGING_SERVICE_SID: For sending other SMS messages
 * - TWILIO_PHONE_NUMBER: For sending SMS from a specific number
 * 
 * IMPORTANT:
 * - Do NOT use Twilio for email verification (use Supabase instead)
 * - Do NOT use Authy (it's deprecated/expensive)
 * - Only use ONE Verify Service for WELLIFY Business
 */
