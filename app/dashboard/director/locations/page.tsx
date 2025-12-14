"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { Plus, Trash2, MapPin, Edit2, MoreVertical, BarChart3, X, User, ChevronLeft, ChevronRight, UserPlus, Dices, Check, Pencil, Briefcase, PauseCircle, PlayCircle, ChevronRight as ChevronRightIcon } from "lucide-react";
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
  const { toast } = useToast();
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
  
  // Всегда синхронизируем локации с сервером при заходе на страницу
  useEffect(() => {
    // Пытаемся взять businessId из текущего пользователя или из savedCompanyId
    let effectiveBusinessId =
      currentUser?.businessId ||
      savedCompanyId ||
      (locations.length > 0 ? locations[0].businessId : null);

    if (!effectiveBusinessId) {
      console.warn('[Locations] Нет businessId для загрузки локаций');
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

  // Calculate revenue for each location
  const locationsWithData = useMemo(() => {
    return locations.map(location => {
      // Mock: assign shifts to locations (in real app, this would be based on locationId in shift)
      const locShifts = todayShifts; // Simplified: all shifts for now
      const locRevenue = locShifts.reduce((acc, s) => acc + s.revenueCash + s.revenueCard, 0);
      const locPlanPercent = location.dailyPlan && location.dailyPlan > 0 
        ? Math.round((locRevenue / location.dailyPlan) * 100) 
        : 0;
      
      // Get manager dynamically from employees list - fix ghost manager bug
      const currentManager = location.managerId 
        ? employees.find(e => e.id === location.managerId)
        : null;

      return {
        ...location,
        revenue: locRevenue,
        planPercent: locPlanPercent,
        manager: currentManager
      };
    });
  }, [locations, todayShifts, employees]);

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

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Subtitle and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("dashboard.loc_subtitle")}
        </p>
        <button
          data-tour="add-point"
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          {t("dashboard.dash_add_point")}
        </button>
      </div>

      {/* Add Location Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-card-foreground">
                {editingLocation ? t("dashboard.loc_edit_title") : t("dashboard.loc_add_title")}
              </h2>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingLocation(null);
                  setNewLocation({ name: "", address: "", dailyPlan: "" });
                  setNewEmployees([]);
                  setNewManager(null);
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-card-foreground" />
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

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {locationsWithData.filter(loc => loc.status !== 'archived').map((location) => {
          const isPaused = location.status === 'paused';
          return (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => router.push(`/dashboard/director/locations/${location.id}`)}
              className={cn(
                "glass-card p-6 hover:shadow-2xl transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:border-zinc-500 relative",
                isPaused && "opacity-60 grayscale-[0.5] border-blue-500/30"
              )}
            >
              {/* Header: Status Dot + Logo + Name */}
              <div className="flex items-start justify-between mb-6">
                <div 
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  {getStatusDot(location.status)}
                  {/* Mini Logo */}
                  {location.branding?.logo ? (
                    <img 
                      src={location.branding.logo} 
                      alt={location.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border border-white/10 flex-shrink-0">
                      {location.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-card-foreground truncate">
                      {location.name}
                    </h3>
                    {isPaused && (
                      <p className="text-xs text-blue-500 font-medium mt-1">{t("dashboard.status_suspended")}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Pause/Resume Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePauseLocation(location.id);
                    }}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isPaused
                        ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20"
                        : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20"
                    )}
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? (
                      <PlayCircle className="h-4 w-4" />
                    ) : (
                      <PauseCircle className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

                {/* Body */}
                <div className="space-y-4 mb-6">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {location.address}
                    </p>
                  </div>

                  {/* Manager */}
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {location.manager ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {location.manager.name[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-card-foreground">
                          {t("dashboard.loc_manager")}: {location.manager.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {t("dashboard.loc_manager")}: {t("dashboard.team_no_managers") || "Менеджер не назначен"}
                      </span>
                    )}
                  </div>

                  {/* Daily Plan Progress */}
                  {location.dailyPlan && location.dailyPlan > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t("dashboard.loc_daily_plan")}</span>
                        <span className="text-card-foreground font-semibold">
                          {location.planPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            location.planPercent >= 90 
                              ? 'bg-emerald-500' 
                              : location.planPercent < 80
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(location.planPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{location.revenue.toLocaleString('ru-RU')} {currency}</span>
                        <span>{location.dailyPlan.toLocaleString('ru-RU')} {currency}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {locations.length === 0 && !isAdding && (
        <div className="text-center py-16 glass-card">
          <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold text-card-foreground mb-2">Нет добавленных точек</p>
          <p className="text-sm text-muted-foreground">Начните с добавления первой точки продаж</p>
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