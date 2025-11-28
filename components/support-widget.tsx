"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { useStore } from "@/lib/store";
import { Collapse } from "@/components/ui/collapse";

export function SupportWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { isSupportOpen, toggleSupport } = useStore();
  const [message, setMessage] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Chat Store
  const { 
    chatHistory, 
    sendUserMessage, 
    receiveAgentMessage, 
    unreadChatMessages, 
    markChatRead 
  } = useStore();
  
  const unreadCount = unreadChatMessages();

  const faqs = [
    { key: "location", question: t("support.faq_location"), answer: t("support.faq_location_ans") },
    { key: "pin", question: t("support.faq_pin"), answer: t("support.faq_pin_ans") },
    { key: "billing", question: t("support.faq_billing"), answer: t("support.faq_billing_ans") },
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isSupportOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isSupportOpen]);

  // Mark as read when opening widget
  useEffect(() => {
    if (isSupportOpen) {
      markChatRead();
    }
  }, [isSupportOpen, markChatRead]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Send user message
      sendUserMessage(message);
      setMessage("");
      
      // Auto-reply simulation after 2 seconds
      setTimeout(() => {
        receiveAgentMessage(t("support.auto_reply"));
      }, 2000);
    }
  };

  const handleTelegramClick = () => {
    // Open Telegram link (replace with actual bot link)
    window.open("https://t.me/shiftflow_support", "_blank");
  };

  // Hide floating button on dashboard pages
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <>
      {/* Launcher Button with Badge - Only show if NOT on dashboard */}
      {!isDashboard && (
        <motion.button
          onClick={toggleSupport}
          style={{ 
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            left: 'auto',
            top: 'auto',
            zIndex: 9999
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 relative"
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
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Unread Badge */}
          {!isSupportOpen && unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.div>
          )}
        </motion.button>
      )}

      {/* Support Window */}
      <AnimatePresence>
        {isSupportOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSupport}
              className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
            />

            {/* Window Panel - Fixed to bottom-right corner */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed z-[9999] bottom-[88px] right-[20px] w-[350px] max-h-[600px] bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header - Gradient Brand Color */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4 text-primary-foreground"
              >
                <h3 className="text-lg font-bold mb-1">{t("support.title")}</h3>
                <p className="text-sm text-primary-foreground/80">
                  {t("support.subtitle")}
                </p>
              </motion.div>

              {/* Body - Chat or Quick Actions */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background scrollbar-hide">
                {chatHistory.length === 0 ? (
                  // Empty State: Quick Actions
                  <>
                    {/* Section 1: Direct Chat */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-1"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleTelegramClick}
                        className="w-full rounded-xl bg-primary px-4 py-3 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 flex items-center justify-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        <span>{t("support.btn_telegram")}</span>
                      </motion.button>
                      <p className="text-xs text-muted-foreground text-center">
                        {t("support.telegram_desc")}
                      </p>
                    </motion.div>

                    {/* Section 2: Quick Answers (Accordion) */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-1.5"
                    >
                      <h4 className="text-xs font-semibold text-card-foreground mb-2">
                        {t("support.quick_answers")}
                      </h4>
                      {faqs.map((faq, index) => (
                        <motion.div
                          key={faq.key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="border border-border rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setExpandedFaq(expandedFaq === faq.key ? null : faq.key)
                            }
                            className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-medium text-card-foreground hover:bg-muted/50 transition-colors"
                          >
                            <span className="flex-1 pr-2">{faq.question}</span>
                            {expandedFaq === faq.key ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            )}
                          </button>
                          <Collapse isOpen={expandedFaq === faq.key}>
                            <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                              {faq.answer}
                            </div>
                          </Collapse>
                        </motion.div>
                      ))}
                    </motion.div>
                  </>
                ) : (
                  // Chat History: Message Bubbles
                  <div className="space-y-2">
                    {chatHistory.map((msg, index) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                            msg.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-card-foreground'
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender === 'user' 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Footer - Message Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="border-t border-border p-3 bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={t("support.input_placeholder")}
                    className="flex-1 rounded-lg border border-transparent bg-muted/50 px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:ring-2 focus:ring-primary focus:border-border"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label={t("support.btn_send")}
                  >
                    <Send className="h-4 w-4" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
