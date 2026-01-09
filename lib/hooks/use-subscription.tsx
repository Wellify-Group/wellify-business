"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "./use-auth";

interface SubscriptionStatus {
  isActive: boolean;
  status: string | null;
  currentPeriodEnd: Date | null;
  loading: boolean;
}

export function useSubscriptionStatus(): SubscriptionStatus {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    isActive: false,
    status: null,
    currentPeriodEnd: null,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setSubscription({
        isActive: false,
        status: null,
        currentPeriodEnd: null,
        loading: false,
      });
      return;
    }

    async function fetchSubscription() {
      try {
        const response = await api.getSubscription();
        const data = response.subscription;

        if (!data) {
          setSubscription({
            isActive: false,
            status: null,
            currentPeriodEnd: null,
            loading: false,
          });
          return;
        }

        const isActive =
          data &&
          (data.status === "active" || data.status === "trialing") &&
          data.current_period_end &&
          new Date(data.current_period_end) > new Date();

        setSubscription({
          isActive: !!isActive,
          status: data?.status || null,
          currentPeriodEnd: data?.current_period_end ? new Date(data.current_period_end) : null,
          loading: false,
        });
      } catch (error) {
        console.error("Subscription fetch error:", error);
        setSubscription({
          isActive: false,
          status: null,
          currentPeriodEnd: null,
          loading: false,
        });
      }
    }

    fetchSubscription();

    // Polling для обновлений (замена real-time subscriptions)
    const intervalId = setInterval(fetchSubscription, 30000); // Проверяем каждые 30 секунд

    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  return subscription;
}















