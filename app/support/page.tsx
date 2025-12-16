"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { appConfig } from "@/lib/config/appConfig";

export default function SupportPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050B13]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("support_page.back_to_home")}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="rounded-[20px] bg-card dark:bg-surface-elevated p-8 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_0_20px_rgba(0,0,0,0.45)]">
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              {t("support_page.title")}
            </h1>
            <p className="mb-8 text-muted-foreground">
              {t("support_page.subtitle")}
            </p>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              <motion.a
                href={`mailto:${t("support_page.email_address")}`}
                whileHover={{ scale: 1.02, y: -2 }}
                className="block rounded-[20px] bg-card dark:bg-surface-elevated p-6 border border-border dark:border-border shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_0_20px_rgba(0,0,0,0.45)] cursor-pointer transition-all hover:border-primary/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {t("support_page.email_support_title")}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t("support_page.email_support_desc")}
                </p>
                <span className="text-sm text-primary hover:underline">
                  {t("support_page.email_address")}
                </span>
              </motion.a>

              <motion.a
                href={`https://t.me/${appConfig.telegramBotUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, y: -2 }}
                className="block rounded-[20px] bg-card dark:bg-surface-elevated p-6 border border-border dark:border-border shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_0_20px_rgba(0,0,0,0.45)] cursor-pointer transition-all hover:border-primary/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {t("support_page.telegram_bot_title")}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t("support_page.telegram_bot_desc")}
                </p>
                <span className="text-sm text-primary hover:underline">
                  {t("support_page.telegram_username")}
                </span>
              </motion.a>
            </div>
          </div>

          <div className="rounded-[20px] bg-card dark:bg-surface-elevated p-8 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_0_20px_rgba(0,0,0,0.45)]">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              {t("support_page.faq_title")}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  {t("support_page.faq_1_question")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("support_page.faq_1_answer")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  {t("support_page.faq_2_question")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("support_page.faq_2_answer")}
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  {t("support_page.faq_3_question")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("support_page.faq_3_answer")}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}















