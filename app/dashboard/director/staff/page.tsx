"use client";

import { useLanguage } from "@/components/language-provider";
import useStore, { User } from "@/lib/store";
import { UserPlus, AlertTriangle, Users, MapPin, Briefcase, Dice1, ChevronDown, X, Plus, Check, Filter, Search, Eye, Lock, Mail } from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { StaffPassportModal } from "@/components/dashboard/staff-passport-modal";
import { useRouter } from "next/navigation";

export default function StaffPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { employees, locations, currency, shifts, addEmployee, deleteUser, openMessageComposer, updateProfile, currentUser } = useStore();
  
  // Filters
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [problemsFilter, setProblemsFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Wizard state
  const [isAdding, setIsAdding] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    role: "" as "employee" | "manager" | "",
    name: "",
    authType: "" as "pin" | "email" | "",
    pin: "",
    email: "",
    password: "",
    assignedPointId: "",
  });

  const [selectedPassport, setSelectedPassport] = useState<User | null>(null);

  // Calculate staff metrics
  const staffWithMetrics = useMemo(() => {
    return employees.map(employee => {
      // Get employee shifts
      const employeeShifts = shifts.filter(s => s.employeeId === employee.id);
      
      // Get last shift
      const lastShift = employeeShifts
        .sort((a, b) => b.date - a.date)[0] || null;
      
      // Count problematic shifts
      const problematicShiftsCount = employeeShifts.filter(s => s.status === 'issue').length;
      
      // Get assigned location
      const assignedLocation = locations.find(loc => loc.id === employee.assignedPointId);
      
      return {
        ...employee,
        lastShift,
        problematicShiftsCount,
        assignedLocation,
      };
    });
  }, [employees, shifts, locations]);

  // Filter staff
  const filteredStaff = useMemo(() => {
    return staffWithMetrics.filter(staff => {
      // Location filter
      if (locationFilter !== "all" && staff.assignedPointId !== locationFilter) {
        return false;
      }
      
      // Role filter
      if (roleFilter !== "all" && staff.role !== roleFilter) {
        return false;
      }
      
      // Problems filter
      if (problemsFilter === "problems" && staff.problematicShiftsCount === 0) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = (staff.name || "").toLowerCase().includes(query);
        const fullNameMatch = (staff.fullName || "").toLowerCase().includes(query);
        const emailMatch = (staff.email || "").toLowerCase().includes(query);
        return nameMatch || fullNameMatch || emailMatch;
      }
      
      return true;
    });
  }, [staffWithMetrics, locationFilter, roleFilter, problemsFilter, searchQuery]);

  // Generate PIN
  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setWizardData({ ...wizardData, pin });
  };

  // Generate Password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWizardData({ ...wizardData, password });
  };

  // Handle wizard completion
  const handleWizardComplete = async () => {
    if (!wizardData.role || !wizardData.name) return;

    if (wizardData.role === 'manager') {
      if (!wizardData.email || !wizardData.password) return;
      await addEmployee({
        name: wizardData.name.split(' ')[0] || wizardData.name,
        fullName: wizardData.name,
        email: wizardData.email,
        password: wizardData.password,
        role: "manager",
        status: "active",
        assignedPointId: wizardData.assignedPointId || undefined,
      });
    } else {
      if (!wizardData.pin) return;
      await addEmployee({
        name: wizardData.name.split(' ')[0] || wizardData.name,
        fullName: wizardData.name,
        pin: wizardData.pin,
        role: "employee",
        status: "active",
        assignedPointId: wizardData.assignedPointId || undefined,
      });
    }

    // Reset wizard
    setIsAdding(false);
    setWizardStep(1);
    setWizardData({
      role: "",
      name: "",
      authType: "",
      pin: "",
      email: "",
      password: "",
      assignedPointId: "",
    });
  };

  // Empty state
  if (employees.length === 0 && !isAdding) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[600px] px-4">
          <div className="text-center max-w-md w-full space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Персонал
              </h1>
              <p className="text-base text-muted-foreground">
                Контроль сотрудников по всей сети
              </p>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground">
              В системе пока нет сотрудников
            </p>

            {/* Primary CTA */}
            <div className="mt-8">
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
              >
                Добавить первого сотрудника
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Helper text */}
            <p className="text-sm text-muted-foreground mt-6">
              Назначьте сотрудников на точки, чтобы начать работу со сменами
            </p>
          </div>
        </div>

        {/* Add Staff Wizard (if opened) */}
        {isAdding && <AddStaffWizard />}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Персонал</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Контроль сотрудников по всей сети
            </p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            Добавить сотрудника
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">По точке: Все</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">По роли: Все</option>
            <option value="employee">Сотрудник</option>
            <option value="manager">Менеджер</option>
          </select>

          {/* Problems Filter */}
          <select
            value={problemsFilter}
            onChange={(e) => setProblemsFilter(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">По проблемам: Все</option>
            <option value="problems">С проблемами</option>
          </select>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени или email..."
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Add Staff Wizard */}
      {isAdding && <AddStaffWizard />}

      {/* Staff Cards */}
      {filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              currency={currency}
              onClick={() => setSelectedPassport(staff)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery || locationFilter !== "all" || roleFilter !== "all" || problemsFilter !== "all"
              ? "Нет сотрудников, соответствующих фильтрам"
              : "Нет добавленных сотрудников"}
          </p>
        </div>
      )}

      {/* Staff Passport Modal */}
      <AnimatePresence>
        {selectedPassport && (
          <StaffPassportModal
            employee={selectedPassport}
            onClose={() => setSelectedPassport(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );

  // Add Staff Wizard Component
  function AddStaffWizard() {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-card border border-border rounded-xl p-6 sm:p-8"
        >
          {/* Wizard Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-1">
                {wizardStep === 1 && "Тип сотрудника"}
                {wizardStep === 2 && "Основная информация"}
                {wizardStep === 3 && "Назначение"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Шаг {wizardStep} из 3
              </p>
            </div>
            <button
              onClick={() => {
                setIsAdding(false);
                setWizardStep(1);
                setWizardData({
                  role: "",
                  name: "",
                  authType: "",
                  pin: "",
                  email: "",
                  password: "",
                  assignedPointId: "",
                });
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      wizardStep >= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {wizardStep > step ? <Check className="h-4 w-4" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2 transition-colors",
                        wizardStep > step ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Wizard Steps */}
          <div className="space-y-6">
            {/* STEP 1: Staff Type */}
            {wizardStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setWizardData({ ...wizardData, role: "employee" })}
                    className={cn(
                      "p-6 rounded-xl border-2 transition-all text-left",
                      wizardData.role === "employee"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        wizardData.role === "employee" ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Users className={cn(
                          "h-5 w-5",
                          wizardData.role === "employee" ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <span className="font-semibold text-foreground">Сотрудник</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Вход по PIN-коду
                    </p>
                  </button>

                  <button
                    onClick={() => setWizardData({ ...wizardData, role: "manager" })}
                    className={cn(
                      "p-6 rounded-xl border-2 transition-all text-left",
                      wizardData.role === "manager"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        wizardData.role === "manager" ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Briefcase className={cn(
                          "h-5 w-5",
                          wizardData.role === "manager" ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <span className="font-semibold text-foreground">Менеджер</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Вход по email и паролю
                    </p>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (wizardData.role) {
                      setWizardStep(2);
                      // Set auth type based on role
                      if (wizardData.role === "employee") {
                        setWizardData({ ...wizardData, authType: "pin" });
                      } else {
                        setWizardData({ ...wizardData, authType: "email" });
                      }
                    }
                  }}
                  disabled={!wizardData.role}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Продолжить
                </button>
              </motion.div>
            )}

            {/* STEP 2: Basic Info */}
            {wizardStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Имя <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={wizardData.name}
                    onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                    placeholder="Полное имя"
                    className="w-full h-12 px-4 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all"
                    required
                  />
                </div>

                {wizardData.role === "employee" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      PIN <span className="text-destructive">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={wizardData.pin}
                        onChange={(e) => setWizardData({ ...wizardData, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        placeholder="4 цифры"
                        maxLength={4}
                        className="flex-1 h-12 px-4 bg-background border border-border rounded-xl text-center text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={generatePin}
                        className="h-12 px-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors border border-border"
                        title="Сгенерировать PIN"
                      >
                        <Dice1 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {wizardData.role === "manager" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="email"
                        value={wizardData.email}
                        onChange={(e) => setWizardData({ ...wizardData, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full h-12 px-4 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Пароль <span className="text-destructive">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={wizardData.password}
                          onChange={(e) => setWizardData({ ...wizardData, password: e.target.value })}
                          placeholder="Минимум 6 символов"
                          className="flex-1 h-12 px-4 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all font-mono"
                          required
                        />
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="h-12 px-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors border border-border"
                          title="Сгенерировать пароль"
                        >
                          <Dice1 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="flex-1 px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => {
                      if (wizardData.name && (wizardData.role === "employee" ? wizardData.pin : wizardData.email && wizardData.password)) {
                        setWizardStep(3);
                      }
                    }}
                    disabled={!wizardData.name || (wizardData.role === "employee" ? !wizardData.pin : !wizardData.email || !wizardData.password)}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Продолжить
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Assignment */}
            {wizardStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Назначить на точку
                  </label>
                  <div className="relative">
                    <select
                      value={wizardData.assignedPointId}
                      onChange={(e) => setWizardData({ ...wizardData, assignedPointId: e.target.value })}
                      className="w-full h-12 px-4 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all appearance-none pr-10"
                    >
                      <option value="">Пропустить (можно добавить позже)</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Назначение можно изменить позже
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="flex-1 px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium"
                  >
                    Назад
                  </button>
                  <button
                    onClick={handleWizardComplete}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
                  >
                    Готово
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
}

// Staff Card Component
function StaffCard({ staff, currency, onClick }: { staff: any, currency: string, onClick: () => void }) {
  const hasProblems = staff.problematicShiftsCount > 0;
  const lastShiftDate = staff.lastShift 
    ? new Date(staff.lastShift.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : null;
  const lastShiftStatus = staff.lastShift?.status === 'issue' ? 'Проблемы' : 'OK';

  // Get initials for avatar
  const initials = (staff.name || "")
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer hover:border-primary/30",
        hasProblems && "border-red-500/50 bg-red-500/5"
      )}
    >
      {/* Header: Name and Role Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          {staff.avatar ? (
            <img
              src={staff.avatar}
              alt={staff.name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-border"
            />
          ) : (
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 border-2",
              staff.role === 'manager'
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-muted text-muted-foreground border-border'
            )}>
              {initials}
            </div>
          )}
          
          {/* Name and Role */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {staff.name || staff.fullName || "Без имени"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium",
                staff.role === 'manager'
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted text-muted-foreground border border-border"
              )}>
                {staff.role === 'manager' ? 'Менеджер' : 'Сотрудник'}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium",
                staff.status === 'active'
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground border border-border"
              )}>
                {staff.status === 'active' ? 'Активен' : 'Заблокирован'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Назначенная точка:</span>
          <span className="text-foreground font-medium truncate">
            {staff.assignedLocation ? staff.assignedLocation.name : "Не назначен"}
          </span>
        </div>
      </div>

      {/* Operational Signals */}
      <div className="space-y-2 mb-4">
        {/* Last Shift */}
        {lastShiftDate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Последняя смена:</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground">{lastShiftDate}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-xs font-medium",
                lastShiftStatus === 'Проблемы'
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              )}>
                {lastShiftStatus}
              </span>
            </div>
          </div>
        )}

        {/* Problematic Shifts Count */}
        {hasProblems && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Проблемные смены:</span>
            <span className="text-red-600 dark:text-red-400 font-semibold">
              {staff.problematicShiftsCount}
            </span>
          </div>
        )}
      </div>

      {/* Secondary Info */}
      <div className="pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {staff.role === 'employee' && staff.pin && (
            <>
              <Lock className="h-3.5 w-3.5" />
              <span>PIN: {staff.pin}</span>
            </>
          )}
          {staff.role === 'manager' && staff.email && (
            <>
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{staff.email}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
