"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { Collapse } from "@/components/ui/collapse";

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

export function SupportWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { isSupportOpen, toggleSupport } = useStore();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
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

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: inputMessage.trim(),
        sender: 'user',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage("");

      // Auto-reply after 1 second
      setTimeout(() => {
        const systemMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: t("support.auto_reply"),
          sender: 'system',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, systemMessage]);
      }, 1000);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
            className="fixed z-[9999] bottom-6 right-6 w-[360px] max-h-[520px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-white/40 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header with Icon and Title */}
            <div className="relative p-5 pb-4 flex-shrink-0">
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

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-5 space-y-4 scrollbar-hide" ref={chatContainerRef}>
              {/* FAQ Section */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wide">
                  {t("support.quick_answers")}
                </h4>
                <div className="space-y-2">
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
              </div>

              {/* Chat Section */}
              {messages.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-3 uppercase tracking-wide">
                    Чат
                  </h4>
                  <div className="space-y-2">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                            msg.sender === 'user'
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                              : 'bg-black/5 dark:bg-white/10 text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          <p className="break-words leading-relaxed">{msg.text}</p>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Input and Telegram Button */}
            <div className="border-t border-white/20 dark:border-white/10 p-4 space-y-3 flex-shrink-0">
              {/* Message Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={t("support.input_placeholder")}
                  className="flex-1 rounded-full border border-white/40 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="h-9 w-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  aria-label={t("support.btn_send")}
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Telegram Button */}
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
