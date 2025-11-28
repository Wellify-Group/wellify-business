"use client";

import { useState } from "react";
import { Loader } from "lucide-react";
import { motion } from "framer-motion";

interface SubscriptionButtonProps {
  planType?: "monthly" | "yearly";
  className?: string;
}

export function SubscriptionButton({ planType = "monthly", className = "" }: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      alert(error.message || "Ошибка при оформлении подписки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleSubscribe}
      disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Loader className="h-4 w-4 animate-spin" />
          Загрузка...
        </>
      ) : (
        "Оформить подписку"
      )}
    </motion.button>
  );
}

