"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { TrendingUp, Smartphone, Settings, MessageSquare } from "lucide-react";

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    {
      id: "auto-analysis",
      title: t("features.autoAnalysis.title"),
      description: t("features.autoAnalysis.description"),
      icon: TrendingUp,
      className: "col-span-1 sm:col-span-2",
      visual: "graph",
      iconColor: "text-blue-400",
    },
    {
      id: "mobile-first",
      title: t("features.mobileFirst.title"),
      description: t("features.mobileFirst.description"),
      icon: Smartphone,
      className: "col-span-1 sm:row-span-2",
      visual: "phone",
      iconColor: "text-purple-400",
    },
    {
      id: "zero-setup",
      title: t("features.zeroConfig.title"),
      description: t("features.zeroConfig.description"),
      icon: Settings,
      className: "col-span-1",
      visual: "settings",
      iconColor: "text-emerald-400",
    },
    {
      id: "telegram-alerts",
      title: t("features.telegramAlerts.title"),
      description: t("features.telegramAlerts.description"),
      icon: MessageSquare,
      className: "col-span-1",
      visual: "telegram",
      iconColor: "text-cyan-400",
    },
  ];

  return (
    <section id="features" className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="mb-16 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          {t("features.title")}
        </motion.h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ scale: 1.01 }}
                className={`glass-card group relative overflow-hidden p-8 transition-all ${feature.className}`}
              >
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-lg border border-border/50 bg-card/40 p-3 backdrop-blur-sm">
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="mb-2 text-xl font-bold tracking-tight text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  {feature.visual === "graph" && (
                    <div className="mt-6 h-32 rounded-lg border border-border/50 bg-muted/20 p-4 backdrop-blur-sm">
                      <svg
                        viewBox="0 0 100 60"
                        className="h-full w-full"
                        preserveAspectRatio="none"
                      >
                        <polyline
                          points="0,50 20,40 40,45 60,30 80,35 100,25"
                          fill="none"
                          stroke="hsl(var(--foreground))"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                  {feature.visual === "phone" && (
                    <div className="mt-6 flex justify-center">
                      <div className="h-32 w-20 rounded-2xl border-4 border-border/50 bg-card/40 p-2 shadow-inner backdrop-blur-sm">
                        <div className="h-full rounded-lg bg-muted/20" />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
