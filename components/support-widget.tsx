"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { Collapse } from "@/components/ui/collapse";

interface SupportMessage {
  id: number;
  author: "user" | "support";
  text: string;
  createdAt: string;
}

export function SupportWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { isSupportOpen, toggleSupport, currentUser } = useStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const [hasRealAgentJoined, setHasRealAgentJoined] = useState(false);

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isDashboard = pathname?.startsWith("/dashboard");

  // 1. читаем cid из localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("support_cid");
    if (stored) {
      setCid(stored);
    }
  }, []);

  // Вспомогательная функция для создания новой сессии
  const createSession = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/support/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: currentUser?.fullName || currentUser?.name || null,
          userEmail: currentUser?.email || null,
          userId: currentUser?.id || null,
        }),
      });

      const data = await res.json();

      if (res.ok && data?.ok && data.cid) {
        const newCid = data.cid;
        setCid(newCid);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("support_cid", newCid);
        }
        return newCid;
      }

      console.error("Failed to create session:", data);
      return null;
    } catch (e) {
      console.error("Error creating session:", e);
      return null;
    }
  }, [currentUser]);

  // 2. polling сообщений
  useEffect(() => {
    // если cid ещё нет - вообще не запускаем polling
    if (!cid) return;

    let cancelled = false;
    const currentCid: string = cid; // фиксируем как строку

    async function poll() {
      try {
        const res = await fetch(
          `/api/support/messages?cid=${encodeURIComponent(currentCid)}`
        );

        const data = await res.json();

        // Если получили SESSION_NOT_FOUND - пересоздаём сессию
        if (!res.ok || (data?.ok === false && data?.error === "SESSION_NOT_FOUND")) {
          console.log("Session not found in polling, recreating session...");
          
          // Удаляем старый cid из localStorage
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("support_cid");
          }

          // Создаём новую сессию (она сама установит новый cid через setCid)
          const newCid = await createSession();
          if (!newCid || cancelled) {
            return;
          }
          
          // Новый polling запустится автоматически благодаря изменению cid в зависимости useEffect
          return;
        }

        if (!cancelled && data?.ok && Array.isArray(data.messages)) {
          setMessages(data.messages);
          // Проверяем, есть ли сообщения от поддержки
          const hasSupportMessages = data.messages.some(
            (m: SupportMessage) => m.author === "support"
          );
          if (hasSupportMessages) {
            setHasRealAgentJoined(true);
          }
        }
      } catch (e) {
        console.error("SupportWidget poll error:", e);
      } finally {
        if (!cancelled) {
          setTimeout(poll, 5000);
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [cid, createSession]);

  // Проверка непрочитанных сообщений
  useEffect(() => {
    if (!isSupportOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.author === "support") {
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

  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    // Минимум 1 символ для отправки
    if (!text || text.length < 1 || isSending) return;

    setIsSending(true);

    // Сразу добавляем сообщение пользователя локально для мгновенного отображения
    const tempMessageId = Date.now();
    const userMessage: SupportMessage = {
      id: tempMessageId,
      author: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    if (!hasUserSentMessage) {
      setHasUserSentMessage(true);
    }

    // Функция для отправки сообщения (может быть вызвана повторно при пересоздании сессии)
    const sendMessage = async (currentCid: string | null, retryCount = 0): Promise<boolean> => {
      try {
        // Если cid отсутствует, создаём новую сессию
        let activeCid = currentCid;
        if (!activeCid) {
          activeCid = await createSession();
          if (!activeCid) {
            console.error("Failed to create session, removing temp message");
            setMessages((prev) => prev.filter((m) => m.id !== tempMessageId));
            setInputMessage(text);
            return false;
          }
        }

        const res = await fetch("/api/support/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cid: activeCid,
            text,
            userName: currentUser?.fullName || currentUser?.name || null,
            userEmail: currentUser?.email || null,
            userId: currentUser?.id || null,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          const error = data?.error;

          // SESSION_NOT_FOUND - пересоздаём сессию и повторяем отправку
          if (error === "SESSION_NOT_FOUND") {
            console.log("Session not found, recreating session and retrying...");
            
            // Удаляем старый cid из localStorage
            if (typeof window !== "undefined") {
              window.localStorage.removeItem("support_cid");
            }

            // Создаём новую сессию (она сама установит новый cid через setCid)
            const newCid = await createSession();
            if (!newCid) {
              console.error("Failed to recreate session, removing temp message");
              setMessages((prev) => prev.filter((m) => m.id !== tempMessageId));
              setInputMessage(text);
              return false;
            }

            // Повторяем отправку с новым cid (максимум 1 попытка)
            if (retryCount < 1) {
              return await sendMessage(newCid, retryCount + 1);
            } else {
              console.error("Max retries reached for SESSION_NOT_FOUND");
              setMessages((prev) => prev.filter((m) => m.id !== tempMessageId));
              setInputMessage(text);
              return false;
            }
          }

          // EMPTY_MESSAGE - повторяем отправку (максимум 1 раз)
          if (error === "EMPTY_MESSAGE" && retryCount < 1) {
            console.log("Empty message error, retrying...");
            return await sendMessage(activeCid, retryCount + 1);
          }

          // Другие ошибки - удаляем временное сообщение
          console.error("Send message error:", error);
          setMessages((prev) => prev.filter((m) => m.id !== tempMessageId));
          setInputMessage(text);
          return false;
        }

        // Успешная отправка - сохраняем cid если его ещё нет
        if (data.cid && activeCid !== data.cid) {
          setCid(data.cid);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("support_cid", data.cid);
          }
        }

        // История обновится при следующем poll, временное сообщение заменится реальным
        return true;
      } catch (e) {
        console.error("SupportWidget send error:", e);
        
        // При сетевой ошибке тоже удаляем временное сообщение
        setMessages((prev) => prev.filter((m) => m.id !== tempMessageId));
        setInputMessage(text);
        return false;
      }
    };

    // Запускаем отправку
    await sendMessage(cid);
    
    setIsSending(false);
  };

  const handleLauncherClick = () => {
    if (isSupportOpen) {
      setIsMinimized(true);
      toggleSupport();
    } else {
      setIsMinimized(false);
      setHasUnread(false);
      toggleSupport();
    }
  };

  useEffect(() => {
    if (isSupportOpen) {
      setIsMinimized(false);
      setHasUnread(false);
    }
  }, [isSupportOpen]);

  const handleClosePanel = useCallback(() => {
    setIsMinimized(true);
    toggleSupport();
  }, [toggleSupport]);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current && isSupportOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isSupportOpen, isMinimized]);

  // Close on ESC
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
  }, [isSupportOpen, isMinimized, handleClosePanel]);

  const getSubtitle = () => {
    if (hasRealAgentJoined) {
      return "Служба поддержки онлайн";
    }
    return "Отвечаем в течение нескольких минут";
  };

  return (
    <>
      {/* Launcher Button */}
      {!isDashboard && !isSupportOpen && (
        <button
          onClick={handleLauncherClick}
          className="flex h-12 w-12 items-center justify-center rounded-full border-none outline-none transition-none hover:transition-none active:transition-none focus:transition-none motion-reduce:transition-none relative p-0"
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
            transform: "none",
          }}
        >
          <Send
            className="h-5 w-5 text-white m-0 p-0 pointer-events-none"
            style={{ transform: "none" }}
          />

          {hasUnread && (
            <div
              className="absolute -top-1 -right-1 h-[10px] w-[10px] rounded-full bg-red-500 border-2 border-card shadow-lg"
              style={{ transform: "none" }}
            />
          )}
        </button>
      )}

      {/* Support Window */}
      <AnimatePresence>
        {isSupportOpen && !isMinimized && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClosePanel}
              className="fixed inset-0 z-40"
              style={{
                backgroundColor: "var(--color-overlay)",
              }}
            />

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
                  backgroundColor: "var(--color-surface)",
                  padding: "24px 32px 16px",
                }}
              >
                <button
                  onClick={handleClosePanel}
                  className="absolute top-4 right-4 md:top-5 md:right-5 h-8 w-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>

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

              {/* Content */}
              <div
                className={`flex-1 overflow-y-auto px-5 md:px-6 space-y-4 scrollbar-hide pb-3 md:pb-4 ${
                  hasUserSentMessage ? "pb-4" : ""
                }`}
                ref={chatContainerRef}
              >
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
                    <div className="flex flex-col gap-2">
                      {messages.map((msg) => {
                        const isUser = msg.author === "user";
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                              isUser
                                ? "self-end bg-primary text-primary-foreground"
                                : "self-start bg-muted text-muted-foreground"
                            }`}
                          >
                            <p className="break-words leading-relaxed">
                              {msg.text}
                            </p>
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border px-5 py-4 md:px-6 md:py-5 space-y-3 flex-shrink-0">
                <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-muted/50 border border-border">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={t("support.input_placeholder")}
                    className="flex-1 bg-transparent text-sm text-popover-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      !inputMessage.trim() ||
                      inputMessage.trim().length < 1 ||
                      isSending
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full p-0 border-none outline-none transition-none hover:transition-none active:transition-none focus:transition-none motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    style={{
                      background: "var(--color-brand)",
                      color: "white",
                      transform: "none",
                    }}
                    aria-label={t("support.btn_send")}
                  >
                    <Send
                      className="h-5 w-5 m-0 p-0 pointer-events-none"
                      style={{ transform: "none" }}
                    />
                  </button>
                </div>

                <a
                  href="https://t.me/wellifybusinesssupport_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-xl bg-primary text-white text-sm font-medium py-3 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                  style={{
                    height: "44px",
                    background: "var(--color-brand)",
                    color: "var(--color-text-inverse)",
                    boxShadow: "var(--shadow-floating)",
                    borderRadius: "var(--radius-pill)",
                    transitionDuration: "var(--transition-base)",
                    transitionTimingFunction: "var(--ease-soft)",
                    textDecoration: "none",
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
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
