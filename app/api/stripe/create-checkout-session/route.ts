// app/api/stripe/create-checkout-session/route.ts (ФИНАЛЬНЫЙ КОД: ИСПОЛЬЗУЕМ ВСЕ 4 PRICE ID)

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/admin"; // Для Admin Client
import { serverConfig } from "@/lib/config/serverConfig.server";
import { createServerSupabaseClient } from "@/lib/supabase/server"; // Для аутентификации пользователя

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Для обеспечения актуальности ключей

export async function POST(request: NextRequest) {
  // Определяем среду Vercel
  const isProduction = process.env.VERCEL_ENV === 'production';

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
      console.error("[Stripe] Missing config: Secret Keys are not set in Vercel.");
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
    // Получаем пользователя, используя обычный серверный клиент (пользовательский токен)
    const supabase = await createServerSupabaseClient(); 
    
    const {
      data: { user },
    } = await supabase.auth.getUser(); 

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

    // Инициализация Admin Client для операций с БД (для доступа к user_subscriptions)
    const supabaseAdmin = createAdminSupabaseClient(); // Используем настроенный Admin Client

    // Get or create Stripe customer
    let customerId: string;

    // Check if user already has a customer ID
    const { data: subscription } = await supabaseAdmin // Используем Admin Client
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await supabaseAdmin.from("user_subscriptions").upsert({ // Используем Admin Client
        user_id: user.id,
        stripe_customer_id: customerId,
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