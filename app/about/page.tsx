"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { Footer } from "@/components/footer";
import { Zap, Shield, Globe } from "lucide-react";

export default function AboutPage() {
  const { t } = useLanguage();

  const values = [
    {
      icon: Zap,
      title: t("about.val_speed"),
      description: "30-second reports. No waiting, no delays.",
    },
    {
      icon: Shield,
      title: t("about.val_control"),
      description: "Full control over your business metrics and team performance.",
    },
    {
      icon: Globe,
      title: t("about.val_global"),
      description: "Access your business data from anywhere, anytime.",
    },
  ];

  return (
    <main className="relative min-h-screen bg-background pt-24">
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute inset-0 -z-20 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="pointer-events-none absolute left-1/4 top-1/4 -z-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 -z-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Section 1: Mission */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-6 text-5xl font-bold leading-tight tracking-tight text-card-foreground sm:text-6xl lg:text-7xl"
          >
            {t("about.about_title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
            className="text-xl text-muted-foreground sm:text-2xl"
          >
            {t("about.about_mission")}
          </motion.p>
        </div>
      </section>

      {/* Section 2: Stats/Values */}
      <section className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-3">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 260, damping: 20 }}
                  className="rounded-2xl border border-black/5 bg-white/60 p-8 shadow-lg backdrop-blur-xl transition-all hover:bg-white/10 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="mb-4 inline-flex rounded-lg border border-border/50 bg-card/40 p-3 backdrop-blur-sm">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-card-foreground">
                    {value.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
