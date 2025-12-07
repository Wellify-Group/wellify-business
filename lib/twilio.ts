import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const apiKey = process.env.TWILIO_API_KEY!;
const apiSecret = process.env.TWILIO_API_SECRET!;
export const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

// клиент Twilio через API Key (рекомендованный способ)
export const twilioClient = twilio(apiKey, apiSecret, { accountSid });

