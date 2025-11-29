"use client";

import { useEffect, useState, useRef } from "react";
import useStore from "@/lib/store";
import { Send } from "lucide-react";

interface ShiftMessagesCardProps {
  shiftId: string;
  onNewMessage?: () => void;
}

export function ShiftMessagesCard({ shiftId, onNewMessage }: ShiftMessagesCardProps) {
  const { messages, currentUser, sendManagerMessage } = useStore();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendManagerMessage(newMessage);
    setNewMessage("");
    onNewMessage?.();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface-2)] rounded-xl border border-[var(--border-color)] overflow-hidden">
      <div className="p-3 border-b border-[var(--border-color)] font-medium text-sm text-[var(--text-primary)]">
        Чат с менеджером
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.fromId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-2.5 rounded-xl text-sm shadow-sm ${
              msg.fromId === currentUser?.id 
                ? 'bg-[var(--accent-primary)] text-white rounded-br-none' 
                : 'bg-[var(--surface-3)] text-[var(--text-primary)] rounded-bl-none'
            }`}>
              {msg.text}
              <div className={`text-[10px] mt-1 text-right ${
                msg.fromId === currentUser?.id ? 'text-white/70' : 'text-[var(--text-tertiary)]'
              }`}>
                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-[var(--text-tertiary)] text-xs py-8 flex flex-col items-center">
            <p>Нет сообщений</p>
            <p className="opacity-70 mt-1">Напишите менеджеру, если возникли вопросы</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 border-t border-[var(--border-color)] flex gap-2 bg-[var(--surface-1)]">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1 bg-[var(--surface-2)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] placeholder:text-[var(--text-tertiary)]"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className="p-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
