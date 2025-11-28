"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { motion } from "framer-motion";

export function BackButton() {
  const { t } = useLanguage();

  return (
    <Link href="/">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group fixed left-6 top-6 z-50 flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-xl transition-all hover:bg-card/90 hover:border-primary/50 sm:left-8 sm:top-8"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>{t("back_to_home")}</span>
      </motion.button>
    </Link>
  );
}

