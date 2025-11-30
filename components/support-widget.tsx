"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { Collapse } from "@/components/ui/collapse";

interface ChatMessage {
  id: string;
  text: string;
  senderType: "user" | "system" | "agent";
  timestamp: Date;
  agentName?: string; // Имя агента для сообщений типа 'agent'
}

export function SupportWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { isSupportOpen, toggleSupport } = useStore();

  // Новые стейты
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const [activeAgentName, setActiveAgentName] = useState<string | null>(null);
  const [hasRealAgentJoined, setHasRealAgentJoined] = useState(false);

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Hide floating button on dashboard pages
  const isDashboard = pathname?.startsWith("/dashboard");

  // Определение темы
  const isDark = mounted && resolvedTheme === "dark";

  // Монтирование компонента
  useEffect(() => {
    setMounted(true);
  }, []);

  // Блокировка скролла при открытии панели
  useEffect(() => {
    if (isSupportOpen && !isMinimized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSupportOpen, isMinimized]);

  // Проверка на появление агента в сообщениях
  useEffect(() => {
    const agentMessage = messages.find((msg) => msg.senderType === "agent");
    if (agentMessage && !hasRealAgentJoined) {
      setHasRealAgentJoined(true);
      const agentName =
        agentMessage.agentName || (Math.random() > 0.5 ? "Антон" : "Євген");
      setActiveAgentName(agentName);
    }
  }, [messages, hasRealAgentJoined]);

  // Проверка непрочитанных сообщений от агента при свернутой панели
  useEffect(() => {
    if (!isSupportOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderType === "agent") {
        setHasUnread(true);
      }
    }
  }, [messages, isSupportOpen]);

  const faqs = [
    {
      key: "location",
      question: t("support.faq_location"),
      answer: t("support.faq_location_ans"),
    },
    {
      key: "pin",
      question: t("support.faq_pin"),
      answer: t("support.faq_pin_ans"),
    },
    {
      key: "billing",
      question: t("support.faq_billing"),
      answer: t("support.faq_billing_ans"),
    },
  ];

  const handleTelegramClick = () => {
    window.open("https://t.me/shiftflow_support", "_blank");
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: inputMessage.trim(),
        senderType: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputMessage("");

      // Устанавливаем флаг, что пользователь отправил сообщение
      if (!hasUserSentMessage) {
        setHasUserSentMessage(true);
      }

      // Автоответ после 1 секунды (системное сообщение)
      setTimeout(() => {
        const systemMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: t("support.auto_reply"),
          senderType: "system",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }, 1000);

      // Имитация ответа от агента через 3 секунды (для демонстрации)
      setTimeout(() => {
        const agentName =
          activeAgentName || (Math.random() > 0.5 ? "Антон" : "Євген");
        const agentMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          text: "Добрый день! Чем могу помочь?",
          senderType: "agent",
          timestamp: new Date(),
          agentName: agentName,
        };
        setMessages((prev) => [...prev, agentMessage]);

        // Если агент еще не был определен, устанавливаем его
        if (!hasRealAgentJoined) {
          setHasRealAgentJoined(true);
          setActiveAgentName(agentName);
        }
      }, 3000);
    }
  };

  const handleLauncherClick = () => {
    if (isSupportOpen) {
      // Если панель открыта - сворачиваем
      setIsMinimized(true);
      toggleSupport();
    } else {
      // Если панель закрыта - открываем
      setIsMinimized(false);
      setHasUnread(false);
      toggleSupport();
    }
  };

  // Сброс isMinimized при открытии панели
  useEffect(() => {
    if (isSupportOpen) {
      setIsMinimized(false);
      setHasUnread(false);
    }
  }, [isSupportOpen]);

  const handleClosePanel = () => {
    setIsMinimized(true);
    toggleSupport();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && isSupportOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSupportOpen, isMinimized]);

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSupportOpen && !isMinimized) {
        handleClosePanel();
      }
    };
    if (isSupportOpen && !isMinimized) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isSupportOpen, isMinimized]);

  // Получение подзаголовка
  const getSubtitle = () => {
    if (hasRealAgentJoined && activeAgentName) {
      return `${activeAgentName}, служба підтримки`;
    }
    return "Отвечаем в течение нескольких минут";
  };

  return (
    <>
      {/* Launcher Button - Скрывается при открытом окне чата */}
      {!isDashboard && !isSupportOpen && (
        <AnimatePresence mode="wait">
          <motion.button
            key="launcher"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 1.02, 1],
              opacity: 1,
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              opacity: {
                duration: 0.7,
                ease: "easeOut",
              },
              scale: {
                duration: 2.7,
                times: [0, 0.26, 0.5, 1],
                repeat: Infinity,
                repeatDelay: 0,
                ease: ["easeOut", "easeInOut", "easeInOut", "easeInOut"],
              },
            }}
            onClick={handleLauncherClick}
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full border transition-all relative"
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              left: "auto",
              top: "auto",
              zIndex: 9999,
              background: "var(--color-brand)",
              borderColor: "transparent",
              boxShadow: "var(--shadow-floating)",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="h-5 w-5 text-white" />

            {/* Индикатор непрочитанных сообщений */}
            {hasUnread && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-1 -right-1 h-[10px] w-[10px] rounded-full bg-red-500 border-2 border-card shadow-lg"
              />
            )}
          </motion.button>
        </AnimatePresence>
      )}

      {/* Premium Support Window */}
      <AnimatePresence>
        {isSupportOpen && !isMinimized && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClosePanel}
              className="fixed inset-0 z-40 backdrop-blur-[14px]"
              style={{
                backgroundColor: "var(--color-overlay)",
              }}
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{
                transform: { duration: 0.22, ease: "var(--ease-soft)" },
                opacity: { duration: 0.22, ease: "var(--ease-soft)" },
              }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-50 bottom-6 right-6 w-[360px] max-h-[520px] overflow-hidden flex flex-col"
              style={{
                backgroundColor: "var(--color-surface)",
                borderRadius: "var(--radius-xl)",
                boxShadow: "var(--shadow-modal)",
                border: "1px solid var(--color-border-subtle)",
              }}
            >
              {/* Header */}
              <div
                className="relative flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(37, 99, 235, 0.08), transparent)",
                  padding: "24px 32px 16px",
                }}
              >
                {/* Close Button */}
                <button
                  onClick={handleClosePanel}
                  className="absolute top-4 right-4 md:top-5 md:right-5 h-8 w-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Title */}
                <div className="pr-10">
                  <h3
                    className="mb-1 font-semibold"
                    style={{
                      fontSize: "var(--font-size-xl)",
                      color: "var(--color-text-main)",
                    }}
                  >
                    {t("support.title")}
                  </h3>
                  <motion.p
                    key={hasRealAgentJoined ? "agent" : "default"}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.3 }}
                    className="leading-snug"
                    style={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {getSubtitle()}
                  </motion.p>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div
                className={`flex-1 overflow-y-auto px-5 md:px-6 space-y-4 scrollbar-hide pb-3 md:pb-4 ${
                  hasUserSentMessage ? "pb-4" : ""
                }`}
                ref={chatContainerRef}
              >
                {/* FAQ Section - скрывается после первого сообщения */}
                <AnimatePresence>
                  {!hasUserSentMessage && (
                    <motion.div
                      initial={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <h4 className="text-xs font-semibold mb-3 uppercase tracking-wide text-muted-foreground">
                        {t("support.quick_answers")}
                      </h4>
                      <div className="space-y-2 overflow-hidden rounded-2xl pb-4">
                        {faqs.map((faq, index) => (
                          <motion.div
                            key={faq.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-2xl overflow-hidden transition-all bg-muted/50 hover:bg-muted"
                          >
                            <button
                              onClick={() =>
                                setExpandedFaq(
                                  expandedFaq === faq.key ? null : faq.key
                                )
                              }
                              className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors"
                            >
                              <span className="flex-1 pr-3 text-sm font-medium text-popover-foreground">
                                {faq.question}
                              </span>
                              {expandedFaq === faq.key ? (
                                <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                              )}
                            </button>
                            <Collapse isOpen={expandedFaq === faq.key}>
                              <div className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground">
                                {faq.answer}
                              </div>
                            </Collapse>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat Section */}
                {messages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={hasUserSentMessage ? "" : "mt-4"}
                  >
                    {!hasUserSentMessage && (
                      <h4 className="text-xs font-semibold mb-3 uppercase tracking-wide text-muted-foreground">
                        Чат
                      </h4>
                    )}
                    <div className="space-y-2">
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            msg.senderType === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                              msg.senderType === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <p className="break-words leading-relaxed">
                              {msg.text}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer - Input and Telegram Button */}
              <div className="border-t border-border px-5 py-4 md:px-6 md:py-5 space-y-3 flex-shrink-0">
                {/* Message Input */}
                <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-muted/50 border border-border">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                    placeholder={t("support.input_placeholder")}
                    className="flex-1 bg-transparent text-sm text-popover-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="flex h-12 w-12 items-center justify-center rounded-full p-0 border-none outline-none transition-none hover:transition-none active:transition-none focus:transition-none motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    style={{
                      background: "var(--color-brand)",
                      color: "white",
                      transform: "none",
                    }}
                    aria-label={t("support.btn_send")}
                  >
                    <Send className="h-5 w-5 m-0 p-0 pointer-events-none" style={{ transform: "none" }} />
                  </button>
                </div>

                {/* Telegram Button - как primary button, но высота 44px */}
                <button
                  onClick={handleTelegramClick}
                  className="w-full text-sm font-semibold flex items-center justify-center transition-all hover:-translate-y-[1px] active:translate-y-[0px] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    height: "44px",
                    background: "var(--color-brand)",
                    color: "var(--color-text-inverse)",
                    boxShadow: "var(--shadow-floating)",
                    borderRadius: "var(--radius-pill)",
                    transitionDuration: "var(--transition-base)",
                    transitionTimingFunction: "var(--ease-soft)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--color-brand-strong)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-brand)";
                  }}
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
