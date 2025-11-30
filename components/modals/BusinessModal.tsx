"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useBusinessModalStore } from "@/lib/useBusinessModalStore";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

export function BusinessModal() {
  const { isOpen, modalData, closeModal } = useBusinessModalStore();
  const { t } = useLanguage();

  // Закрытие по ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeModal]);

  if (!modalData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-3xl bg-white border border-black/5 shadow-[0_32px_120px_rgba(15,23,42,0.18)] text-neutral-900 dark:bg-neutral-950/90 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_32px_120px_rgba(0,0,0,0.85)] dark:text-neutral-50 px-10 py-8 pointer-events-auto"
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute right-5 top-5 text-neutral-400 hover:text-neutral-200 dark:hover:text-neutral-200 transition-colors"
                aria-label="Закрыть модальное окно"
                tabIndex={0}
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="flex flex-col gap-6">
                {/* Icon and Title */}
                <div className="flex items-start gap-4">
                  {modalData.icon && (
                    <div className="flex-shrink-0">
                      {modalData.icon}
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                      {modalData.title}
                    </h2>
                    {modalData.description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {modalData.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Problems */}
                {modalData.features && modalData.features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                      Проблемы
                    </h3>
                    <ul className="space-y-2">
                      {modalData.features.map((feature, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {feature}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* How WELLIFY helps */}
                {modalData.functions && modalData.functions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-3">
                      Как помогает WELLIFY
                    </h3>
                    <ul className="space-y-2">
                      {modalData.functions.map((func, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (modalData.features?.length || 0) * 0.05 + index * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {func}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <div className="mt-2">
                  <Link
                    href="/register"
                    onClick={closeModal}
                    className="block"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02, y: -0.5 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center justify-center w-full rounded-full bg-white text-neutral-950 dark:bg-neutral-50 dark:text-neutral-950 px-6 py-3 text-sm font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_24px_80px_rgba(0,0,0,0.7)] hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {t("landing_btn_create_director")}
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
