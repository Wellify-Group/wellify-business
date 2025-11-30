"use client";

import { useState, useEffect, useRef } from "react";
import useStore from "@/lib/store";
import { X, Send, Minimize2, ExternalLink, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface ConversationDialogProps {
  conversationId: string;
  type: 'manager' | 'employee';
  recipientId: string;
  recipientName: string;
  context?: {
    notificationMessage?: string;
    locationName?: string;
  };
  profileLink?: string;
}

export function ConversationDialog({
  conversationId,
  type,
  recipientId,
  recipientName,
  context,
  profileLink
}: ConversationDialogProps) {
  const { 
    openConversations, 
    minimizedConversations,
    getConversationDraft,
    updateConversationDraft,
    sendConversationMessage,
    closeConversation,
    minimizeConversation,
    restoreConversation
  } = useStore();
  
  const { success, error } = useToast();
  const [messageText, setMessageText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  
  const isOpen = openConversations.includes(conversationId);
  const isMinimized = minimizedConversations.includes(conversationId);
  
  // Загружаем черновик при открытии
  useEffect(() => {
    if (isOpen) {
      const draft = getConversationDraft(conversationId);
      setMessageText(draft);
    }
  }, [isOpen, conversationId, getConversationDraft]);
  
  // Сохраняем черновик при изменении
  useEffect(() => {
    if (isOpen) {
      updateConversationDraft(conversationId, messageText);
    }
  }, [messageText, conversationId, isOpen, updateConversationDraft]);

  // Сбрасываем высоту textarea при очистке текста
  useEffect(() => {
    if (!messageText && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [messageText]);

  const handleAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement> | React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget as HTMLTextAreaElement;
    el.style.height = "auto";
    const maxHeight = 120; // лимит высоты, ~4–5 строк
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = newHeight + "px";
  };
  
  const handleSend = async () => {
    if (!messageText.trim()) return;
    
    try {
      await sendConversationMessage(conversationId, type, recipientId);
      setMessageText("");
      success("Сообщение отправлено");
      closeConversation(conversationId);
    } catch (err) {
      error("Ошибка при отправке сообщения");
    }
  };
  
  const handleMinimize = () => {
    minimizeConversation(conversationId);
  };
  
  const handleClose = () => {
    closeConversation(conversationId);
  };
  
  if (!isOpen && !isMinimized) return null;
  
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-4 right-4 z-[9998] bg-card border border-border rounded-lg p-3 shadow-lg cursor-pointer hover:bg-muted transition-colors"
        onClick={() => restoreConversation(conversationId)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded">
            <User className="h-3 w-3 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-foreground truncate">
              {type === 'manager' ? 'Менеджер' : 'Сотрудник'}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {recipientName}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </motion.div>
    );
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleMinimize}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-card border border-border rounded-lg shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {type === 'manager' ? 'Сообщение менеджеру' : `Сообщение сотруднику ${recipientName}`}
                </h2>
                {context?.notificationMessage && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {context.notificationMessage}
                    {context.locationName && ` • ${context.locationName}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {profileLink && (
                  <Link
                    href={profileLink}
                    className="p-2 hover:bg-muted rounded transition-colors"
                    title={type === 'manager' ? 'Открыть профиль менеджера' : 'Открыть профиль сотрудника'}
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )}
                <button
                  onClick={handleMinimize}
                  className="p-2 hover:bg-muted rounded transition-colors"
                  title="Свернуть"
                >
                  <Minimize2 className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-muted rounded transition-colors"
                  title="Закрыть"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            
            {/* Content - Empty or can be used for context */}
            <div className="p-4 flex-1 min-h-[120px]">
              {/* Можно добавить контент, если нужно */}
            </div>
            
            {/* Footer - Telegram-style input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-end gap-3">
                {/* Пузырь ввода */}
                <div className="flex-1 rounded-full bg-neutral-900 dark:bg-zinc-950 px-3 py-2 flex items-center gap-2 min-h-[36px] transition-all">
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      handleAutoResize(e);
                    }}
                    onInput={handleAutoResize}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed max-h-[120px] overflow-y-auto text-white placeholder:text-zinc-500 min-h-[20px]"
                    placeholder="Введите сообщение..."
                  />
                </div>
                {/* Кнопка отправки */}
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim()}
                  className="h-12 w-12 rounded-full bg-emerald-700 p-0 border-none outline-none transition-none hover:transition-none active:transition-none focus:transition-none motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                  title="Отправить"
                >
                  <Send className="h-5 w-5 text-white m-0 p-0 pointer-events-none" style={{ transform: "none" }} />
                </button>
              </div>
              {/* Дополнительные кнопки действий */}
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={handleMinimize}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Свернуть
                </button>
                <button
                  onClick={handleClose}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

