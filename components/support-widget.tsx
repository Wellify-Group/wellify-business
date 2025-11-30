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
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleSupport}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
            
            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-50 bottom-6 right-6 w-[360px] max-h-[520px] rounded-[28px] md:rounded-[32px] bg-black/70 dark:bg-black/75 backdrop-blur-[22px] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
            {/* Header */}
            <div className="relative px-5 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4 flex-shrink-0">
              {/* Close Button */}
              <button
                onClick={toggleSupport}
                className="absolute top-4 right-4 md:top-5 md:right-5 h-8 w-8 rounded-full flex items-center justify-center bg-white/5 text-neutral-400 hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Title */}
              <div className="pr-10">
                <h3 className="text-base font-bold text-white mb-1">
                  {t("support.title")}
                </h3>
                <p className="text-xs md:text-[13px] text-neutral-400 dark:text-neutral-400 leading-snug">
                  Отвечаем в течение нескольких минут
                </p>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-5 md:px-6 space-y-4 scrollbar-hide pb-3 md:pb-4" ref={chatContainerRef}>
              {/* FAQ Section */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-300 mb-3 uppercase tracking-wide">
                  {t("support.quick_answers")}
                </h4>
                <div className="space-y-2 overflow-hidden rounded-2xl">
                  {faqs.map((faq, index) => (
                    <motion.div
                      key={faq.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-2xl bg-white/4 dark:bg-white/4 overflow-hidden transition-all hover:bg-white/6 dark:hover:bg-white/6"
                    >
                      <button
                        onClick={() =>
                          setExpandedFaq(expandedFaq === faq.key ? null : faq.key)
                        }
                        className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors"
                      >
                        <span className="flex-1 pr-3 text-sm font-medium text-neutral-100">
                          {faq.question}
                        </span>
                        {expandedFaq === faq.key ? (
                          <ChevronUp className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                        )}
                      </button>
                      <Collapse isOpen={expandedFaq === faq.key}>
                        <div className="px-4 pb-3 text-xs text-neutral-400 leading-relaxed">
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
                  <h4 className="text-xs font-semibold text-neutral-300 mb-3 uppercase tracking-wide">
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
                              ? 'bg-white text-neutral-900'
                              : 'bg-white/10 text-neutral-100'
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
            <div className="border-t border-white/10 px-5 py-4 md:px-6 md:py-5 space-y-3 flex-shrink-0">
              {/* Message Input */}
              <div className="mt-3 flex items-center gap-2 rounded-full bg-white/4 dark:bg-white/4 border border-white/10 px-4 py-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={t("support.input_placeholder")}
                  className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-transform duration-150 hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  aria-label={t("support.btn_send")}
                >
                  <Send className="h-4 w-4 text-neutral-900" />
                </button>
              </div>

              {/* Telegram Button */}
              <button
                onClick={handleTelegramClick}
                className="mt-3 w-full h-11 md:h-[44px] rounded-full bg-white text-neutral-900 text-sm md:text-[15px] font-medium flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.55)] hover:shadow-[0_14px_55px_rgba(0,0,0,0.7)] transition-all duration-200 hover:-translate-y-[1px]"
              >
                {t("support.btn_telegram")}
              </button>
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
