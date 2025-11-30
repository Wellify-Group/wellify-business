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
  senderType: 'user' | 'system' | 'agent';
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
  const isDashboard = pathname?.startsWith('/dashboard');
  
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
    const agentMessage = messages.find(msg => msg.senderType === 'agent');
    if (agentMessage && !hasRealAgentJoined) {
      setHasRealAgentJoined(true);
      const agentName = agentMessage.agentName || (Math.random() > 0.5 ? "Антон" : "Євген");
      setActiveAgentName(agentName);
    }
  }, [messages, hasRealAgentJoined]);

  // Проверка непрочитанных сообщений от агента при свернутой панели
  useEffect(() => {
    if (!isSupportOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderType === 'agent') {
        setHasUnread(true);
      }
    }
  }, [messages, isSupportOpen]);

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
        senderType: 'user',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
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
          senderType: 'system',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, systemMessage]);
      }, 1000);

      // Имитация ответа от агента через 3 секунды (для демонстрации)
      setTimeout(() => {
        const agentName = activeAgentName || (Math.random() > 0.5 ? "Антон" : "Євген");
        const agentMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          text: "Добрый день! Чем могу помочь?",
          senderType: 'agent',
          timestamp: new Date(),
          agentName: agentName,
        };
        setMessages(prev => [...prev, agentMessage]);
        
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
      {/* Launcher Button - Always visible, only hide on dashboard */}
      {!isDashboard && (
        <motion.button
          onClick={handleLauncherClick}
          style={{ 
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            left: 'auto',
            top: 'auto',
            zIndex: 9999
          }}
          className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-card border border-border shadow-[0_18px_45px_rgba(0,0,0,0.65)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.65)] transition-all relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={!isSupportOpen ? {
            scale: [1, 1.02, 1],
          } : {
            scale: 1,
            rotate: [0, 5, -5, 0],
          }}
          transition={!isSupportOpen ? {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          } : {
            duration: 0.3,
          }}
        >
          <Send className="h-5 w-5 text-foreground" />
          
          {/* Индикатор непрочитанных сообщений */}
          <AnimatePresence>
            {hasUnread && !isSupportOpen && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-1 -right-1 h-[10px] w-[10px] rounded-full bg-red-500 border-2 border-card shadow-lg"
              />
            )}
          </AnimatePresence>
        </motion.button>
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
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
            
            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-50 bottom-6 right-6 w-[360px] max-h-[520px] rounded-[24px] md:rounded-[28px] bg-popover/95 backdrop-blur-[22px] border border-border shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="relative px-5 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4 flex-shrink-0">
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
                  <h3 className="text-base font-bold mb-1 text-popover-foreground">
                    {t("support.title")}
                  </h3>
                  <motion.p 
                    key={hasRealAgentJoined ? 'agent' : 'default'}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs md:text-[13px] leading-snug text-muted-foreground"
                  >
                    {getSubtitle()}
                  </motion.p>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className={`flex-1 overflow-y-auto px-5 md:px-6 space-y-4 scrollbar-hide pb-3 md:pb-4 ${hasUserSentMessage ? 'pb-4' : ''}`} ref={chatContainerRef}>
                {/* FAQ Section - скрывается после первого сообщения */}
                <AnimatePresence>
                  {!hasUserSentMessage && (
                    <motion.div
                      initial={{ opacity: 1, height: 'auto' }}
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
                                setExpandedFaq(expandedFaq === faq.key ? null : faq.key)
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
                    className={hasUserSentMessage ? '' : 'mt-4'}
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
                          className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`
                              max-w-[80%] rounded-2xl px-3 py-2 text-xs
                              ${msg.senderType === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                              }
                            `}
                          >
                            <p className="break-words leading-relaxed">{msg.text}</p>
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
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder={t("support.input_placeholder")}
                    className="flex-1 bg-transparent text-sm text-popover-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-150 hover:scale-105 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label={t("support.btn_send")}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                {/* Telegram Button */}
                <button
                  onClick={handleTelegramClick}
                  className="w-full h-10 md:h-[44px] rounded-full text-sm md:text-[15px] font-medium flex items-center justify-center bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-all duration-200 hover:-translate-y-[1px] shadow-lg"
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
