"use client";

import { useLanguage } from "@/components/language-provider";
import useStore, { User } from "@/lib/store";
import { UserPlus, Trophy, AlertTriangle, Users, MapPin, Briefcase, Dice1, ChevronDown, Eye, Edit2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { StaffPassportModal } from "@/components/dashboard/staff-passport-modal";

export default function StaffPage() {
  const { t } = useLanguage();
  const { employees, locations, currency, addEmployee, deleteUser, openMessageComposer, updateProfile, currentUser } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [modalRole, setModalRole] = useState<'manager' | 'employee' | null>(null);
  const [selectedPassport, setSelectedPassport] = useState<User | null>(null);
  const [newStaff, setNewStaff] = useState({ 
    name: "", 
    fullName: "",
    pin: "",
    phone: "",
    email: "",
    password: "",
    dob: "",
    address: "",
    jobTitle: "",
    assignedPointId: ""
  });

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewStaff({ ...newStaff, pin });
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewStaff({ ...newStaff, password });
  };

  const handleOpenModal = (role: 'manager' | 'employee') => {
    setModalRole(role);
    setIsAdding(true);
    setNewStaff({ 
      name: "", 
      fullName: "",
      pin: role === 'employee' ? Math.floor(1000 + Math.random() * 9000).toString() : "", 
      phone: "", 
      email: "", 
      password: "",
      dob: "",
      address: "",
      jobTitle: "",
      assignedPointId: ""
    });
  };

  const handleAdd = async () => {
    if (!modalRole) return;

    // Check if we're editing an existing employee
    if (editingId) {
      // Find the employee being edited
      const employeeToEdit = employees.find(emp => emp.id === editingId);
      if (!employeeToEdit) {
        console.error('Employee to edit not found');
        return;
      }

      // Prepare updates object
      const updates: any = {
        fullName: newStaff.fullName,
        name: newStaff.fullName.split(' ')[0] || newStaff.fullName,
        phone: newStaff.phone || undefined,
        dob: newStaff.dob || undefined,
        address: newStaff.address || undefined,
        jobTitle: newStaff.jobTitle || undefined,
        assignedPointId: newStaff.assignedPointId || undefined,
      };

      // Add role-specific fields
      if (modalRole === 'employee') {
        if (!newStaff.fullName || !newStaff.pin) {
          return;
        }
        updates.pin = newStaff.pin;
        if (newStaff.email) {
          updates.email = newStaff.email;
        }
      } else if (modalRole === 'manager') {
        if (!newStaff.fullName || !newStaff.email) {
          return;
        }
        updates.email = newStaff.email;
        // Only update password if provided (not required for editing)
        if (newStaff.password && newStaff.password.trim()) {
          updates.password = newStaff.password;
        }
      }

      // Call API to update user
      try {
        const response = await fetch('/api/user/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: employeeToEdit.role,
            userId: employeeToEdit.id,
            updates: updates,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error('Failed to update employee:', data.error);
          return;
        }

        // Update local state manually
        const updatedEmployee = data.user;
        // Update employees and users arrays in store
        const { employees: currentEmployees, users: currentUsers } = useStore.getState();
        useStore.setState({
          employees: currentEmployees.map(emp => 
            emp.id === updatedEmployee.id ? updatedEmployee : emp
          ),
          users: currentUsers.map(user => 
            user.id === updatedEmployee.id ? updatedEmployee : user
          )
        });
      } catch (error) {
        console.error('Update employee error:', error);
        return;
      }
    } else {
      // Creating new employee
      if (modalRole === 'manager') {
        // Manager validation: fullName, email, password required
        if (!newStaff.fullName || !newStaff.email || !newStaff.password) {
          return;
        }
        await addEmployee({
          name: newStaff.fullName.split(' ')[0] || newStaff.fullName,
          fullName: newStaff.fullName,
          email: newStaff.email,
          password: newStaff.password,
          phone: newStaff.phone || undefined,
          dob: newStaff.dob || undefined,
          address: newStaff.address || undefined,
          jobTitle: newStaff.jobTitle || undefined,
          role: "manager",
          status: "active",
          assignedPointId: newStaff.assignedPointId || undefined,
        });
      } else {
        // Employee validation: fullName, pin required
        if (!newStaff.fullName || !newStaff.pin) {
          return;
        }
        await addEmployee({
          name: newStaff.fullName.split(' ')[0] || newStaff.fullName,
          fullName: newStaff.fullName,
          pin: newStaff.pin,
          phone: newStaff.phone || undefined,
          email: newStaff.email || undefined,
          dob: newStaff.dob || undefined,
          address: newStaff.address || undefined,
          jobTitle: newStaff.jobTitle || undefined,
          role: "employee",
          status: "active",
          assignedPointId: newStaff.assignedPointId || undefined,
        });
      }
    }
    
    setNewStaff({ name: "", fullName: "", pin: "", phone: "", email: "", password: "", dob: "", address: "", jobTitle: "", assignedPointId: "" });
    setIsAdding(false);
    setModalRole(null);
    setEditingId(null);
  };

  const [editingId, setEditingId] = useState<string | null>(null);

  const sortedEmployees = [...employees]
    .filter(emp => emp.role === 'employee')
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <div className="space-y-6">
      {/* Subtitle and Add Buttons */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Управление сотрудниками
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal('manager')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium",
              modalRole === 'manager'
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border bg-background text-zinc-500 hover:text-foreground hover:bg-muted"
            )}
          >
            <Briefcase className="h-4 w-4" />
            {t("dashboard.btn_add_manager")}
          </button>
          <button
            onClick={() => handleOpenModal('employee')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium",
              modalRole === 'employee'
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border bg-background text-zinc-500 hover:text-foreground hover:bg-muted"
            )}
          >
            <UserPlus className="h-4 w-4" />
            {t("dashboard.btn_add_employee")}
          </button>
        </div>
      </div>

      {/* Add Staff Form */}
      {isAdding && modalRole && (
        <div className="bg-card p-6 border border-border rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            {editingId 
              ? (modalRole === 'manager' ? t("dashboard.team_edit_manager") || "Редактировать менеджера" : t("dashboard.team_edit_member") || "Редактировать сотрудника")
              : (modalRole === 'manager' ? t("dashboard.team_add_manager") : t("dashboard.team_add_member"))
            }
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name - Required, Single field */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("reg_name_placeholder") || "Полное имя"} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={newStaff.fullName}
                onChange={(e) => {
                  const fullName = e.target.value;
                  setNewStaff({ ...newStaff, fullName, name: fullName.split(' ')[0] || fullName });
                }}
                placeholder={t("reg_name_placeholder") || "Полное имя"}
                required
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            
            {/* Manager-specific fields */}
            {modalRole === 'manager' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder={t("dashboard.lbl_email_required") || "Email (обязательно)"}
                    required
                    className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {editingId ? (t("dashboard.lbl_password_optional") || "Пароль (необязательно)") : (t("dashboard.lbl_password") || "Пароль")} {!editingId && <span className="text-destructive">*</span>}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      placeholder={editingId ? (t("dashboard.lbl_password_optional") || "Оставить пустым, чтобы не менять") : (t("dashboard.lbl_password") || "Пароль")}
                      required={!editingId}
                      className="flex-1 h-10 px-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="h-10 px-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors border border-border"
                      title="Сгенерировать пароль"
                    >
                      <Dice1 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
            
            {/* Employee-specific fields */}
            {modalRole === 'employee' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  PIN <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStaff.pin}
                    onChange={(e) => setNewStaff({ ...newStaff, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    placeholder={t("dashboard.employee_pin") || "PIN"}
                    maxLength={4}
                    required
                    className="flex-1 h-10 px-4 bg-background border border-border rounded-lg text-center text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={generatePin}
                    className="h-10 px-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors border border-border"
                    title="Сгенерировать PIN"
                  >
                    <Dice1 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Location Assignment - For both Manager and Employee */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("dashboard.pass_assign_location") || "Назначить на локацию"} <span className="text-muted-foreground/50 text-xs font-normal">({t("dashboard.lbl_optional") || "необязательно"})</span>
              </label>
              <div className="relative">
                <select
                  value={newStaff.assignedPointId}
                  onChange={(e) => setNewStaff({ ...newStaff, assignedPointId: e.target.value })}
                  className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors appearance-none pr-10"
                >
                  <option value="">{t("dashboard.lbl_not_assigned") || "Не назначен"}</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            
            {/* Optional Details */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("dashboard.staff_phone")} <span className="text-muted-foreground/50 text-xs font-normal">({t("dashboard.lbl_optional") || "необязательно"})</span>
              </label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                placeholder={t("dashboard.staff_phone")}
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("dashboard.staff_dob")} <span className="text-muted-foreground/50 text-xs font-normal">({t("dashboard.lbl_optional") || "необязательно"})</span>
              </label>
              <input
                type="date"
                value={newStaff.dob}
                onChange={(e) => setNewStaff({ ...newStaff, dob: e.target.value })}
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("dashboard.staff_address")} <span className="text-muted-foreground/50 text-xs font-normal">({t("dashboard.lbl_optional") || "необязательно"})</span>
              </label>
              <input
                type="text"
                value={newStaff.address}
                onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })}
                placeholder={t("dashboard.staff_address")}
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            {modalRole === 'employee' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("dashboard.staff_email")} <span className="text-muted-foreground/50 text-xs font-normal">({t("dashboard.lbl_optional") || "необязательно"})</span>
                </label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder={t("dashboard.staff_email")}
                  className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("dashboard.staff_job_title")} <span className="text-muted-foreground/50 text-xs font-normal">({t("dashboard.lbl_optional") || "необязательно"})</span>
              </label>
              <input
                type="text"
                value={newStaff.jobTitle}
                onChange={(e) => setNewStaff({ ...newStaff, jobTitle: e.target.value })}
                placeholder={t("dashboard.staff_job_title")}
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            
            <div className="sm:col-span-2 flex gap-3">
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {editingId ? (t("dashboard.save") || "Сохранить") : t("dashboard.add")}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setModalRole(null);
                  setEditingId(null);
                  setNewStaff({ name: "", fullName: "", pin: "", phone: "", email: "", password: "", dob: "", address: "", jobTitle: "", assignedPointId: "" });
                }}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
              >
                {t("dashboard.btn_cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff List - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sortedEmployees.map((employee, index) => {
          const assignedLocation = locations.find(loc => loc.id === employee.assignedPointId);
          const isSelected = selectedPassport?.id === employee.id;
          const hasIssues = (employee.rating || 0) < 70;
          const totalShifts = 127; // Mock - TODO: calculate from shifts
          const totalRevenue = (employee as any).totalRevenue || 1250000; // Mock
          const lateness = (employee as any).lateness || 2; // Mock
          const rating = employee.rating || 0;
          
          // Get initials for avatar
          const initials = employee.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          // Role badge text
          const roleText = employee.role === 'manager' 
            ? (t("dashboard.role_manager") || "Менеджер")
            : (t("dashboard.role_staff") || "Сотрудник");
          const locationText = assignedLocation 
            ? assignedLocation.name 
            : (t("dashboard.lbl_not_assigned") || "Не закреплён");

          return (
            <div
              key={employee.id}
              onClick={() => setSelectedPassport(employee)}
              className={`group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-zinc-200/50 dark:border-white/5 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-indigo-500/50 dark:hover:border-indigo-500/30 hover:bg-white dark:hover:bg-zinc-900 ${
                isSelected ? 'ring-2 ring-indigo-500/50 dark:ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20' : ''
              } ${hasIssues ? 'border-rose-500/30 dark:border-rose-500/20' : ''}`}
            >
              {/* Warning Icon for Problematic Employees */}
              {hasIssues && (
                <div className="absolute top-3 right-3 z-10">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                </div>
              )}

              {/* Top Section: Avatar + Name + Role */}
              <div className="flex items-start gap-3 mb-4">
                {/* Avatar */}
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-zinc-200 dark:border-zinc-700"
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 border-2 ${
                    employee.role === 'manager'
                      ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                      : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
                  }`}>
                    {initials}
                  </div>
                )}
                
                {/* Name + Role */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mb-0.5 truncate">
                    {employee.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    {roleText} · {locationText}
                  </p>
                </div>
              </div>

              {/* Key Metrics - Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                  {t("dashboard.metric_shifts") || "Смен"}: {totalShifts}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  {t("dashboard.metric_revenue") || "Выручка"}: {totalRevenue.toLocaleString("ru-RU")} {currency}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  lateness > 0
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                }`}>
                  {t("dashboard.metric_lateness") || "Опоздания"}: {lateness}
                </span>
              </div>

              {/* Status Bar + Rating */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <div className={`h-1 flex-1 rounded-full ${
                    rating >= 90 ? 'bg-emerald-500' :
                    rating >= 70 ? 'bg-blue-500' :
                    'bg-rose-500'
                  }`} />
                  <span className="ml-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    {t("dashboard.rating") || "Рейтинг"}: {rating}%
                  </span>
                </div>
              </div>

              {/* Bottom: Status Badge + Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-white/5">
                {/* Status Badge */}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  employee.status === 'active'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : employee.status === 'inactive'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                }`}>
                  {employee.status === 'active' 
                    ? (t("dashboard.status_active") || "Активен")
                    : employee.status === 'inactive'
                    ? (t("dashboard.status_inactive") || "На паузе")
                    : (t("dashboard.status_fired") || "Уволен")}
                </span>

                {/* Action Icons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPassport(employee);
                    }}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title={t("dashboard.view_profile") || "Открыть профиль"}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPassport(employee);
                      // Edit will be handled in modal
                    }}
                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title={t("dashboard.edit") || "Редактировать"}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedEmployees.length === 0 && !isAdding && (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет добавленных сотрудников</p>
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
}
