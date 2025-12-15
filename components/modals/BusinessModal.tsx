"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useBusinessModalStore } from "@/lib/useBusinessModalStore";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";
import { PrimaryButton } from "@/components/ui/button";

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
            className="fixed inset-0 z-50 backdrop-blur-md bg-black/40 dark:bg-black/60"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "relative w-full max-w-[540px] rounded-2xl px-5 py-5 md:px-7 md:py-7 border",
                "bg-card text-card-foreground border-[color:var(--color-border-strong)] dark:border-border",
                "shadow-[0_24px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.70)]",
                "backdrop-blur-[22px] transition-colors duration-300 pointer-events-auto"
              )}
            >
              {/* Верхняя брендированная полоска */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500 rounded-t-2xl"></div>
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 h-7 w-7 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 transition z-10"
                aria-label="Закрыть модальное окно"
                tabIndex={0}
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Content */}
              <div className="flex flex-col gap-5">
                {/* Icon and Title */}
                <div className="flex items-start gap-4">
                  {modalData.icon && (
                    <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-muted">
                      <div className="[&>div]:!bg-transparent [&>div]:!rounded-xl [&>div]:!h-auto [&>div]:!w-auto [&>div]:!p-0 [&_svg]:!h-4 [&_svg]:!w-4 [&_svg]:!text-foreground">
                        {modalData.icon}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-card-foreground leading-tight">
                      {modalData.title}
                    </h2>
                    {modalData.format && (
                      <p className="text-xs md:text-sm font-medium text-muted-foreground">
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
                    className="text-xs md:text-sm leading-relaxed text-muted-foreground"
                  >
                    {modalData.description}
                  </motion.p>
                )}

                {/* Benefits */}
                {modalData.benefits && modalData.benefits.length > 0 && (
                  <div className="grid grid-cols-1 gap-2.5">
                    {modalData.benefits.map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        whileHover={{ x: 2 }}
                        className="group flex gap-2.5 items-start leading-snug p-2.5 rounded-lg hover:bg-muted/50 dark:hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white flex-shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:shadow-[0_0_12px_rgba(37,99,235,0.5)]">
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs md:text-sm font-medium text-card-foreground">
                            {benefit.label}
                          </h4>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
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
                    className="text-xs text-muted-foreground"
                  >
                    {modalData.howToStart}
                  </motion.p>
                )}

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="mt-4"
                >
                  <Link
                    href="/register"
                    onClick={closeModal}
                    className="block"
                  >
                    <PrimaryButton className="w-full h-10 md:h-11 text-xs md:text-sm">
                      {t("landing_btn_create_director")}
                    </PrimaryButton>
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
