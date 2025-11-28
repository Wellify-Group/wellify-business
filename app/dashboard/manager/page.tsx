"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/language-provider";
import { useStore } from "@/lib/store";
import { X, Building2, AlertCircle } from "lucide-react";

export default function ManagerPage() {
  const { t } = useLanguage();
  const { joinBusiness } = useStore();
  
  // Modal state
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  
  // Split Input state
  const [codeParts, setCodeParts] = useState<string[]>(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [codeError, setCodeError] = useState("");
  const [isCodeError, setIsCodeError] = useState(false);

  // Handle code block change
  const handleBlockChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    const newBlocks = [...codeParts];
    newBlocks[index] = digits;
    setCodeParts(newBlocks);
    setCodeError("");
    setIsCodeError(false);

    // Auto-focus next input when 4 digits entered
    if (digits.length === 4 && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste - auto-fill all boxes
  const handlePaste = (e: React.ClipboardEvent, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 16);
    
    if (digits.length > 0) {
      const newBlocks = ["", "", "", ""];
      for (let i = 0; i < 4; i++) {
        newBlocks[i] = digits.slice(i * 4, (i + 1) * 4);
      }
      setCodeParts(newBlocks);
      setCodeError("");
      setIsCodeError(false);
      
      const lastFilledIndex = Math.min(3, Math.floor((digits.length - 1) / 4));
      setTimeout(() => {
        inputRefs.current[lastFilledIndex]?.focus();
      }, 0);
    }
  };

  // Handle key down - backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && codeParts[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle join button click
  const handleJoin = () => {
    setCodeError("");
    setIsCodeError(false);
    
    // Validate all blocks are filled
    if (codeParts.some(block => block.length !== 4)) {
      setCodeError("Неверный код");
      setIsCodeError(true);
      setTimeout(() => setIsCodeError(false), 3000);
      return;
    }
    
    // Join parts with dashes
    const code = codeParts.join("-");
    
    // Call joinBusiness from store
    const success = joinBusiness(code);
    
    if (success) {
      // Close modal and reset
      setIsJoinModalOpen(false);
      setCodeParts(["", "", "", ""]);
      setCodeError("");
      setIsCodeError(false);
      // Refresh list would happen here if needed
    } else {
      // Show error with shake animation
      setCodeError("Неверный код");
      setIsCodeError(true);
      setTimeout(() => setIsCodeError(false), 3000);
    }
  };

  // Reset modal state when closing
  const handleCloseModal = () => {
    setIsJoinModalOpen(false);
    setCodeParts(["", "", "", ""]);
    setCodeError("");
    setIsCodeError(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
            {t("dashboard.manager_panel")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("dashboard.point_control")}
          </p>
        </div>
        <button
          onClick={() => setIsJoinModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Building2 className="h-4 w-4" />
          Присоединиться к организации
        </button>
      </div>

      {/* Join Organization Modal */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Присоединиться к организации
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Введите код компании
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Введите 16-значный код компании
                  </label>
                  <motion.div
                    className="flex gap-3 justify-center my-6"
                    animate={isCodeError ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {codeParts.map((block, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el }}
                        type="text"
                        inputMode="numeric"
                        value={block}
                        onChange={(e) => handleBlockChange(index, e.target.value)}
                        onPaste={(e) => handlePaste(e, index)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        maxLength={4}
                        className={`w-16 h-14 text-center text-xl font-mono font-bold bg-white dark:bg-neutral-900 border rounded-md focus:outline-none focus:ring-0 transition-all ${
                          isCodeError
                            ? "border-red-500 focus:border-red-600 text-red-500"
                            : "border-gray-300 dark:border-neutral-700 focus:border-gray-500 dark:focus:border-neutral-500 text-foreground"
                        }`}
                        placeholder="0000"
                      />
                    ))}
                  </motion.div>
                  
                  {codeError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400 text-center flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {codeError}
                    </motion.div>
                  )}
                </div>

                {/* Connect Button */}
                <motion.button
                  onClick={handleJoin}
                  disabled={codeParts.some(block => block.length !== 4)}
                  whileHover={{ scale: codeParts.every(block => block.length === 4) ? 1.01 : 1 }}
                  whileTap={{ scale: codeParts.every(block => block.length === 4) ? 0.99 : 1 }}
                  className="h-12 w-full rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Подключиться
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}