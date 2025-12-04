"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Mail, MapPin, Edit2, Keyboard, Copy, Check, Camera, ArrowLeft, Eye, EyeOff, X, Trophy, Award, Gift } from "lucide-react";
import { User, useStore } from "@/lib/store";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { useToastStore } from "@/lib/toast-store";

interface StaffPassportModalProps {
  employee: User;
  onClose: () => void;
}

type ModalMode = 'view' | 'edit' | 'fire_confirm';

export function StaffPassportModal({ employee, onClose }: StaffPassportModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [mode, setMode] = useState<ModalMode>('view');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { locations, currency, deleteUser, employees } = useStore();
  const toastStore = useToastStore();
  
  // Edited user state
  const [editedUser, setEditedUser] = useState<User>(employee);

  // Handle ESC key press, detect theme, and block body scroll
  useEffect(() => {
    setIsMounted(true);
    
    // Block body scroll when modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === 'edit' || mode === 'fire_confirm') {
          setMode('view');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    
    // Detect dark mode
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      // Restore body scroll
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleEsc);
      observer.disconnect();
    };
  }, [onClose, mode]);

  // Reset edited user when employee changes
  useEffect(() => {
    setEditedUser(employee);
  }, [employee]);

  // Find assigned location
  const assignedLocation = locations.find(loc => loc.id === employee.assignedPointId);

  // Copy to clipboard helper
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Calculate stats (mock data - in real app, calculate from shifts)
  const totalShifts = 127; // Mock - TODO: calculate from actual shifts
  const totalRevenue = (employee as any).totalRevenue || 1250000; // Mock or from employee data

  // Get initials for avatar
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Handle avatar upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setEditedUser({ ...editedUser, avatar: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle save changes
  const handleSave = async () => {
    try {
      // Update via API
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: employee.role,
          userId: employee.id,
          updates: {
            fullName: editedUser.fullName,
            name: editedUser.name,
            phone: editedUser.phone,
            email: editedUser.email,
            address: editedUser.address,
            dob: editedUser.dob,
            pin: editedUser.pin,
            avatar: editedUser.avatar,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user');
      }
      
      // Update local state
      const updatedUser = data.user;
      useStore.setState(state => ({
        employees: state.employees.map(emp => emp.id === updatedUser.id ? updatedUser : emp),
        users: state.users.map(user => user.id === updatedUser.id ? updatedUser : user),
      }));
      
      // Update employee prop (will trigger useEffect)
      Object.assign(employee, updatedUser);
      
      setMode('view');
      
      // Show toast
      toastStore.addToast(t("dashboard.profile_updated") || "Профиль обновлен", 'success');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toastStore.addToast(error.message || (t("dashboard.update_failed") || "Не удалось обновить профиль"), 'error');
    }
  };

  // Handle fire confirmation
  const handleFireConfirm = async () => {
    try {
      await deleteUser(employee.id, employee.role);
      onClose();
      // Toast will be shown by deleteUser action
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Get role badge text
  const getRoleBadge = () => {
    if (employee.role === 'manager') {
      return t("dashboard.role_manager") || "Manager";
    }
    return t("dashboard.role_staff") || "Employee";
  };

  // Render modal content
  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 top-0 left-0 z-[99999] h-screen w-screen bg-black/90 backdrop-blur-md flex items-center justify-center overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
      onClick={mode === 'view' ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl h-[600px] bg-[var(--surface-1)] border border-zinc-200 border-[var(--border-color)] shadow-2xl flex flex-col relative overflow-hidden rounded-sm"
        style={{
          position: 'relative',
          backgroundImage: isDark 
            ? `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)`
            : `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.02) 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      >
        <AnimatePresence mode="wait">
          {mode === 'view' && (
            <ViewMode
              key="view"
              employee={employee}
              assignedLocation={assignedLocation}
              totalShifts={totalShifts}
              totalRevenue={totalRevenue}
              currency={currency}
              initials={initials}
              isDark={isDark}
              t={t}
              onEdit={() => setMode('edit')}
              onFire={() => setMode('fire_confirm')}
              onClose={onClose}
              handleCopy={handleCopy}
              copiedField={copiedField}
            />
          )}
          
          {mode === 'edit' && (
            <EditMode
              key="edit"
              editedUser={editedUser}
              setEditedUser={setEditedUser}
              showPin={showPin}
              setShowPin={setShowPin}
              fileInputRef={fileInputRef}
              handleAvatarUpload={handleAvatarUpload}
              handleSave={handleSave}
              onBack={() => setMode('view')}
              isDark={isDark}
              t={t}
            />
          )}
        </AnimatePresence>

        {/* Fire Confirmation Overlay */}
        <AnimatePresence>
          {mode === 'fire_confirm' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setMode('view')}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--surface-1)] border border-zinc-200 border-[var(--border-color)] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
              >
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
                  {t("dashboard.confirm_fire") || "Подтвердите увольнение"}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                  {(t("dashboard.confirm_fire_message") || "Вы уверены, что хотите уволить {name}?").replace('{name}', employee.name)}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setMode('view')}
                    className="flex-1 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors font-medium"
                  >
                    {t("dashboard.btn_cancel") || "Отмена"}
                  </button>
                  <button
                    onClick={handleFireConfirm}
                    className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
                  >
                    {t("dashboard.confirm_fire_btn") || "Подтвердить увольнение"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  // Render via Portal to ensure it's at the top level of DOM
  if (typeof window === 'undefined' || !isMounted) {
    return null;
  }

  return createPortal(modalContent, document.body);
}

// VIEW MODE Component
function ViewMode({
  employee,
  assignedLocation,
  totalShifts,
  totalRevenue,
  currency,
  initials,
  isDark,
  t,
  onEdit,
  onFire,
  onClose,
  handleCopy,
  copiedField,
}: any) {
  const toastStore = useToastStore();
  return (
    <>
      {/* Main Content Grid - 2 Columns */}
      <div className="grid grid-cols-2 h-full flex-1 overflow-hidden">
        {/* COL 1: HERO (Left) */}
        <div className="relative overflow-hidden">
          {/* Background Image or Gradient */}
          {employee.avatar ? (
            <img
              src={employee.avatar}
              alt={employee.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-8xl font-black text-white/80">{initials}</span>
            </div>
          )}

          {/* Gradient Overlay at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white from-[var(--surface-1)] via-white/80 dark:via-black/80 to-transparent" />

          {/* Text Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
            <h2 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase mb-2">
              {employee.name}
            </h2>
            {employee.jobTitle && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                {employee.jobTitle}
              </p>
            )}
            <div className="inline-flex items-center px-3 py-1 bg-indigo-500/20 dark:bg-indigo-500/20 border border-indigo-500/50 dark:border-indigo-500/50 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-medium">
              {employee.role === 'manager' ? (t("dashboard.role_manager") || "Manager") : (t("dashboard.role_staff") || "Employee")}
            </div>
          </div>
        </div>

        {/* COL 2: INFO (Right) */}
        <div className="p-8 overflow-y-auto">
          <div className="space-y-6">
            {/* Workplace Block */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
                {t("dashboard.pass_workplace") || "Место работы"}
              </h3>
              {assignedLocation ? (
                <Link
                  href={`/dashboard/director/locations/${employee.assignedPointId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 dark:border-indigo-500/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 transition-colors text-sm font-medium"
                >
                  <MapPin className="h-4 w-4" />
                  {assignedLocation.name}
                </Link>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 rounded-lg text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  {t("dashboard.lbl_not_assigned") || "Не закреплен"}
                </div>
              )}
            </div>

            {/* Personal Data Block */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
                {t("dashboard.pass_contact") || "Личные данные"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                      {t("dashboard.lbl_phone") || "Телефон"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {employee.phone || "-"}
                      </span>
                      {employee.phone && (
                        <button
                          onClick={() => handleCopy(employee.phone!, "phone")}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                          title={t("dashboard.btn_copy") || "Копировать"}
                        >
                          {copiedField === "phone" ? (
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                      {t("dashboard.lbl_email") || "Email"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                        {employee.email || "-"}
                      </span>
                      {employee.email && (
                        <button
                          onClick={() => handleCopy(employee.email!, "email")}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-colors"
                          title={t("dashboard.btn_copy") || "Копировать"}
                        >
                          {copiedField === "email" ? (
                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 col-span-2">
                  <div className="w-8 h-8 rounded bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                      {t("dashboard.lbl_address") || "Адрес"}
                    </div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {employee.address || "-"}
                    </span>
                  </div>
                </div>

                {/* DOB */}
                <div className="flex items-start gap-3 col-span-2">
                  <div className="w-8 h-8 rounded bg-pink-500/10 dark:bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-0.5">
                      {t("dashboard.lbl_dob") || "Дата рождения"}
                    </div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {employee.dob ? new Date(employee.dob).toLocaleDateString('ru-RU') : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* HR Stats Block */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
                {t("dashboard.hr_stats") || "HR Статистика"}
              </h3>
              <div className="space-y-4">
                {/* Seniority */}
                {employee.hireDate && (() => {
                  const hireDate = new Date(employee.hireDate);
                  const now = new Date();
                  const years = now.getFullYear() - hireDate.getFullYear();
                  const months = now.getMonth() - hireDate.getMonth();
                  const totalMonths = years * 12 + months;
                  const displayYears = Math.floor(totalMonths / 12);
                  const displayMonths = totalMonths % 12;
                  return (
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">{t("dashboard.seniority") || "Стаж"}</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {displayYears} {t("dashboard.years") || "лет"} {displayMonths} {t("dashboard.months") || "мес."}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Vacation Days */}
                {employee.vacationDays && (
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{t("dashboard.vacation") || "Отпуск"}</span>
                      <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                        {employee.vacationDays.used}/{employee.vacationDays.total} {t("dashboard.days") || "дней"}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-teal-500"
                        style={{ width: `${(employee.vacationDays.used / employee.vacationDays.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sick Leave */}
                {employee.sickDays && (
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{t("dashboard.sick_leave") || "Больничные"}</span>
                      <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {employee.sickDays.used}/{employee.sickDays.total} {t("dashboard.days") || "дней"}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-rose-500"
                        style={{ width: `${(employee.sickDays.used / employee.sickDays.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Efficiency Gauge */}
                {employee.efficiency !== undefined && (
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{t("dashboard.efficiency") || "Эффективность"}</span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {employee.efficiency}%
                      </span>
                    </div>
                    <div className="relative w-full h-16 flex items-center justify-center">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-zinc-200 dark:text-zinc-800"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - employee.efficiency / 100)}`}
                          className="text-indigo-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute text-xs font-bold text-zinc-900 dark:text-white">
                        {employee.efficiency}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rewards Block */}
            {employee.rewards && employee.rewards.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
                  {t("dashboard.rewards") || "Награды"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {employee.rewards.map((reward: any) => (
                    <div
                      key={reward.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700/50 rounded-lg text-xs font-medium text-indigo-700 dark:text-indigo-400"
                    >
                      <Award className="h-3 w-3" />
                      <span>{reward.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Efficiency Block */}
            <div>
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
                {t("dashboard.pass_metrics") || "Эффективность"}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-white/5">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("dashboard.metric_shifts") || "Всего смен"}</span>
                  <span className="text-xl font-bold text-zinc-900 dark:text-white">{totalShifts}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-white/5">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("dashboard.metric_revenue") || "Выручка"}</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {totalRevenue.toLocaleString("ru-RU")} {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="h-auto min-h-16 border-t border-zinc-200 border-[var(--border-color)] bg-zinc-50 bg-[var(--surface-2)] flex flex-col gap-3 px-8 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800/50 hover:bg-zinc-300 dark:hover:bg-zinc-800 border border-zinc-300 border-[var(--border-color)] rounded text-sm text-zinc-700 dark:text-white hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--surface-1)] border border-zinc-300 border-[var(--border-color)] rounded text-xs font-mono text-zinc-700 dark:text-zinc-300">
              <Keyboard className="h-3 w-3" />
              ESC
            </div>
            <span>{t("dashboard.pass_back") || "Вернуться"}</span>
          </button>

          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-4 py-2 bg-indigo-500/10 dark:bg-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 border border-indigo-500/30 dark:border-indigo-500/50 text-indigo-600 dark:text-indigo-400 rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              {t("dashboard.pass_edit") || "Редактировать профиль"}
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onFire();
              }}
              className="px-4 py-2 bg-rose-500/10 dark:bg-rose-500/20 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 border border-rose-500/30 dark:border-rose-500/50 text-rose-600 dark:text-rose-500 rounded text-sm font-medium transition-colors flex items-center gap-2"
            >
              {t("dashboard.pass_fire") || "Уволить"}
            </button>
          </div>
        </div>

        {/* Manager Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-zinc-200 dark:border-white/5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement award bonus modal
              toastStore.addToast(t("dashboard.bonus_awarded") || "Бонус начислен", 'success');
            }}
            className="px-3 py-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 border border-emerald-500/30 dark:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Gift className="h-3.5 w-3.5" />
            {t("dashboard.award_bonus") || "Начислить бонус"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Implement toggle employee of month
              const newStatus = !employee.isEmployeeOfMonth;
              toastStore.addToast(
                newStatus 
                  ? (t("dashboard.employee_of_month_set") || "Сотрудник месяца установлен")
                  : (t("dashboard.employee_of_month_removed") || "Статус снят"),
                'success'
              );
            }}
            className="px-3 py-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 border border-indigo-500/30 dark:border-indigo-500/50 text-indigo-600 dark:text-indigo-400 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Trophy className="h-3.5 w-3.5" />
            {employee.isEmployeeOfMonth 
              ? (t("dashboard.remove_hero") || "Убрать статус")
              : (t("dashboard.make_hero") || "Сотрудник месяца")}
          </button>
        </div>
      </div>
    </>
  );
}

// EDIT MODE Component
function EditMode({
  editedUser,
  setEditedUser,
  showPin,
  setShowPin,
  fileInputRef,
  handleAvatarUpload,
  handleSave,
  onBack,
  isDark,
  t,
}: any) {
  return (
    <>
      {/* Header */}
      <div className="h-16 border-b border-zinc-200 border-[var(--border-color)] bg-zinc-50 bg-[var(--surface-2)] flex items-center justify-between px-8 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("dashboard.pass_back_to_profile") || "Back to Profile"}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
              {t("dashboard.pass_photo_label") || "Profile Photo"}
            </label>
            <div className="flex items-center gap-6">
              {editedUser.avatar ? (
                <img
                  src={editedUser.avatar}
                  alt={editedUser.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-3xl font-black text-white/80 border-4 border-zinc-200 dark:border-zinc-700">
                  {editedUser.name[0].toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500"
              >
                <Camera className="h-4 w-4" />
                <span>{t("dashboard.pass_upload") || "Upload New Photo"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                {t("dashboard.lbl_full_name") || "Full Name"}
              </label>
              <input
                type="text"
                value={editedUser.fullName || editedUser.name || ""}
                onChange={(e) => {
                  const fullName = e.target.value;
                  setEditedUser({ 
                    ...editedUser, 
                    fullName, 
                    name: fullName.split(' ')[0] || fullName 
                  });
                }}
                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 border-[var(--border-color)] rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                {t("dashboard.lbl_phone") || "Телефон"}
              </label>
              <input
                type="tel"
                value={editedUser.phone || ""}
                onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 border-[var(--border-color)] rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                {t("dashboard.lbl_email") || "Email"}
              </label>
              <input
                type="email"
                value={editedUser.email || ""}
                onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 border-[var(--border-color)] rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                {t("dashboard.lbl_address") || "Адрес"}
              </label>
              <input
                type="text"
                value={editedUser.address || ""}
                onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 border-[var(--border-color)] rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* DOB */}
            <div>
              <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                {t("dashboard.lbl_dob") || "Дата рождения"}
              </label>
              <input
                type="date"
                value={editedUser.dob || ""}
                onChange={(e) => setEditedUser({ ...editedUser, dob: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 border-[var(--border-color)] rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* PIN (for employees) */}
            {editedUser.role === 'employee' && (
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                  {t("dashboard.employee_pin") || "PIN"}
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    value={editedUser.pin || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setEditedUser({ ...editedUser, pin: value });
                    }}
                    maxLength={4}
                    className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 border-[var(--border-color)] rounded-lg text-zinc-900 dark:text-white font-mono text-center focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="h-16 border-t border-zinc-200 border-[var(--border-color)] bg-zinc-50 bg-[var(--surface-2)] flex items-center justify-end px-8 flex-shrink-0">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors font-medium"
        >
          {t("dashboard.pass_save") || "Save Changes"}
        </button>
      </div>
    </>
  );
}
