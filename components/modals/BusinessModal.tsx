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
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-2xl rounded-[20px] bg-white dark:bg-zinc-900 p-8 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)] pointer-events-auto"
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Закрыть модальное окно"
                tabIndex={0}
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="space-y-6">
                {/* Icon and Title */}
                <div className="flex items-start gap-4">
                  {modalData.icon && (
                    <div className="flex-shrink-0 mt-1">
                      {modalData.icon}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      {modalData.title}
                    </h2>
                    <p className="text-muted-foreground text-base">
                      {modalData.description}
                    </p>
                  </div>
                </div>

                {/* Problems */}
                {modalData.features && modalData.features.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
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
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
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
                    <h3 className="text-lg font-semibold text-foreground mb-3">
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
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">
                            {func}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <div className="pt-4">
                  <Link
                    href="/register"
                    onClick={closeModal}
                    className="block"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-[20px] bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.2)]"
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

