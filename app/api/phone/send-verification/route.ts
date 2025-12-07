import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import twilio from 'twilio';

const PhoneVerificationSchema = z.object({
  phone: z
    .string()
    .min(8, 'Phone is too short')
    .max(20, 'Phone is too long'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ВАЖНО: валидируем только phone, НИКАКОГО password
    const { phone } = PhoneVerificationSchema.parse(body);

    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const apiKey = process.env.TWILIO_API_KEY!;
    const apiSecret = process.env.TWILIO_API_SECRET!;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

    if (!accountSid || !apiKey || !apiSecret || !verifyServiceSid) {
      throw new Error('Twilio credentials are not configured');
    }

    const client = twilio(apiKey, apiSecret, { accountSid });

    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: phone,
        channel: 'sms',
      });

    return NextResponse.json({
      success: true,
      status: verification.status,
    });
  } catch (error: any) {
    console.error('[phone/send-verification] error:', error);

    return NextResponse.json(
      {
        error: 'Twilio verification failed',
        message: error?.message ?? 'Unknown error',
        code: error?.code ?? null,
        moreInfo: error?.moreInfo ?? null,
        details: error?.details ?? {},
      },
      { status: 500 },
    );
  }
}
