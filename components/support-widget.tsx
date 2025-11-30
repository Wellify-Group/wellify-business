"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { Collapse } from "@/components/ui/collapse";

export function SupportWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { isSupportOpen, toggleSupport } = useStore();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  
  // Hide floating button on dashboard pages
  const isDashboard = pathname?.startsWith('/dashboard');

  const faqs = [
    { key: "location", question: t("support.faq_location"), answer: t("support.faq_location_ans") },
    { key: "pin", question: t("support.faq_pin"), answer: t("support.faq_pin_ans") },
    { key: "billing", question: t("support.faq_billing"), answer: t("support.faq_billing_ans") },
  ];

  const handleTelegramClick = () => {
    window.open("https://t.me/shiftflow_support", "_blank");
  };

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSupportOpen) {
        toggleSupport();
      }
    };
    if (isSupportOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isSupportOpen, toggleSupport]);

  return (
    <>
      {/* Launcher Button - Only show if NOT on dashboard */}
      {!isDashboard && (
        <motion.button
          onClick={toggleSupport}
          style={{ 
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            left: 'auto',
            top: 'auto',
            zIndex: 9999
          }}
          className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 relative"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={!isSupportOpen ? {
            scale: [1, 1.05, 1],
          } : {}}
          transition={!isSupportOpen ? {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          } : {}}
        >
          <AnimatePresence mode="wait">
            {isSupportOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="message"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <Send className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}

      {/* Premium Support Window */}
      <AnimatePresence>
        {isSupportOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed z-[9999] bottom-6 right-6 w-[340px] max-h-[420px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-white/40 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header with Icon and Title */}
            <div className="relative p-5 pb-4">
              {/* Close Button */}
              <button
                onClick={toggleSupport}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
              </button>

              {/* Icon and Title */}
              <div className="flex items-start gap-3 pr-8">
                <div className="flex-shrink-0 p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    {t("support.title")}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {t("support.subtitle")}
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-2 scrollbar-hide">
              <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wide">
                {t("support.quick_answers")}
              </h4>
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl bg-black/3 dark:bg-white/5 overflow-hidden transition-all hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === faq.key ? null : faq.key)
                    }
                    className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors"
                  >
                    <span className="flex-1 pr-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {faq.question}
                    </span>
                    {expandedFaq === faq.key ? (
                      <ChevronUp className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                    )}
                  </button>
                  <Collapse isOpen={expandedFaq === faq.key}>
                    <div className="px-4 pb-3 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  </Collapse>
                </motion.div>
              ))}
            </div>

            {/* Footer - CTA Button */}
            <div className="border-t border-white/20 dark:border-white/10 p-5 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTelegramClick}
                className="w-full rounded-full bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-200 px-5 py-3 text-sm font-semibold text-white dark:text-zinc-900 shadow-lg transition-all hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>{t("support.btn_telegram")}</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
