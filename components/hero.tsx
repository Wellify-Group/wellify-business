"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { ArrowRight, Play } from "lucide-react";
import { FeatureCarousel } from "./feature-carousel";
import Link from "next/link";

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 pt-24 text-foreground sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-20 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-12 -z-10 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500/15 via-fuchsia-500/10 to-sky-400/10 blur-3xl opacity-20" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-72 w-full bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 blur-3xl opacity-20" />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 text-center lg:flex-row lg:items-center lg:text-left">
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[4.2rem]"
          >
            {t<string>("landing_hero_main_title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground sm:text-xl lg:mx-0"
          >
            {t<string>("landing_hero_main_desc")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
          >
            <Link href="/login" className="inline-block">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                className="group flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t<string>("landing_btn_create_director")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
            </Link>

            <Link href="/#features" className="inline-block">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                className="glass-card flex items-center gap-2 bg-card px-7 py-3 text-base font-medium text-card-foreground transition-colors hover:bg-card/80"
            >
              <Play className="h-4 w-4" />
              {t<string>("landing_btn_how_it_works")}
            </motion.button>
            </Link>
          </motion.div>
        </div>

        <div className="flex w-full flex-1 max-w-md justify-center lg:max-w-lg lg:justify-end">
          <FeatureCarousel />
        </div>
      </div>
    </section>
  );
}

