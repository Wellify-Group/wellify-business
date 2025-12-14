"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { Home } from "lucide-react";
import { Logo } from "@/components/logo";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-md"
      >
        <div className="flex justify-center mb-4">
          <Logo href="/" size={64} showText={true} />
        </div>
        
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="text-2xl font-semibold text-foreground">
          {t<string>("not_found_title") || "Страница не найдена"}
        </h2>
        <p className="text-muted-foreground">
          {t<string>("not_found_description") || "К сожалению, запрашиваемая страница не существует или была перемещена."}
        </p>
        
        <div className="pt-4">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-[20px] bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shadow-[var(--shadow-floating)]"
            >
              <Home className="h-4 w-4" />
              {t<string>("not_found_back_home") || "На главную"}
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}















