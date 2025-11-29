"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { motion } from "framer-motion";
import useStore from "@/lib/store";
import { Trash2, Plus, Edit2, Dices, Save, X, Copy, Eye, EyeOff, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { MonitoringSettings } from "@/components/dashboard/monitoring-settings";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { formConfig, updateFormConfig, employees, addEmployee, removeEmployee, currentUser, updateProfile, companyCode } = useStore();
  const { success, error } = useToast();
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeePin, setNewEmployeePin] = useState("");
  const [isEditingCompanyCode, setIsEditingCompanyCode] = useState(false);
  const [editedCompanyCode, setEditedCompanyCode] = useState(companyCode || currentUser?.companyCode || "1000-2000-3000-4000");
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Sync companyCode from store when it changes
  useEffect(() => {
    const currentCode = companyCode || currentUser?.companyCode || "1000-2000-3000-4000";
    if (!isEditingCompanyCode) {
      setEditedCompanyCode(currentCode);
    }
  }, [companyCode, currentUser?.companyCode, isEditingCompanyCode]);
  
  // Format company code for display (add dashes)
  const formatCompanyCode = (code: string) => {
    const cleaned = code.replace(/-/g, '');
    if (cleaned.length !== 16) return code;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}`;
  };

  // Generate new company code
  const generateCompanyCode = () => {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    const part3 = Math.floor(1000 + Math.random() * 9000);
    const part4 = Math.floor(1000 + Math.random() * 9000);
    return `${part1}-${part2}-${part3}-${part4}`;
  };

  const handleRegenerateCode = async () => {
    const newCode = generateCompanyCode();
    
    if (currentUser) {
      const isUpdated = await updateProfile({ companyCode: newCode });
      if (isUpdated) {
        setEditedCompanyCode(newCode);
        success("Company Code обновлен");
      } else {
        error("Ошибка при обновлении");
      }
    }
  };

  const handleSaveCompanyCode = async () => {
    const cleaned = editedCompanyCode.replace(/-/g, '');
    if (cleaned.length !== 16) {
      error("Код должен содержать 16 цифр");
      return;
    }
    
    const formatted = formatCompanyCode(cleaned);
    
    if (currentUser) {
      const isUpdated = await updateProfile({ companyCode: formatted });
      if (isUpdated) {
        setIsEditingCompanyCode(false);
        success("Company Code сохранен");
      } else {
        error("Ошибка при сохранении");
      }
    }
  };

  const handleCopyCode = () => {
    const codeToCopy = companyCode || currentUser?.companyCode || "1000-2000-3000-4000";
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCode(true);
    success(t("dashboard.msg_copied") || "Скопировано в буфер обмена");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const maskCode = (code: string) => {
    if (!code) return "---- ---- ---- ----";
    const cleaned = code.replace(/-/g, '');
    if (cleaned.length !== 16) return code;
    return `****-****-****-${cleaned.slice(12, 16)}`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("dashboard.nav_settings")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.settings_subtitle")}</p>
      </div>

      {/* Terminal Access - Company Code */}
      <div className="glass-card p-6">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-card-foreground">
          {t("dashboard.settings_terminal_access") || t("dashboard.terminal_access") || "Terminal Access"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              {t("dashboard.lbl_company_code") || t("dashboard.company_id") || "Company Code (For Employee Login)"}
            </label>
            <p className="text-xs text-muted-foreground mb-4">
              {t("dashboard.company_id_desc") || "16-digit code for employee login"}
            </p>
            {isEditingCompanyCode ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editedCompanyCode}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 16);
                    if (cleaned.length <= 16) {
                      // Auto-format with dashes
                      let formatted = cleaned;
                      if (cleaned.length > 12) {
                        formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
                      } else if (cleaned.length > 8) {
                        formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
                      } else if (cleaned.length > 4) {
                        formatted = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
                      }
                      setEditedCompanyCode(formatted);
                    }
                  }}
                  className="w-full h-16 rounded-xl border border-white/10 bg-black/20 px-6 text-center text-2xl font-mono font-bold text-card-foreground placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="1000-2000-3000-4000"
                  maxLength={19}
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveCompanyCode}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4" />
                    {t("dashboard.btn_save") || "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingCompanyCode(false);
                      setEditedCompanyCode(companyCode || currentUser?.companyCode || "1000-2000-3000-4000");
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                    {t("dashboard.btn_cancel") || "Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <div className="h-20 rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 px-6 flex items-center justify-between">
                    <p className="text-2xl font-mono font-bold text-card-foreground tracking-widest flex-1 text-center">
                      {isCodeVisible 
                        ? (companyCode || currentUser?.companyCode || "1000-2000-3000-4000")
                        : maskCode(companyCode || currentUser?.companyCode || "1000-2000-3000-4000")
                      }
                    </p>
                    <button
                      onClick={() => setIsCodeVisible(!isCodeVisible)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      title={isCodeVisible ? "Скрыть код" : "Показать код"}
                    >
                      {isCodeVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-white/10"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-4 w-4" />
                        {t("dashboard.msg_copied") || "Скопировано"}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        {t("dashboard.btn_copy") || "Copy"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRegenerateCode}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-white/10"
                  >
                    <Dices className="h-4 w-4" />
                    {t("dashboard.btn_regenerate") || "Regenerate"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Config */}
      <div className="glass-card p-6">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-card-foreground">
          {t("dashboard.form_constructor")}
        </h2>
        <div className="space-y-4">
          {[
            { key: "showCash", label: t("dashboard.show_cash") },
            { key: "showCard", label: t("dashboard.show_card") },
            { key: "showGuests", label: t("dashboard.show_guests") },
            { key: "showPhoto", label: t("dashboard.show_photo") },
            { key: "showNotes", label: t("dashboard.show_notes") },
          ].map((item) => (
            <label
              key={item.key}
              className="flex min-h-[60px] cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 transition-colors hover:bg-white/10"
            >
              <span className="text-base font-medium text-card-foreground">{item.label}</span>
              <input
                type="checkbox"
                checked={formConfig[item.key as keyof typeof formConfig] as boolean}
                onChange={(e) =>
                  updateFormConfig({ [item.key]: e.target.checked } as Partial<typeof formConfig>)
                }
                className="h-5 w-5 rounded border-white/20 bg-black/20 text-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Employee Management */}
      <div className="glass-card p-6">
        <h2 className="mb-6 text-xl font-bold tracking-tight text-card-foreground">
          {t("dashboard.employee_management")}
        </h2>

        {/* Add Employee */}
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            value={newEmployeeName}
            onChange={(e) => setNewEmployeeName(e.target.value)}
            placeholder={t("dashboard.employee_name")}
            className="flex-1 rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-card-foreground placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <input
            type="text"
            value={newEmployeePin}
            onChange={(e) => setNewEmployeePin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder={t("dashboard.employee_pin")}
            maxLength={4}
            className="w-24 rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-center text-card-foreground placeholder:text-muted-foreground/50 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
          />
          <button
            onClick={() => {
              if (newEmployeeName && newEmployeePin) {
                addEmployee({
                  name: newEmployeeName,
                  pin: newEmployeePin,
                  role: "employee",
                  status: "active",
                });
                setNewEmployeeName("");
                setNewEmployeePin("");
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.add")}
          </button>
        </div>

        {/* Employee List */}
        <div className="space-y-2">
          {employees
            .filter((emp) => emp.role === "employee")
            .map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-card-foreground">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">
                    PIN: {employee.pin} • Rating: {employee.rating || 0}%
                  </p>
                </div>
                <button
                  onClick={() => removeEmployee(employee.id)}
                  className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Monitoring Settings */}
      {currentUser && (
        <div className="glass-card p-6">
          <MonitoringSettings userId={currentUser.id} role="director" />
        </div>
      )}
    </div>
  );
}

