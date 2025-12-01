"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { Collapse } from "@/components/ui/collapse";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface SupportMessage {
  id: string;
  cid: string;
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
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [cid, setCid] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Refs для Realtime и polling
  const realtimeChannelRef = useRef<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const useRealtimeRef = useRef(true); // Флаг использования Realtime

  const isDashboard = pathname?.startsWith("/dashboard");

  // Инициализация CID
  useEffect(() => {
    setMounted(true);
    let storedCid =
      typeof window !== "undefined"
        ? localStorage.getItem("support_cid")
        : null;

    if (!storedCid) {
      storedCid = crypto.randomUUID();
      if (typeof window !== "undefined") {
        localStorage.setItem("support_cid", storedCid);
      }
    }

    setCid(storedCid);
  }, []);

  // Добавление новых сообщений
  const addMessages = useCallback(
    (newMessages: SupportMessage[]) => {
      if (!cid || newMessages.length === 0) return;

      setMessages((prev) => {
        // Избегаем дубликатов по id
        const existingIds = new Set(prev.map((m) => m.id));
        const unique = newMessages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...unique];
      });

      // Проверяем, есть ли сообщения от поддержки
      const hasSupport = newMessages.some((m) => m.author === "support");
      if (hasSupport) {
        setHasRealAgentJoined(true);
      }
    },
    [cid]
  );

  // Polling для получения новых сообщений (fallback)
  const startPolling = useCallback(() => {
    if (!cid || pollingIntervalRef.current) return;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/support/chat/poll?cid=${encodeURIComponent(cid)}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (data.ok && Array.isArray(data.messages) && data.messages.length > 0) {
          addMessages(data.messages);
        }
      } catch (e) {
        console.error("[Support Widget] Polling error:", e);
      }
    };

    // Первый запрос сразу
    poll();

    // Далее каждые 2-3 секунды
    pollingIntervalRef.current = setInterval(poll, 2500);
  }, [cid, addMessages]);

  // Остановка polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Остановка Realtime
  const stopRealtime = useCallback(() => {
    if (realtimeChannelRef.current) {
      try {
        const supabase = createBrowserSupabaseClient();
        supabase.removeChannel(realtimeChannelRef.current);
      } catch (error) {
        console.error("[Support Widget] Error removing Realtime channel:", error);
      }
      realtimeChannelRef.current = null;
    }
  }, []);

  // Подключение к Supabase Realtime
  const startRealtime = useCallback(() => {
    if (!cid || realtimeChannelRef.current || !useRealtimeRef.current) return;

    // Проверяем наличие переменных окружения Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("[Support Widget] Supabase env vars not set, using polling only");
      useRealtimeRef.current = false;
      startPolling();
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();

      const channelName = `support_chat:${cid}`;
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: true },
        },
      });

      // Таймаут для подключения
      const connectionTimeout = setTimeout(() => {
        if (realtimeChannelRef.current === channel) {
          console.warn(`[Support Widget] Realtime connection timeout for CID: ${cid}, falling back to polling`);
          useRealtimeRef.current = false;
          stopRealtime();
          startPolling();
        }
      }, 5000);

      // Подписываемся на новые сообщения
      channel
        .on("broadcast", { event: "new_message" }, (payload) => {
          console.log("[Support Widget] Realtime message received:", payload);
          const messageData = payload.payload;
          
          if (messageData && messageData.sender === "support") {
            const newMessage: SupportMessage = {
              id: crypto.randomUUID(),
              cid,
              author: "support",
              text: messageData.text,
              createdAt: messageData.createdAt || new Date().toISOString(),
            };
            addMessages([newMessage]);
          }
        })
        .subscribe((status) => {
          clearTimeout(connectionTimeout);
          
          if (status === "SUBSCRIBED") {
            console.log(`[Support Widget] ✅ Realtime connected for CID: ${cid}`);
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            console.warn(`[Support Widget] Realtime ${status} for CID: ${cid}, falling back to polling`);
            useRealtimeRef.current = false;
            stopRealtime();
            startPolling();
          } else {
            console.log(`[Support Widget] Realtime status: ${status} for CID: ${cid}`);
          }
        });

      realtimeChannelRef.current = channel;
    } catch (error) {
      console.error("[Support Widget] Failed to start Realtime:", error);
      useRealtimeRef.current = false;
      // Не пытаемся использовать Realtime снова в этой сессии
      startPolling();
    }
  }, [cid, addMessages, startPolling, stopRealtime]);

  // Управление Realtime/Polling при изменении cid или isSupportOpen
  useEffect(() => {
    if (!cid || !isSupportOpen || isMinimized) {
      stopRealtime();
      stopPolling();
      return;
    }

    // Пытаемся использовать Realtime, если доступен и еще не было ошибок
    if (useRealtimeRef.current) {
      startRealtime();
      // Если Realtime не подключится за 5 секунд, startRealtime сам переключится на polling
    } else {
      // Fallback на polling (если Realtime уже не работает)
      startPolling();
    }

    return () => {
      stopRealtime();
      stopPolling();
    };
  }, [cid, isSupportOpen, isMinimized, startRealtime, stopRealtime, startPolling, stopPolling]);

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
    if (!text || !cid) return;

    setInputMessage("");

    // Оптимистичное обновление
    const optimistic: SupportMessage = {
      id: crypto.randomUUID(),
      cid,
      author: "user",
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);

    if (!hasUserSentMessage) {
      setHasUserSentMessage(true);
    }

    try {
      const res = await fetch("/api/support/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cid,
          message: text,
          name: currentUser?.fullName || currentUser?.name,
          userId: currentUser?.id,
          email: currentUser?.email,
        }),
      });

      if (!res.ok) {
        console.error("Failed to send message");
      }
    } catch (e) {
      console.error("Failed to send support message", e);
    }
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

  const handleClosePanel = () => {
    setIsMinimized(true);
    toggleSupport();
  };

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
  }, [isSupportOpen, isMinimized]);

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
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                    placeholder={t("support.input_placeholder")}
                    className="flex-1 bg-transparent text-sm text-popover-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || !cid}
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
