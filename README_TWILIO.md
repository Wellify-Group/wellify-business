# Twilio Configuration Guide

## Overview

WELLIFY Business uses Twilio **ONLY** for SMS phone verification. Email verification and password reset are handled by Supabase (free, no additional costs).

## Environment Variables

Add these to your `.env.local` (development) or Vercel environment variables (production):

```bash
# Required for Twilio SMS verification
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Optional (for future use):
```bash
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

## Twilio Console Setup

### 1. Create Verify Service

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Verify** → **Services**
3. Click **Create new Verify Service**
4. Name it: `WELLIFY Business SMS Verification`
5. Copy the **Service SID** (starts with `VA...`)
6. Add it to your environment variables as `TWILIO_VERIFY_SERVICE_SID`

### 2. Configure Phone Number (if using direct SMS)

If you plan to send SMS directly (not via Verify), you need a Twilio phone number:

1. Go to **Phone Numbers** → **Manage** → **Buy a number**
2. Choose a number with SMS capability
3. Copy the phone number and add to `TWILIO_PHONE_NUMBER` (optional)

### 3. Disable/Remove Unused Services

**IMPORTANT**: To minimize costs:

- ❌ **Do NOT use Authy** (deprecated/expensive)
- ❌ **Do NOT create multiple Verify Services** (use only one)
- ❌ **Do NOT use Twilio for email verification** (use Supabase instead)
- ✅ **Use only ONE Verify Service** for SMS phone verification

### 4. Set Rate Limits in Twilio Console

1. Go to your Verify Service settings
2. Configure:
   - **Code Length**: 6 digits (default)
   - **Code Expiry**: 10 minutes (default)
   - **Max Attempts**: 3-5 attempts per verification

## Rate Limiting in Application

Our application enforces additional rate limits to prevent abuse:

### Phone Verification (SMS):
- **Max 1 SMS per 60 seconds** per phone number
- **Max 5 SMS per 24 hours** per phone number per action
- Tracked in Supabase table: `phone_verification_attempts`

### Email Reset (Supabase):
- **Max 1 email per 60 seconds** per email address
- **Max 5 emails per 24 hours** per email address
- Tracked in Supabase table: `email_reset_attempts`

## Cost Optimization

### Current Setup:
- ✅ **SMS via Twilio Verify**: ~$0.05-0.10 per SMS (varies by country)
- ✅ **Email via Supabase**: FREE (included in Supabase plan)

### Estimated Monthly Costs:
- 100 SMS verifications/month: ~$5-10
- 1000 SMS verifications/month: ~$50-100

### Tips to Reduce Costs:
1. Enforce strict rate limiting (already implemented)
2. Use Supabase for email (already implemented)
3. Monitor usage in Twilio Console
4. Set up billing alerts in Twilio

## Database Migrations

Run these SQL migrations in Supabase SQL Editor:

1. `supabase_migrations/001_phone_verification_attempts.sql` - Creates table for tracking SMS attempts
2. `supabase_migrations/002_email_reset_attempts.sql` - Creates table for tracking email reset attempts

## Testing

### Test Phone Verification:
1. Use a real phone number in E.164 format: `+380671234567`
2. Request code via `/api/auth/phone/send-code`
3. Check SMS on your phone
4. Verify code via `/api/auth/phone/verify-code`

### Test Email Verification:
1. Use a real email address
2. Request confirmation via Supabase `signUp()`
3. Check email inbox
4. Click confirmation link
5. Verify status via `/api/auth/check-email`

## Troubleshooting

### "Server config error (Twilio)"
- Check that `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set
- Verify credentials in Twilio Console

### "Server config error (Twilio Verify Service)"
- Check that `TWILIO_VERIFY_SERVICE_SID` is set
- Verify Service SID in Twilio Console → Verify → Services

### "Too many attempts" (429 error)
- Rate limit exceeded
- Wait 60 seconds before retrying
- Or wait 24 hours if daily limit reached

### SMS not received
- Check phone number format (must be E.164: `+380...`)
- Verify Twilio account has sufficient balance
- Check Twilio Console → Monitor → Logs for errors

## Code Structure

All Twilio code is centralized in:
- `lib/twilio.ts` - Helper functions for Twilio client and config
- `app/api/auth/phone/send-code/route.ts` - Send SMS via Twilio Verify
- `app/api/auth/phone/verify-code/route.ts` - Verify SMS code via Twilio

**DO NOT** create new Twilio clients directly. Always use `lib/twilio.ts`.

