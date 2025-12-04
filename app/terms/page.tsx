"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

export default function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050B13]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("terms.back_to_home")}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[20px] bg-card dark:bg-surface-elevated p-8 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_0_20px_rgba(0,0,0,0.45)]"
        >
          <h1 className="mb-6 text-4xl font-bold text-foreground">
            {t("terms.title")}
          </h1>
          
          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_1_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_1_item_1")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_1_item_2")}
              </p>
              <p className="text-muted-foreground">
                {t("terms.section_1_item_3")}
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_2_title")}
              </h2>
              <p className="text-muted-foreground font-medium mb-2">
                {t("terms.section_2_subtitle_1")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-2">
                <li>{t("terms.section_2_item_1")}</li>
                <li>{t("terms.section_2_item_2")}</li>
                <li>{t("terms.section_2_item_3")}</li>
                <li>{t("terms.section_2_item_4")}</li>
                <li>{t("terms.section_2_item_5")}</li>
              </ul>
              <p className="text-muted-foreground">
                {t("terms.section_2_item_6")}
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_3_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_3_item_1")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_3_item_2")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_3_item_3")}
              </p>
              <p className="text-muted-foreground">
                {t("terms.section_3_item_4")}
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_4_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_4_item_1")}
              </p>
              <p className="text-muted-foreground font-medium mb-2">
                {t("terms.section_4_subtitle_1")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-2">
                <li>{t("terms.section_4_item_2")}</li>
                <li>{t("terms.section_4_item_3")}</li>
                <li>{t("terms.section_4_item_4")}</li>
                <li>{t("terms.section_4_item_5")}</li>
                <li>{t("terms.section_4_item_6")}</li>
              </ul>
              <p className="text-muted-foreground">
                {t("terms.section_4_item_7")}
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_5_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_5_item_1")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_5_item_2")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_5_item_3")}
              </p>
              <p className="text-muted-foreground">
                {t("terms.section_5_item_4")}
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_6_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_6_item_1")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_6_item_2")}
              </p>
              <p className="text-muted-foreground">
                {t("terms.section_6_item_3")}
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_7_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_7_item_1")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_7_item_2")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_7_item_3")}
              </p>
              <p className="text-muted-foreground">
                {t("terms.section_7_item_4")}
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_8_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_8_item_1")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_8_item_2")}
              </p>
              <p className="text-muted-foreground font-medium mb-2">
                {t("terms.section_8_subtitle_1")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-2">
                <li>{t("terms.section_8_item_3")}</li>
                <li>{t("terms.section_8_item_4")}</li>
                <li>{t("terms.section_8_item_5")}</li>
              </ul>
              <p className="text-muted-foreground">
                {t("terms.section_8_item_6")}
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_9_title")}
              </h2>
              <p className="text-muted-foreground font-medium mb-2">
                {t("terms.section_9_subtitle_1")}
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-2">
                <li>{t("terms.section_9_item_1")}</li>
                <li>{t("terms.section_9_item_2")}</li>
                <li>{t("terms.section_9_item_3")}</li>
                <li>{t("terms.section_9_item_4")}</li>
              </ul>
              <p className="text-muted-foreground">
                {t("terms.section_9_item_5")}
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_10_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_10_item_1")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_10_item_2")}
              </p>
              <p className="text-muted-foreground">
                {t("terms.section_10_item_3")}
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_11_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_11_item_1")}
              </p>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_11_item_2")}
              </p>
              <p className="text-muted-foreground">
                {t("terms.section_11_item_3")}
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                {t("terms.section_12_title")}
              </h2>
              <p className="text-muted-foreground mb-2">
                {t("terms.section_12_text")}
              </p>
              <a
                href={`mailto:${t("terms.section_12_email")}`}
                className="text-primary hover:underline"
              >
                {t("terms.section_12_email")}
              </a>
            </section>

            {/* Last Updated */}
            <section>
              <p className="text-sm text-muted-foreground mt-8">
                {t("terms.last_updated")}
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
