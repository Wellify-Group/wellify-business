"use client";

import { useSubscriptionStatus } from "@/lib/hooks/use-subscription";
import { SubscriptionButton } from "./subscription-button";

interface ProtectedBySubscriptionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedBySubscription({
  children,
  fallback,
}: ProtectedBySubscriptionProps) {
  const { isActive, loading } = useSubscriptionStatus();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка подписки...</p>
        </div>
      </div>
    );
  }

  if (!isActive) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Требуется подписка
            </h2>
            <p className="text-muted-foreground">
              Для доступа к этому разделу необходимо оформить подписку
            </p>
          </div>
          <SubscriptionButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

















