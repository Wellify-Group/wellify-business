"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useBusinessModalStore } from "@/lib/useBusinessModalStore";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[10px]"
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
                "relative w-full max-w-[720px] rounded-[32px] px-6 py-6 md:px-10 md:py-9 border",
                "bg-card/95 text-card-foreground border-border shadow-[0_24px_80px_rgba(0,0,0,0.65)]",
                "backdrop-blur-[22px] transition-colors duration-300 pointer-events-auto"
              )}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute right-6 top-6 h-8 w-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 transition z-10"
                aria-label="Закрыть модальное окно"
                tabIndex={0}
              >
                <X className="h-4 w-4" />
              </button>

              {/* Content */}
              <div className="flex flex-col gap-8">
                {/* Icon and Title */}
                <div className="flex items-start gap-6">
                  {modalData.icon && (
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                      <div className="[&>div]:!bg-transparent [&>div]:!rounded-2xl [&>div]:!h-auto [&>div]:!w-auto [&>div]:!p-0 [&_svg]:!h-5 [&_svg]:!w-5 [&_svg]:!text-foreground">
                        {modalData.icon}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <h2 className="text-2xl md:text-[28px] font-semibold tracking-tight text-card-foreground leading-tight">
                      {modalData.title}
                    </h2>
                    {modalData.format && (
                      <p className="text-sm md:text-[15px] font-medium text-muted-foreground">
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
                    className="mt-4 text-sm md:text-[15px] leading-relaxed text-muted-foreground"
                  >
                    {modalData.description}
                  </motion.p>
                )}

                {/* Benefits */}
                {modalData.benefits && modalData.benefits.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    {modalData.benefits.map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + index * 0.05 }}
                        className="flex gap-3 items-start text-sm md:text-[15px] leading-snug"
                      >
                        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-card-foreground">
                            {benefit.label}
                          </h4>
                          <p className="mt-0.5 text-xs md:text-[13px] text-muted-foreground leading-relaxed">
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
                    className="mt-6 text-xs md:text-[13px] text-muted-foreground"
                  >
                    {modalData.howToStart}
                  </motion.p>
                )}

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="mt-8"
                >
                  <Link
                    href="/register"
                    onClick={closeModal}
                    className="block"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-12 md:h-[52px] rounded-full text-sm md:text-[15px] font-medium flex items-center justify-center bg-primary text-primary-foreground shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-primary/90 hover:shadow-[0_16px_55px_rgba(0,0,0,0.55)]"
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
