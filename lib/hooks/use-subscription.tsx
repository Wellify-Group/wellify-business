"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
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
  const supabase = createBrowserSupabaseClient();

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
        const { data, error } = await supabase
          .from("user_subscriptions")
          .select("status, current_period_end")
          .eq("user_id", user!.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows returned, which is fine
          console.error("Subscription fetch error:", error);
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

    // Subscribe to real-time updates
    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_subscriptions",
          filter: `user_id=eq.${user!.id}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  return subscription;
}















