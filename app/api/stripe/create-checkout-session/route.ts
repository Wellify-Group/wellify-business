// app/api/stripe/create-checkout-session/route.ts (ФИНАЛЬНЫЙ КОД ДЛЯ ДВУХ СРЕД)

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/admin"; // Используем Admin Client
import { serverConfig } from "@/lib/config/serverConfig.server";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Определяем среду Vercel
  const isProduction = process.env.VERCEL_ENV === 'production';

  // !!! ШАГ 1: АДАПТИВНЫЙ ВЫБОР КЛЮЧЕЙ STRIPE И PRICE IDs !!!
  const STRIPE_SECRET = isProduction
    ? process.env.STRIPE_SECRET_KEY_MAIN 
    : process.env.STRIPE_SECRET_KEY_DEV;

  const PRICE_MONTHLY = isProduction
    ? process.env.STRIPE_PRICE_ID_MONTHLY_Main 
    : process.env.STRIPE_PRICE_ID_MONTHLY_Dev;

  const PRICE_YEARLY = isProduction
    ? process.env.STRIPE_PRICE_ID_YEARLY_Main
    : process.env.STRIPE_PRICE_ID_YEARLY_Dev;
  // !!! КОНЕЦ АДАПТИВНОГО ВЫБОРА !!!


  // !!! ШАГ 2: ЗАГЛУШКА ДЛЯ ПРЕДОТВРАЩЕНИЯ ОШИБКИ СБОРКИ !!!
  if (!STRIPE_SECRET || !PRICE_MONTHLY || !PRICE_YEARLY) {
      console.error(`[Stripe] Missing key. ENV: ${isProduction ? 'MAIN' : 'DEV'}. Returning 503.`);
      return NextResponse.json(
          { error: "Stripe is not fully configured for this environment." }, 
          { status: 503 }
      );
  }

  // Инициализация Stripe (теперь с корректным, не-undefined ключом)
  const stripe = new Stripe(STRIPE_SECRET, {
    apiVersion: "2023-10-16",
  });
  
  try {
    // !!! ШАГ 3: ИСПОЛЬЗУЕМ ADMIN CLIENT (для upsert Customer ID) !!!
    const supabaseAdmin = createAdminSupabaseClient();
    
    // Получаем текущего пользователя (ЗДЕСЬ НУЖЕН КЛИЕНТ БРАУЗЕРА/АУТЕНТИФИКАЦИИ, 
    // НО МЫ ИСПОЛЬЗУЕМ ADMIN ДЛЯ ПРАВ)
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(); // Используем Admin Client для проверки User

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planType } = body; 

    // !!! ШАГ 4: ВЫБОР PRICE ID !!!
    const priceId = planType === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY;
    
    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan type or missing price ID." }, { status: 400 });
    }

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
      // Предполагаем, что serverConfig.appBaseUrl также адаптивен
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