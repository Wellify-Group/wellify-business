"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { Collapse } from "@/components/ui/collapse";

interface SupportMessage {
  id: string;
  author: "user" | "support" | "system";
  text: string;
  createdAt: string;
}

const STORAGE_KEY = "wellify_support_cid";

export function SupportWidget() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { isSupportOpen, toggleSupport } = useStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false);
  const [hasRealAgentJoined, setHasRealAgentJoined] = useState(false);

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isDashboard = pathname?.startsWith("/dashboard");

  // 1. загрузка cid из localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCid(stored);
    }
  }, []);

  // helper: сохранить/очистить cid
  const persistCid = useCallback((newCid: string) => {
    setCid(newCid);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, newCid);
    }
  }, []);

  const clearCid = useCallback(() => {
    setCid(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // 2. создание новой сессии
  const startSession = useCallback(async (): Promise<string | null> => {
    try {
      const guestHash =
        typeof window !== "undefined"
          ? window.navigator.userAgent.slice(0, 128)
          : null;

      const res = await fetch("/api/support/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestHash }),
      });

      const data = await res.json().catch(() => null);

      if (data?.ok && data?.cid) {
        persistCid(data.cid);
        return data.cid as string;
      }

      console.error("startSession failed", data);
      setErrorText("Не удалось начать чат. Попробуйте ещё раз.");
      return null;
    } catch (e) {
      console.error("startSession error", e);
      setErrorText("Не удалось начать чат. Попробуйте ещё раз.");
      return null;
    }
  }, [persistCid]);

  // 3. загрузка сообщений
  const fetchMessages = useCallback(
    async (currentCid: string) => {
      try {
        const res = await fetch(
          `/api/support/messages?cid=${encodeURIComponent(currentCid)}`,
          {
            method: "GET",
          }
        );

        const data = await res.json().catch(() => null);
        if (!data) return;

        if (!data.ok && data.error === "SESSION_NOT_FOUND") {
          console.warn("messages SESSION_NOT_FOUND");
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          return;
        }

        if (data.ok && Array.isArray(data.messages)) {
          setMessages(data.messages as SupportMessage[]);
          const hasSupportMessages = data.messages.some(
            (m: SupportMessage) => m.author === "support"
          );
          if (hasSupportMessages) {
            setHasRealAgentJoined(true);
          }
        }
      } catch (e) {
        console.error("fetchMessages error", e);
      }
    },
    []
  );

  // 4. polling при наличии cid
  useEffect(() => {
    if (!cid) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // первый запрос сразу
    fetchMessages(cid);

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(() => {
      fetchMessages(cid);
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [cid, fetchMessages]);

  // 5. непрочитанные
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

  // 6. отправка сообщения
  const handleSend = useCallback(
    async (e?: FormEvent) => {
      if (e) e.preventDefault();
      setErrorText(null);

      const trimmed = inputMessage.trim();
      if (!trimmed) return;

      setIsSending(true);

      let activeCid = cid;
      let optimisticMessageId: string | null = null;

      try {
        if (!activeCid) {
          const newCid = await startSession();
          if (!newCid) {
            setIsSending(false);
            return;
          }
          activeCid = newCid;
        }

        // оптимистичное сообщение
        optimisticMessageId = `optimistic-${Date.now()}`;
        const optimisticMessage: SupportMessage = {
          id: optimisticMessageId,
          author: "user",
          text: trimmed,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setInputMessage("");
        if (!hasUserSentMessage) setHasUserSentMessage(true);

        const sendOnce = async (targetCid: string) => {
          const res = await fetch("/api/support/chat/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cid: targetCid, text: trimmed }),
          });

          const data = await res.json().catch(() => null);
          return { res, data };
        };

        let { data } = await sendOnce(activeCid as string);

        if (!data?.ok && data?.error === "SESSION_NOT_FOUND") {
          clearCid();
          const newCid = await startSession();
          if (!newCid) {
            setErrorText("Не удалось отправить сообщение. Попробуйте ещё раз.");
            if (optimisticMessageId) {
              setMessages((prev) =>
                prev.filter((m) => m.id !== optimisticMessageId)
              );
            }
            setInputMessage(trimmed);
            setIsSending(false);
            return;
          }
          activeCid = newCid;
          const second = await sendOnce(newCid);
          data = second.data;
        }

        if (!data?.ok) {
          console.error("send failed", data);
          setErrorText("Не удалось отправить сообщение. Попробуйте ещё раз.");
          if (optimisticMessageId) {
            setMessages((prev) =>
              prev.filter((m) => m.id !== optimisticMessageId)
            );
          }
          setInputMessage(trimmed);
        } else if (activeCid) {
          await fetchMessages(activeCid);
        }
      } catch (err) {
        console.error("handleSend error", err);
        setErrorText("Не удалось отправить сообщение. Попробуйте ещё раз.");
        if (optimisticMessageId) {
          setMessages((prev) =>
            prev.filter((m) => m.id !== optimisticMessageId)
          );
        }
        setInputMessage(trimmed);
      } finally {
        setIsSending(false);
      }
    },
    [cid, clearCid, fetchMessages, hasUserSentMessage, inputMessage, startSession]
  );

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

  // автоскролл
  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSupportOpen]);

  // ESC закрывает
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
    if (hasRealAgentJoined) return "Служба поддержки онлайн";
    return "Отвечаем в течение нескольких минут";
  };

  return (
    <>
      {/* Launcher */}
      {!isDashboard && !isSupportOpen && (
        <button
          onClick={handleLauncherClick}
          className="flex h-12 w-12 items-center justify-center rounded-full border-none outline-none transition-none hover:transition-none active:transition-none focus:transition-none motion-reduce:transition-none relative p-0"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: "var(--color-brand)",
            borderColor: "transparent",
            boxShadow: "var(--shadow-floating)",
          }}
        >
          <Send className="h-5 w-5 text-white m-0 p-0 pointer-events-none" />

          {hasUnread && (
            <div className="absolute -top-1 -right-1 h-[10px] w-[10px] rounded-full bg-red-500 border-2 border-card shadow-lg" />
          )}
        </button>
      )}

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
              style={{ backgroundColor: "var(--color-overlay)" }}
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
                style={{ padding: "24px 32px 16px" }}
              >
                <button
                  onClick={handleClosePanel}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
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
                    transition={{ duration: 0.3 }}
                    className="leading-snug text-sm"
                    style={{ color: "var(--color-text-muted)" }}
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
                <form onSubmit={handleSend} className="space-y-2">
                  {errorText && (
                    <div className="text-xs text-red-400">{errorText}</div>
                  )}
                  <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-muted/50 border border-border">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder={t("support.input_placeholder")}
                      className="flex-1 bg-transparent text-sm text-popover-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !inputMessage.trim()}
                      className="flex h-12 w-12 items-center justify-center rounded-full p-0 border-none outline-none transition-none disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "var(--color-brand)",
                        color: "white",
                      }}
                      aria-label={t("support.btn_send")}
                    >
                      <Send className="h-5 w-5 m-0 p-0 pointer-events-none" />
                    </button>
                  </div>
                </form>

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
                    textDecoration: "none",
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
