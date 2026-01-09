import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.RENDER_API_URL || '';

// Логгер для Next.js route
const logger = {
  error: (msg: string, ...args: any[]) => console.error(`[Stripe Webhook] ${msg}`, ...args),
  info: (msg: string, ...args: any[]) => console.log(`[Stripe Webhook] ${msg}`, ...args),
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  try {
    // Обрабатываем события локально и обновляем БД через backend API
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!subscriptionId) {
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const email = session.customer_details?.email || session.customer_email;

        // Обновляем подписку через backend API (используем admin endpoint или прямой запрос)
        // ВАЖНО: Для webhook нужен специальный токен или endpoint без аутентификации
        // Пока делаем прямой запрос к БД через backend (в production нужен admin токен)
        try {
          if (API_URL) {
            // Находим пользователя по email через backend
            // Затем обновляем подписку
            // Это временное решение - в production нужен admin endpoint
            logger.info(`Checkout completed for customer ${customerId}, subscription ${subscriptionId}`);
          }
        } catch (dbError) {
          logger.error('Failed to update subscription in database', dbError);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
        // Обновляем через backend API
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info(`Subscription deleted: ${subscription.id}`);
        // Обновляем через backend API
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}















