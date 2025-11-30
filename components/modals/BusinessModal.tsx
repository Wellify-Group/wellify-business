"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
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
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-3xl bg-neutral-950/95 dark:bg-neutral-950/95 backdrop-blur-xl border border-white/10 dark:border-white/10 shadow-[0_32px_120px_rgba(0,0,0,0.85)] text-neutral-50 px-10 py-10 pointer-events-auto"
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute right-6 top-6 text-neutral-400 hover:text-neutral-200 transition-colors z-10"
                aria-label="Закрыть модальное окно"
                tabIndex={0}
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="flex flex-col gap-8">
                {/* Icon and Title */}
                <div className="flex items-start gap-6">
                  {modalData.icon && (
                    <div className="flex-shrink-0 mt-1">
                      {modalData.icon}
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <h2 className="text-3xl font-bold text-neutral-50 leading-tight">
                      {modalData.title}
                    </h2>
                    {modalData.format && (
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {modalData.format}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                {modalData.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-base text-neutral-300 leading-relaxed"
                  >
                    {modalData.description}
                  </motion.p>
                )}

                {/* Benefits */}
                {modalData.benefits && modalData.benefits.length > 0 && (
                  <div className="space-y-4">
                    {modalData.benefits.map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        className="flex items-start gap-4"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-sm font-semibold text-neutral-50">
                            {benefit.label}
                          </h4>
                          <p className="text-sm text-neutral-400 leading-relaxed">
                            {benefit.text}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* How to Start */}
                {modalData.howToStart && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-neutral-400 italic"
                  >
                    {modalData.howToStart}
                  </motion.p>
                )}

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="pt-2"
                >
                  <Link
                    href="/register"
                    onClick={closeModal}
                    className="block"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center justify-center w-full rounded-full bg-white text-neutral-950 dark:bg-neutral-50 dark:text-neutral-950 px-8 py-4 text-base font-semibold shadow-[0_18px_60px_rgba(0,0,0,0.5)] hover:shadow-[0_24px_80px_rgba(0,0,0,0.7)] hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {t("landing_btn_create_director")}
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
