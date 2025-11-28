"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { X, Send, MapPin, User, Paperclip, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Attachment } from "@/lib/store";
import { cn } from "@/lib/utils";

export function MessageComposer() {
  const { t } = useLanguage();
  const { employees, locations, sendMessage, isMessageComposerOpen, messageComposerRecipientId, closeMessageComposer } = useStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Get all users (employees + managers)
  const allUsers = employees.filter(emp => emp.role === 'employee' || emp.role === 'manager');
  const managers = employees.filter(emp => emp.role === 'manager');
  const staff = employees.filter(emp => emp.role === 'employee');

  // Filter users by search query
  const filteredUsers = allUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update selectedIds when messageComposerRecipientId changes (single recipient mode)
  useEffect(() => {
    if (messageComposerRecipientId) {
      setSelectedIds([messageComposerRecipientId]);
    } else {
      setSelectedIds([]);
    }
  }, [messageComposerRecipientId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isMessageComposerOpen) {
      setSelectedIds([]);
      setMessageText("");
      setAttachments([]);
      setShowLocationPicker(false);
      setShowStaffPicker(false);
      setShowRecipientDropdown(false);
      setSearchQuery("");
    }
  }, [isMessageComposerOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRecipientDropdown(false);
      }
    };

    if (showRecipientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRecipientDropdown]);

  const handleToggleUser = (userId: string) => {
    setSelectedIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const allIds = allUsers.map(u => u.id);
    setSelectedIds(allIds);
  };

  const handleSelectManagers = () => {
    const managerIds = managers.map(m => m.id);
    setSelectedIds(prev => {
      const newIds = [...prev];
      managerIds.forEach(id => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      return newIds;
    });
  };

  const handleSelectStaff = () => {
    const staffIds = staff.map(s => s.id);
    setSelectedIds(prev => {
      const newIds = [...prev];
      staffIds.forEach(id => {
        if (!newIds.includes(id)) newIds.push(id);
      });
      return newIds;
    });
  };

  const handleRemoveChip = (userId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== userId));
  };

  const handleAddLocation = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (location && !attachments.find(a => a.id === locationId && a.type === 'location')) {
      setAttachments([...attachments, {
        type: 'location',
        id: locationId,
        label: location.name
      }]);
    }
    setShowLocationPicker(false);
  };

  const handleAddStaff = (staffId: string) => {
    const staff = employees.find(emp => emp.id === staffId);
    if (staff && !attachments.find(a => a.id === staffId && a.type === 'employee')) {
      setAttachments([...attachments, {
        type: 'employee',
        id: staffId,
        label: staff.name
      }]);
    }
    setShowStaffPicker(false);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleMessageAutoResize = (e: React.ChangeEvent<HTMLTextAreaElement> | React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget as HTMLTextAreaElement;
    el.style.height = "auto";
    const maxHeight = 120; // лимит высоты, ~4–5 строк
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = newHeight + "px";
  };

  // Сбрасываем высоту textarea при очистке текста
  useEffect(() => {
    if (!messageText && messageTextareaRef.current) {
      messageTextareaRef.current.style.height = "auto";
    }
  }, [messageText]);

  const handleSend = () => {
    if (selectedIds.length === 0 || !messageText.trim()) return;
    
    // Send message to each selected recipient
    selectedIds.forEach(recipientId => {
      sendMessage(recipientId, messageText, attachments);
    });
    
    closeMessageComposer();
    
    // Show toast
    alert(t("dashboard.msg_sent"));
  };

  const getSelectedUsers = () => {
    return allUsers.filter(u => selectedIds.includes(u.id));
  };

  const getUserInitial = (name: string) => {
    return name[0]?.toUpperCase() || "?";
  };

  const getRoleBadge = (role: string) => {
    if (role === 'manager') {
      return <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">{t("dashboard.role_manager")}</span>;
    }
    return <span className="text-[10px] px-1.5 py-0.5 bg-zinc-700/50 text-zinc-400 rounded">{t("dashboard.role_staff")}</span>;
  };

  if (!isMessageComposerOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={closeMessageComposer}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--surface-1)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {t("dashboard.msg_new_message")}
          </h2>
          <button
            onClick={closeMessageComposer}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Recipient Multi-Select */}
        <div className="mb-4 relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            {t("dashboard.msg_recipient")}
          </label>
          
          {/* Trigger Button */}
          <button
            type="button"
            onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
            className="w-full min-h-[48px] px-4 py-2 bg-[var(--surface-2)] border border-[var(--border-color)] rounded-xl text-left focus:border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 flex items-center gap-2 flex-wrap"
          >
            {selectedIds.length === 0 ? (
              <span className="text-zinc-400 text-sm">{t("dashboard.msg_select_contacts")}</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {getSelectedUsers().map(user => (
                  <div
                    key={user.id}
                    className="bg-white/10 text-xs px-2 py-1 rounded-full flex items-center gap-1 text-white"
                  >
                    <span>{user.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveChip(user.id);
                      }}
                      className="hover:text-rose-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {showRecipientDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-full bg-[var(--surface-2)] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 max-h-[300px] overflow-hidden flex flex-col"
              >
                {/* Quick Actions Header */}
                <div className="p-3 border-b border-[var(--border-color)] flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-[var(--border-color)]"
                  >
                    {t("dashboard.group_all")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectManagers}
                    className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-[var(--border-color)]"
                  >
                    {t("dashboard.group_managers")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectStaff}
                    className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-[var(--border-color)]"
                  >
                    {t("dashboard.group_staff")}
                  </button>
                </div>

                {/* Search */}
                <div className="p-3 border-b border-[var(--border-color)]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("dashboard.search_placeholder")}
                      className="w-full pl-10 pr-4 py-2 bg-[var(--surface-1)] border border-[var(--border-color)] rounded-lg text-sm text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
                    />
                  </div>
                </div>

                {/* User List */}
                <div className="overflow-y-auto max-h-[200px]">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-400">
                      {t("dashboard.msg_no_contacts")}
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedIds.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleToggleUser(user.id)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                        >
                          {/* Checkbox */}
                          <div className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-white/20 bg-transparent"
                          )}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>

                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm flex-shrink-0">
                            {getUserInitial(user.name)}
                          </div>

                          {/* Name */}
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-white">{user.name}</div>
                          </div>

                          {/* Role Badge */}
                          {getRoleBadge(user.role)}
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message - Telegram-style input */}
        <div className="mb-4">
          <div className="flex items-end gap-3">
            {/* Пузырь ввода */}
            <div className="flex-1 rounded-full bg-neutral-900 dark:bg-zinc-950 px-3 py-2 flex items-center gap-2 min-h-[36px] transition-all">
              <textarea
                ref={messageTextareaRef}
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleMessageAutoResize(e);
                }}
                onInput={handleMessageAutoResize}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed max-h-[120px] overflow-y-auto text-white placeholder:text-zinc-500 min-h-[20px]"
                placeholder={t("dashboard.msg_placeholder") || "Введите сообщение..."}
              />
            </div>
          </div>
        </div>

        {/* Attachments Toolbar */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Paperclip className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-400">{t("dashboard.msg_attachments")}</span>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setShowLocationPicker(!showLocationPicker);
                  setShowStaffPicker(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white transition-colors"
              >
                <MapPin className="h-4 w-4" />
                {t("dashboard.msg_attach_loc")}
              </button>
              {showLocationPicker && (
                <div className="absolute top-full mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleAddLocation(loc.id)}
                      className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-white text-sm transition-colors"
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => {
                  setShowStaffPicker(!showStaffPicker);
                  setShowLocationPicker(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white transition-colors"
              >
                <User className="h-4 w-4" />
                {t("dashboard.msg_attach_staff")}
              </button>
              {showStaffPicker && (
                <div className="absolute top-full mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                  {employees
                    .filter(emp => emp.role === 'employee')
                    .map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => handleAddStaff(emp.id)}
                        className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-white text-sm transition-colors"
                      >
                        {emp.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white"
                >
                  {attachment.type === 'location' ? (
                    <MapPin className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  <span>{attachment.label}</span>
                  <button
                    onClick={() => handleRemoveAttachment(index)}
                    className="hover:text-rose-400 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3">
          <button
            onClick={closeMessageComposer}
            className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors font-medium border border-zinc-700"
          >
            {t("dashboard.msg_cancel")}
          </button>
        </div>

        {/* Send Button - Fixed in bottom left */}
        <button
          onClick={handleSend}
          disabled={selectedIds.length === 0 || !messageText.trim()}
          className="fixed bottom-4 left-4 px-1.5 py-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg text-[10px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 z-[10000]"
        >
          <Send className="h-1.5 w-1.5" />
          <span>{t("dashboard.msg_send")} {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
        </button>
      </motion.div>
    </motion.div>
  );
}
