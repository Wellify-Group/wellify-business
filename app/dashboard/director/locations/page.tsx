"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { Plus, Trash2, MapPin, Edit2, MoreVertical, BarChart3, X, User, ChevronLeft, ChevronRight, UserPlus, Dices, Check, Pencil, Briefcase, PauseCircle, PlayCircle, ChevronRight as ChevronRightIcon, Search, Filter, AlertTriangle, DollarSign, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { INDUSTRIES_ARRAY, INDUSTRIES } from "@/lib/industries";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";



interface EmployeeRow {
  id: string;
  name: string;
  pin: string;
  isConfirmed: boolean;
  role: 'manager' | 'employee';
}

function LocationsContent() {
  const { t } = useLanguage();
  const {
    locations,
    currency,
    shifts,
    employees,
    updateFormConfig,
    addLocation,
    addEmployee,
    currentUser,
    toggleLocationPause,
    deleteLocation,
    fetchLocations,
    savedCompanyId,
  } = useStore();    
  const { toast, success } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState({ name: "", address: "", dailyPlan: "" });
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [newEmployees, setNewEmployees] = useState<EmployeeRow[]>([]);
  const [newManager, setNewManager] = useState<EmployeeRow | null>(null);
  const industryScrollRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "problems">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardData, setWizardData] = useState({
    name: "",
    businessType: "",
    currency: currency || "₴",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    managerId: null as string | null,
  });
  
  // Всегда синхронизируем локации с сервером при заходе на страницу
  useEffect(() => {
    // Пытаемся взять businessId из текущего пользователя или из savedCompanyId
    let effectiveBusinessId =
      currentUser?.businessId ||
      savedCompanyId ||
      (locations.length > 0 ? locations[0].businessId : null);

    if (!effectiveBusinessId) {
      // Для новых пользователей без бизнеса это нормально - просто не загружаем локации
      // Предупреждение убрано, так как это не ошибка
      return;
    }

    fetchLocations(effectiveBusinessId);
  }, [currentUser?.businessId, savedCompanyId, fetchLocations]);

  // Show industry selection only for first location
  const isFirstLocation = locations.length === 0;

  // Auto-open modal if action=new in URL
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsAdding(true);
    }
  }, [searchParams]);

  // Calculate today's date range
  const today = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).getTime();
    return { start: startOfDay, end: endOfDay };
  }, []);

  // Get today's shifts
  const todayShifts = useMemo(() => {
    return shifts.filter(s => s.date >= today.start && s.date <= today.end);
  }, [shifts, today]);

  // Calculate revenue and status for each location
  const locationsWithData = useMemo(() => {
    return locations.map(location => {
      // Get shifts for this location
      const locShifts = todayShifts.filter(s => s.locationId === location.id);
      const locRevenue = locShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      const locPlanPercent = location.dailyPlan && location.dailyPlan > 0 
        ? Math.round((locRevenue / location.dailyPlan) * 100) 
        : 0;
      
      // Check for active shift (no clockOut means shift is active)
      const hasActiveShift = locShifts.some(s => !s.clockOut);
      
      // Count problematic shifts (status === 'issue')
      const problematicShiftsCount = locShifts.filter(s => s.status === 'issue').length;
      
      // Determine if location has problems
      const hasProblems = problematicShiftsCount > 0 || location.status === 'error' || location.status === 'red';
      
      // Get manager dynamically from employees list
      const currentManager = location.managerId 
        ? employees.find(e => e.id === location.managerId)
        : null;

      return {
        ...location,
        revenue: locRevenue,
        planPercent: locPlanPercent,
        manager: currentManager,
        hasActiveShift,
        problematicShiftsCount,
        hasProblems
      };
    });
  }, [locations, todayShifts, employees]);

  // Filter locations based on status and search
  const filteredLocations = useMemo(() => {
    let filtered = locationsWithData.filter(loc => loc.status !== 'archived');
    
    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter(loc => loc.status === 'active' || loc.status === 'green');
    } else if (statusFilter === "paused") {
      filtered = filtered.filter(loc => loc.status === 'paused');
    } else if (statusFilter === "problems") {
      filtered = filtered.filter(loc => loc.hasProblems);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(loc => 
        loc.name.toLowerCase().includes(query) ||
        loc.address?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [locationsWithData, statusFilter, searchQuery]);

  const scrollIndustry = (direction: "left" | "right") => {
    if (!industryScrollRef.current) return;
    
    const container = industryScrollRef.current;
    const cardWidth = (container.clientWidth - 24) / 3;
    const scrollAmount = cardWidth * 3 + 24;
    const { scrollLeft, scrollWidth } = container;
    const maxScroll = scrollWidth - container.clientWidth;

    if (direction === "right") {
      const newScroll = scrollLeft + scrollAmount;
      if (newScroll >= maxScroll - 1) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollTo({ left: newScroll, behavior: "smooth" });
      }
    } else {
      const newScroll = scrollLeft - scrollAmount;
      if (newScroll <= 1) {
        container.scrollTo({ left: maxScroll, behavior: "smooth" });
      } else {
        container.scrollTo({ left: newScroll, behavior: "smooth" });
      }
    }
  };

  const handleIndustrySelect = (industrySlug: string) => {
    setSelectedIndustry(industrySlug);
    // Also update wizard data if in wizard mode
    if (wizardStep === 1) {
      setWizardData({ ...wizardData, businessType: industrySlug });
    }
    
    // Update form config based on industry
    const profile = INDUSTRIES[industrySlug] || INDUSTRIES['cafe'];
    const defaultFormConfig = {
      showCash: true,
      showCard: true,
      showGuests: false,
      showPhoto: false,
      showNotes: true,
      showTips: false
    };
    
    const formConfig = { ...defaultFormConfig };
    profile.recommendedFields.forEach(field => {
      if (field === 'field_cash') formConfig.showCash = true;
      if (field === 'field_card') formConfig.showCard = true;
      if (field === 'field_guests') formConfig.showGuests = true;
      if (field === 'field_tips') formConfig.showTips = true;
    });
    
    updateFormConfig(formConfig);
  };

  const generatePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleAddEmployee = () => {
    setNewEmployees([...newEmployees, {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: "",
      pin: generatePin(),
      isConfirmed: false,
      role: 'employee'
    }]);
  };

  const handleAddManager = () => {
    setNewManager({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: "",
      pin: generatePin(),
      isConfirmed: false,
      role: 'manager'
    });
  };

  const handleRemoveManager = () => {
    setNewManager(null);
  };

  const handleUpdateManager = (field: 'name' | 'pin', value: string) => {
    if (newManager) {
      setNewManager({ ...newManager, [field]: value });
    }
  };

  const handleConfirmManager = () => {
    if (newManager && newManager.name.trim() && newManager.pin.trim()) {
      setNewManager({ ...newManager, isConfirmed: true });
    }
  };

  const handleEditManager = () => {
    if (newManager) {
      setNewManager({ ...newManager, isConfirmed: false });
    }
  };

  const handleRemoveEmployee = (id: string) => {
    setNewEmployees(newEmployees.filter(emp => emp.id !== id));
  };

  const handleUpdateEmployee = (id: string, field: 'name' | 'pin' | 'role', value: string) => {
    setNewEmployees(newEmployees.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    ));
  };

  const handleConfirmEmployee = (id: string) => {
    const emp = newEmployees.find(e => e.id === id);
    if (emp && emp.name.trim() && emp.pin.trim()) {
      setNewEmployees(newEmployees.map(e => 
        e.id === id ? { ...e, isConfirmed: true } : e
      ));
    }
  };

  const handleEditEmployee = (id: string) => {
    setNewEmployees(newEmployees.map(e => 
      e.id === id ? { ...e, isConfirmed: false } : e
    ));
  };

  const handleAdd = async () => {
    if (newLocation.name && newLocation.address) {
      // If first location and industry selected, it's already configured
      if (isFirstLocation && selectedIndustry) {
        // Industry config already applied via handleIndustrySelect
      }
      
      // Add location
      const locationId = await addLocation({
        name: newLocation.name,
        address: newLocation.address,
        status: 'active',
        dailyPlan: newLocation.dailyPlan ? parseInt(newLocation.dailyPlan) : undefined,
        managerId: newManager && newManager.isConfirmed && newManager.name.trim() 
          ? employees.find(e => e.name === newManager.name.trim() && e.pin === newManager.pin.trim())?.id || null
          : null
      });

      // Refresh locations list from server
      const effectiveBusinessId = currentUser?.businessId || savedCompanyId;
      if (effectiveBusinessId) {
        await fetchLocations(effectiveBusinessId);
      }

      // Auto-confirm any pending rows before adding
      const confirmedEmployees = newEmployees.map(emp => {
        if (!emp.isConfirmed && emp.name.trim() && emp.pin.trim()) {
          return { ...emp, isConfirmed: true };
        }
        return emp;
      });
      setNewEmployees(confirmedEmployees);

      // Add manager if set
      if (newManager && newManager.name.trim() && newManager.pin.trim()) {
        const managerId = addEmployee({
          name: newManager.name.trim(),
          pin: newManager.pin.trim(),
          role: 'manager',
          status: 'active',
          assignedPointId: locationId
        });
        // Assign manager to location
        // Note: This would need to be done via updateLocationProfile in real implementation
      }

      // Add employees if any
      confirmedEmployees.forEach(emp => {
        if (emp.name.trim() && emp.pin.trim()) {
          addEmployee({
            name: emp.name.trim(),
            pin: emp.pin.trim(),
            role: emp.role || 'employee',
            status: 'active',
            assignedPointId: locationId
          });
        }
      });
      
      // Reset form
      setNewLocation({ name: "", address: "", dailyPlan: "" });
      setSelectedIndustry("");
      setNewEmployees([]);
      setNewManager(null);
      setIsAdding(false);
    }
  };

  const handleEdit = (location: any) => {
    setEditingLocation(location.id);
    setNewLocation({
      name: location.name,
      address: location.address,
      dailyPlan: location.dailyPlan?.toString() || ""
    });
    setIsAdding(true);
  };

  const handleSaveEdit = () => {
    if (editingLocation && newLocation.name && newLocation.address) {
      // In a real app, this would call updateLocation from store
      setEditingLocation(null);
      setNewLocation({ name: "", address: "", dailyPlan: "" });
      setIsAdding(false);
    }
  };

  const getStatusDot = (status: string) => {
    if (status === 'active' || status === 'green') {
      return <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />;
    }
    if (status === 'paused' || status === 'yellow') {
      return <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />;
    }
    if (status === 'archived') {
      return <div className="w-3 h-3 rounded-full bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.5)]" />;
    }
    if (status === 'error' || status === 'red') {
      return <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />;
    }
    return <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
      case 'green':
        return t("dashboard.loc_active");
      case 'paused':
      case 'yellow':
        return t("dashboard.location_status_paused");
      case 'archived':
        return t("dashboard.location_status_archived");
      case 'error':
      case 'red':
        return t("dashboard.loc_problem");
      default:
        return t("dashboard.loc_active");
    }
  };

  const handlePauseLocation = (id: string) => {
    toggleLocationPause(id);
  };

  const handleDeleteLocation = (id: string) => {
    setDeleteLocationId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteLocationId) {
      await deleteLocation(deleteLocationId);
      setDeleteLocationId(null);
      setDeleteConfirmOpen(false);
    }
  };

  // Empty state
  if (locations.length === 0 && !isAdding) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[600px] px-4">
          <div className="text-center max-w-md w-full space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Точки продаж
              </h1>
              <p className="text-base text-muted-foreground">
                Управление всеми торговыми точками сети
              </p>
            </div>

            {/* Primary CTA */}
            <div className="mt-8">
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
              >
                Добавить первую точку
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Supporting text */}
            <p className="text-sm text-muted-foreground mt-6">
              После добавления точки вы сможете отслеживать выручку, смены и проблемы
            </p>
          </div>
        </div>

        {/* Add Location Form (if opened) */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card border border-border rounded-xl p-6 sm:p-8"
            >
              {/* Form will be rendered in the main return - we need to move it here or keep it in main return */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Точки продаж</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Управление всеми торговыми точками сети
          </p>
        </div>

        {/* Controls: Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="paused">Приостановленные</option>
              <option value="problems">Проблемные</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или адресу..."
              className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Add Location Button (only when locations exist) */}
          {locations.length > 0 && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              <Plus className="h-4 w-4" />
              Добавить точку
            </button>
          )}
        </div>
      </div>

      {/* Add Location Wizard */}
      <AnimatePresence>
        {isAdding && !editingLocation && (
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
                  {wizardStep === 1 && "Добавление точки продаж"}
                  {wizardStep === 2 && "Операционные настройки"}
                  {wizardStep === 3 && "Точка почти готова"}
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
                    name: "",
                    businessType: "",
                    currency: currency || "₴",
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    managerId: null,
                  });
                  setSelectedIndustry("");
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
              {/* STEP 1: Basic Info */}
              {wizardStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Название точки <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={wizardData.name}
                      onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                      placeholder="Например: Кафе на Ленина"
                      className="w-full h-12 px-4 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Тип бизнеса <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={wizardData.businessType}
                      onChange={(e) => {
                        setWizardData({ ...wizardData, businessType: e.target.value });
                        if (e.target.value) {
                          handleIndustrySelect(e.target.value);
                        }
                      }}
                      className="w-full h-12 px-4 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all"
                      required
                    >
                      <option value="">Выберите тип</option>
                      <option value="cafe">Кафе / Ресторан</option>
                      <option value="coffee">Кофейня</option>
                      <option value="shop">Магазин</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (wizardData.name && wizardData.businessType) {
                        setWizardStep(2);
                      }
                    }}
                    disabled={!wizardData.name || !wizardData.businessType}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Продолжить
                  </button>
                </motion.div>
              )}

              {/* STEP 2: Operations Setup */}
              {wizardStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Валюта точки <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={wizardData.currency}
                      onChange={(e) => setWizardData({ ...wizardData, currency: e.target.value })}
                      className="w-full h-12 px-4 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all"
                      required
                    >
                      <option value="₴">₴ Гривна (UAH)</option>
                      <option value="$">$ Доллар (USD)</option>
                      <option value="€">€ Евро (EUR)</option>
                      <option value="₽">₽ Рубль (RUB)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Часовой пояс
                    </label>
                    <input
                      type="text"
                      value={wizardData.timezone}
                      onChange={(e) => setWizardData({ ...wizardData, timezone: e.target.value })}
                      className="w-full h-12 px-4 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Определён автоматически, можно изменить
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Менеджер точки
                    </label>
                    <select
                      value={wizardData.managerId || ""}
                      onChange={(e) => setWizardData({ ...wizardData, managerId: e.target.value || null })}
                      className="w-full h-12 px-4 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/60 focus:outline-none transition-all"
                    >
                      <option value="">Пропустить (можно добавить позже)</option>
                      {employees
                        .filter(emp => emp.role === 'manager')
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Эти настройки можно изменить позже
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="flex-1 px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium"
                    >
                      Назад
                    </button>
                    <button
                      onClick={() => setWizardStep(3)}
                      className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
                    >
                      Продолжить
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Finalization */}
              {wizardStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Summary */}
                  <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Название</span>
                      <span className="text-sm font-medium text-foreground">{wizardData.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Тип бизнеса</span>
                      <span className="text-sm font-medium text-foreground">
                        {wizardData.businessType === "cafe" && "Кафе / Ресторан"}
                        {wizardData.businessType === "coffee" && "Кофейня"}
                        {wizardData.businessType === "shop" && "Магазин"}
                        {wizardData.businessType === "other" && "Другое"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Валюта</span>
                      <span className="text-sm font-medium text-foreground">{wizardData.currency}</span>
                    </div>
                    {wizardData.managerId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Менеджер</span>
                        <span className="text-sm font-medium text-foreground">
                          {employees.find(e => e.id === wizardData.managerId)?.name || "—"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* What's next */}
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <p className="text-sm font-medium text-foreground mb-2">Что дальше?</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Можно добавить сотрудников</li>
                      <li>Можно настроить отчёт смены</li>
                    </ul>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="flex-1 px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors font-medium"
                    >
                      Назад
                    </button>
                    <button
                      onClick={async () => {
                        // Apply industry config if first location
                        if (isFirstLocation && wizardData.businessType) {
                          handleIndustrySelect(wizardData.businessType);
                        }
                        
                        // Create location with wizard data
                        const locationId = await addLocation({
                          name: wizardData.name,
                          address: "", // Can be added later
                          status: 'active',
                          dailyPlan: undefined,
                          managerId: wizardData.managerId,
                        });
                        
                        // Refresh locations list from server
                        const effectiveBusinessId = currentUser?.businessId || savedCompanyId;
                        if (effectiveBusinessId) {
                          await fetchLocations(effectiveBusinessId);
                        }
                        
                        // Reset wizard
                        setIsAdding(false);
                        setWizardStep(1);
                        setWizardData({
                          name: "",
                          businessType: "",
                          currency: currency || "₴",
                          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                          managerId: null,
                        });
                        setSelectedIndustry("");
                        
                        success("Точка создана");
                      }}
                      className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
                    >
                      Создать точку
                    </button>
                    <button
                      onClick={async () => {
                        // Apply industry config if first location
                        if (isFirstLocation && wizardData.businessType) {
                          handleIndustrySelect(wizardData.businessType);
                        }
                        
                        const locationId = await addLocation({
                          name: wizardData.name,
                          address: "",
                          status: 'active',
                          dailyPlan: undefined,
                          managerId: wizardData.managerId,
                        });
                        
                        // Refresh locations list from server
                        const effectiveBusinessId = currentUser?.businessId || savedCompanyId;
                        if (effectiveBusinessId) {
                          await fetchLocations(effectiveBusinessId);
                        }
                        
                        setIsAdding(false);
                        setWizardStep(1);
                        setWizardData({
                          name: "",
                          businessType: "",
                          currency: currency || "₴",
                          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                          managerId: null,
                        });
                        setSelectedIndustry("");
                        
                        router.push(`/dashboard/director/locations/${locationId}`);
                      }}
                      className="px-6 py-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors font-medium border border-primary/20"
                    >
                      Создать и настроить
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* Edit Location Form (keep existing for editing) */}
        {isAdding && editingLocation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card border border-border rounded-xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {t("dashboard.loc_edit_title")}
              </h2>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingLocation(null);
                  setNewLocation({ name: "", address: "", dailyPlan: "" });
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Industry Selection - Only for first location */}
              {isFirstLocation && !editingLocation && (
                <div className="w-full space-y-1">
                  <label className="text-sm font-medium text-card-foreground">
                    Сфера бизнеса
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => scrollIndustry("left")}
                      type="button"
                      className="h-8 w-8 flex-shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div 
                      ref={industryScrollRef}
                      className="flex-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 py-1" 
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      <div className="flex gap-3">
                        {INDUSTRIES_ARRAY.map((ind) => (
                          <div
                            key={ind.slug}
                            onClick={() => handleIndustrySelect(ind.slug)}
                            style={{ flex: '0 0 calc((100% - 24px) / 3)' }}
                            className={cn(
                              "aspect-square flex flex-col items-center justify-center rounded-xl border cursor-pointer transition-all snap-start p-2",
                              selectedIndustry === ind.slug
                                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-white shadow-md ring-1 ring-black dark:ring-white"
                                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                            )}
                          >
                            <ind.icon className="w-7 h-7 mb-3 text-current" />
                            <span className="text-[10px] font-medium leading-tight text-center line-clamp-2 px-1">
                              {t(ind.translationKey)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => scrollIndustry("right")}
                      type="button"
                      className="h-8 w-8 flex-shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  {!selectedIndustry && (
                    <p className="text-xs text-red-400 mt-1">{t("dashboard.loc_select_industry")}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  {t("dashboard.loc_name_label")}
                </label>
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  placeholder={t("dashboard.loc_name_placeholder")}
                  className="w-full h-12 px-4 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  {t("dashboard.loc_address_label")}
                </label>
                <input
                  type="text"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  placeholder={t("dashboard.loc_address_placeholder")}
                  className="w-full h-12 px-4 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  {t("dashboard.loc_daily_plan_label")} ({currency})
                </label>
                <input
                  type="number"
                  value={newLocation.dailyPlan}
                  onChange={(e) => setNewLocation({ ...newLocation, dailyPlan: e.target.value })}
                  placeholder="50000"
                  className="w-full h-12 px-4 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none transition-all"
                />
              </div>

              {/* Team Section */}
              {!editingLocation && (
                <div className="space-y-6 pt-2 border-t border-white/10">
                  {/* Section A: Manager */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-card-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-purple-500" />
                        {t('dashboard.loc_manager') || 'Менеджер'}
                      </label>
                      {!newManager && (
                        <button
                          type="button"
                          onClick={handleAddManager}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-purple-500 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          {t('dashboard.team_add_manager') || 'Добавить менеджера'}
                        </button>
                      )}
                    </div>
                    
                    {newManager && (
                      <div 
                        className={cn(
                          "flex items-center gap-2 p-3 bg-purple-500/5 border rounded-xl transition-all",
                          newManager.isConfirmed 
                            ? "border-purple-500/30 bg-purple-500/10" 
                            : "border-purple-500/20"
                        )}
                      >
                        <input
                          type="text"
                          value={newManager.name}
                          onChange={(e) => handleUpdateManager('name', e.target.value)}
                          placeholder="Полное имя менеджера"
                          disabled={newManager.isConfirmed}
                          className={cn(
                            "flex-1 h-12 px-4 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none transition-all",
                            newManager.isConfirmed && "opacity-70 cursor-not-allowed"
                          )}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newManager.pin}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                              handleUpdateManager('pin', value);
                            }}
                            placeholder="PIN"
                            maxLength={4}
                            disabled={newManager.isConfirmed}
                            className={cn(
                              "w-20 h-12 px-3 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none text-center font-mono transition-all",
                              newManager.isConfirmed && "opacity-70 cursor-not-allowed"
                            )}
                          />
                          {!newManager.isConfirmed && (
                            <button
                              type="button"
                              onClick={() => handleUpdateManager('pin', generatePin())}
                              className="h-10 w-10 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:text-indigo-500 bg-transparent transition-all"
                              title="Generate Random PIN"
                            >
                              <Dices className="w-4 h-4" />
                            </button>
                          )}
                          {!newManager.isConfirmed ? (
                            <button
                              type="button"
                              onClick={handleConfirmManager}
                              disabled={!newManager.name.trim() || !newManager.pin.trim()}
                              className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t("dashboard.confirm")}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleEditManager}
                              className="h-10 w-10 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:text-indigo-500 bg-transparent transition-all"
                              title={t("dashboard.edit")}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleRemoveManager}
                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                            title={t("dashboard.delete")}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section B: Staff */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-card-foreground flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-500" />
                        Персонал
                      </label>
                      <button
                        type="button"
                        onClick={handleAddEmployee}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        {t("dashboard.loc_add_employee")}
                      </button>
                    </div>
                    
                    {newEmployees.length === 0 && (
                      <p className="text-xs text-muted-foreground/70 italic">
                        {t("dashboard.loc_team_desc")}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      {newEmployees.map((emp) => (
                        <div 
                          key={emp.id} 
                          className={cn(
                            "flex items-center gap-2 p-3 bg-transparent border rounded-xl transition-all",
                            emp.isConfirmed 
                              ? "border-green-500/30 bg-green-500/5" 
                              : "border-zinc-200 dark:border-zinc-700"
                          )}
                        >
                          <input
                            type="text"
                            value={emp.name}
                            onChange={(e) => handleUpdateEmployee(emp.id, 'name', e.target.value)}
                            placeholder="Полное имя"
                            disabled={emp.isConfirmed}
                            className={cn(
                              "flex-1 h-12 px-4 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none transition-all",
                              emp.isConfirmed && "opacity-70 cursor-not-allowed"
                            )}
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={emp.pin}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                handleUpdateEmployee(emp.id, 'pin', value);
                              }}
                              placeholder="PIN"
                              maxLength={4}
                              disabled={emp.isConfirmed}
                              className={cn(
                                "w-20 h-12 px-3 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none text-center font-mono transition-all",
                                emp.isConfirmed && "opacity-70 cursor-not-allowed"
                              )}
                            />
                            {!emp.isConfirmed && (
                              <button
                                type="button"
                                onClick={() => handleUpdateEmployee(emp.id, 'pin', generatePin())}
                                className="h-10 w-10 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:text-indigo-500 bg-transparent transition-all"
                                title="Generate Random PIN"
                              >
                                <Dices className="w-4 h-4" />
                              </button>
                            )}
                            {!emp.isConfirmed ? (
                              <button
                                type="button"
                                onClick={() => handleConfirmEmployee(emp.id)}
                                disabled={!emp.name.trim() || !emp.pin.trim()}
                                className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title={t("dashboard.confirm")}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEditEmployee(emp.id)}
                                className="h-10 w-10 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:text-indigo-500 bg-transparent transition-all"
                                title={t("dashboard.edit")}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveEmployee(emp.id)}
                              className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                              title={t("dashboard.delete")}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={editingLocation ? handleSaveEdit : handleAdd}
                  disabled={isFirstLocation && !selectedIndustry}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingLocation ? t("dashboard.loc_save") : t("dashboard.loc_add")}
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingLocation(null);
                    setNewLocation({ name: "", address: "", dailyPlan: "" });
                    setSelectedIndustry("");
                    setNewEmployees([]);
                    setNewManager(null);
                  }}
                  className="px-6 py-3 bg-white/5 text-card-foreground rounded-xl hover:bg-white/10 transition-colors font-medium border border-white/10"
                >
                  {t("dashboard.loc_cancel")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Locations Grid - Control Cards */}
      {filteredLocations.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-base font-medium text-foreground mb-1">
            {searchQuery || statusFilter !== "all" 
              ? "Ничего не найдено" 
              : "Нет локаций"}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Попробуйте изменить фильтры"
              : "Добавьте первую точку продаж"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => {
            const isPaused = location.status === 'paused' || location.status === 'yellow';
            const isActive = location.status === 'active' || location.status === 'green';
            const hasProblems = location.hasProblems;
            
            return (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => router.push(`/dashboard/director/locations/${location.id}`)}
                className={cn(
                  "bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all cursor-pointer hover:border-primary/30",
                  hasProblems && "border-red-500/50 bg-red-500/5"
                )}
              >
                {/* Header: Name and Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex-1 min-w-0 truncate">
                    {location.name}
                  </h3>
                  <div className="flex items-center gap-2 ml-2">
                    {isActive && !hasProblems && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Активна
                      </span>
                    )}
                    {isPaused && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                        Приостановлена
                      </span>
                    )}
                    {hasProblems && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                        Проблемы
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Metrics - Visible without hover */}
                <div className="space-y-2.5 mb-4">
                  {/* Revenue Today */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Выручка сегодня</span>
                    <span className="text-sm font-semibold text-foreground">
                      {location.revenue > 0 
                        ? `${location.revenue.toLocaleString('ru-RU')} ${currency}`
                        : "—"}
                    </span>
                  </div>

                  {/* Active Shift */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Активная смена</span>
                    <span className={cn(
                      "text-sm font-medium",
                      location.hasActiveShift 
                        ? "text-emerald-600 dark:text-emerald-400" 
                        : "text-muted-foreground"
                    )}>
                      {location.hasActiveShift ? "Да" : "Нет"}
                    </span>
                  </div>

                  {/* Problematic Shifts - Only if > 0 */}
                  {location.problematicShiftsCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Проблемные смены</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {location.problematicShiftsCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Manager (muted, secondary) */}
                {location.manager && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground/70 truncate">
                        {location.manager.name}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteLocationId(null);
        }}
        onConfirm={confirmDelete}
        title={t("dashboard.delete") + " " + t("dashboard.nav_locations").toLowerCase()}
        message={t("dashboard.delete_location_confirm") || "Вы уверены, что хотите удалить эту локацию? Это действие нельзя отменить."}
        confirmText={t("dashboard.delete_confirm")}
        cancelText={t("dashboard.cancel_action")}
        variant="danger"
      />
    </div>
  );
}

export default function LocationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LocationsContent />
    </Suspense>
  );
}