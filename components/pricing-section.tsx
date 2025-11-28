"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import Link from "next/link";
import { Check } from "lucide-react";

export function PricingSection() {
  const { t, language } = useLanguage();

  const plans = [
    {
      name: "Free",
      price: language === "ua" || language === "ru" ? "0 ₴" : "$0",
      period: "/mo",
      features: [
        t("pricing.free.feature1"),
        t("pricing.free.feature2"),
        t("pricing.free.feature3"),
      ],
      buttonText: t("pricing.startNow"),
      highlight: false,
    },
    {
      name: "Pro",
      price: language === "ua" || language === "ru" ? "499 ₴" : "$9",
      period: "/mo",
      features: [
        t("pricing.pro.feature1"),
        t("pricing.pro.feature2"),
        t("pricing.pro.feature3"),
      ],
      buttonText: t("pricing.startNow"),
      highlight: true,
    },
  ];

  return (
    <section id="pricing" className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mb-16 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          {t("pricing.title")}
        </motion.h2>

        <div className="grid gap-8 sm:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 20 }}
              className={`glass-card relative p-8 transition-all ${
                plan.highlight
                  ? "scale-105"
                  : ""
              }`}
            >
              {/* Gradient Glow for Pro */}
              {plan.highlight && (
                <div className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-50" />
              )}

              {/* Badge */}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                  {t("pricing.recommended")}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-card-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-card-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                      <Check className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full rounded-lg px-4 py-3 text-base font-semibold transition-all ${
                    plan.highlight
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                      : "border border-border bg-background text-card-foreground hover:bg-muted"
                  }`}
                >
                  {plan.buttonText}
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
