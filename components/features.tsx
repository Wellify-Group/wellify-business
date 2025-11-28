"use client";

import { motion } from "framer-motion";
import { Clock, TrendingUp, Settings } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { TranslationTree } from "@/lib/translations";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export function Features() {
  const { t } = useLanguage();
  const features = t<TranslationTree["features"]>("features");

  const cards = [
    {
      icon: Clock,
      title: features.checkins.title,
      description: features.checkins.description,
      className: "col-span-1 sm:col-span-2",
    },
    {
      icon: TrendingUp,
      title: features.autoAnalysis.title,
      description: features.autoAnalysis.description,
      className: "col-span-1",
    },
    {
      icon: Settings,
      title: features.zeroConfig.title,
      description: features.zeroConfig.description,
      className: "col-span-1 sm:col-span-2",
    },
  ];

  return (
    <section
      id="features"
      className="relative px-4 py-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          {features.title}
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {cards.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-card/60 p-8 backdrop-blur-sm transition-all hover:border-border/80 hover:shadow-xl ${feature.className}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex rounded-lg border border-border bg-card/80 p-3 backdrop-blur-sm">
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}



