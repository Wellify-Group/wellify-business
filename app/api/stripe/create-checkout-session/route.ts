// app/api/stripe/create-checkout-session/route.ts (ФИНАЛЬНЫЙ КОД: ИСПОЛЬЗУЕМ ВСЕ 4 PRICE ID)

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { serverConfig } from "@/lib/config/serverConfig.server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Для обеспечения актуальности ключей

export async function POST(request: NextRequest) {
  // Определяем среду Cloudflare
  const isProduction = process.env.NODE_ENV === 'production';

  // !!! ШАГ 1: АДАПТИВНЫЙ ВЫБОР КЛЮЧЕЙ STRIPE И PRICE IDs !!!
  const STRIPE_SECRET = isProduction
    ? process.env.STRIPE_SECRET_KEY_MAIN || 'sk_live_DUMMY'
    : process.env.STRIPE_SECRET_KEY_DEV || 'sk_test_DUMMY';

  const PRICE_MONTHLY = isProduction
    ? process.env.STRIPE_PRICE_ID_MONTHLY_Main 
    : process.env.STRIPE_PRICE_ID_MONTHLY_Dev;

  const PRICE_YEARLY = isProduction
    ? process.env.STRIPE_PRICE_ID_YEARLY_Main
    : process.env.STRIPE_PRICE_ID_YEARLY_Dev;
  
  
  // !!! ШАГ 2: ПРОВЕРКА НАЛИЧИЯ КЛЮЧЕЙ В НАЧАЛЕ (для предотвращения 503/500) !!!
  if (!process.env.STRIPE_SECRET_KEY_MAIN && !process.env.STRIPE_SECRET_KEY_DEV) {
      console.error("[Stripe] Missing config: Secret Keys are not set in Cloudflare.");
      return NextResponse.json(
          { error: "Stripe configuration is incomplete. (Missing Secret Key)" }, 
          { status: 503 }
      );
  }
  
  // Инициализация Stripe
  const stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: "2023-10-16",
  });
  
  try {
    // Получаем токен из заголовков или cookies
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Получаем пользователя через backend API
    const userResponse = await fetch(`${API_URL}/api/auth/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = await userResponse.json();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planType } = body; 

    // ШАГ 3: ВЫБОР PRICE ID (Убеждаемся, что ID существует)
    const priceId = planType === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY;
    
    if (!priceId) {
      console.error("[Stripe] Missing Price ID for plan type:", planType);
      return NextResponse.json({ error: "Invalid plan type or missing price ID." }, { status: 400 });
    }

    // Get or create Stripe customer
    let customerId: string | undefined;

    // Check if user already has a customer ID через backend API
    const subscriptionResponse = await fetch(`${API_URL}/api/subscriptions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (subscriptionResponse.ok) {
      const { subscription } = await subscriptionResponse.json();
      if (subscription?.stripe_customer_id) {
        customerId = subscription.stripe_customer_id;
      }
    }

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database через backend API
      await fetch(`${API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stripe_customer_id: customerId,
        }),
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${serverConfig.appBaseUrl}/dashboard?success=true`, 
      cancel_url: `${serverConfig.appBaseUrl}/dashboard?canceled=true`,
      metadata: {
        user_id: user.id,
        email: user.email,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}