"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export default function PrivacyPage() {
  const { t, language } = useLanguage();

  const formatDate = (date: Date) => {
    const locales: Record<string, string> = {
      en: "en-US",
      ua: "uk-UA",
      ru: "ru-RU",
    };
    return date.toLocaleDateString(locales[language] || "ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("privacy.back_to_home")}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] bg-white dark:bg-zinc-900 p-8 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)]"
        >
          <h1 className="mb-6 text-4xl font-bold text-foreground">
            {t("privacy.title")}
          </h1>
          
          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.section_1_title")}
              </h2>
              <p className="text-muted-foreground">
                {t("privacy.section_1_text")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.section_2_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("privacy.section_2_text")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>{t("privacy.section_2_item_1")}</li>
                <li>{t("privacy.section_2_item_2")}</li>
                <li>{t("privacy.section_2_item_3")}</li>
                <li>{t("privacy.section_2_item_4")}</li>
                <li>{t("privacy.section_2_item_5")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.section_3_title")}
              </h2>
              <p className="text-muted-foreground">
                {t("privacy.section_3_text")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>{t("privacy.section_3_item_1")}</li>
                <li>{t("privacy.section_3_item_2")}</li>
                <li>{t("privacy.section_3_item_3")}</li>
                <li>{t("privacy.section_3_item_4")}</li>
                <li>{t("privacy.section_3_item_5")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.section_4_title")}
              </h2>
              <p className="text-muted-foreground">
                {t("privacy.section_4_text")}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.section_5_title")}
              </h2>
              <p className="text-muted-foreground">
                {t("privacy.section_5_text")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>{t("privacy.section_5_item_1")}</li>
                <li>{t("privacy.section_5_item_2")}</li>
                <li>{t("privacy.section_5_item_3")}</li>
                <li>{t("privacy.section_5_item_4")}</li>
                <li>{t("privacy.section_5_item_5")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("privacy.section_6_title")}
              </h2>
              <p className="text-muted-foreground">
                {t("privacy.section_6_text")}{" "}
                <a
                  href={`mailto:${t("privacy.section_6_email")}`}
                  className="text-primary hover:underline"
                >
                  {t("privacy.section_6_email")}
                </a>
              </p>
            </section>

            <section>
              <p className="text-sm text-muted-foreground mt-8">
                {t("privacy.last_updated")} {formatDate(new Date())}
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}















