"use client";

import { useStore } from "@/lib/store";
import { useLanguage } from "@/components/language-provider";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Settings,
  Bell,
  Shield,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmployeeProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { currentUser, locations, savedLocationId, shifts, currency } = useStore();
  
  // Get assigned location
  const assignedLocation = locations.find(loc => 
    loc.id === savedLocationId || loc.id === currentUser?.assignedPointId
  );

  // Calculate stats from shifts
  const userShifts = shifts.filter(s => s.employeeId === currentUser?.id);
  const completedShifts = userShifts;
  const totalRevenue = completedShifts.reduce((sum, s) => sum + ((s.revenueCash || 0) + (s.revenueCard || 0)), 0);
  const avgRevenue = completedShifts.length > 0 ? Math.round(totalRevenue / completedShifts.length) : 0;

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get initials
  const getInitials = (name?: string) => {
    if (!name) return "??";
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back button + Title */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--text-secondary)]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {t('dashboard_profile') || 'Профиль'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('profile_subtitle') || 'Информация о вашем аккаунте'}
            </p>
          </div>
        </div>

        {/* Main Profile Card */}
        <div className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-2xl font-bold text-emerald-600 dark:text-emerald-400 border-2 border-[var(--border-color)]">
                {currentUser?.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt="Avatar" 
                    className="w-full h-full rounded-2xl object-cover" 
                  />
                ) : (
                  getInitials(currentUser?.fullName || currentUser?.name)
                )}
              </div>
              {/* Online indicator */}
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[var(--surface-2)]" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {currentUser?.fullName || currentUser?.name || 'Сотрудник'}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {currentUser?.jobTitle || t('role_employee') || 'Сотрудник'}
              </p>
              {assignedLocation && (
                <div className="flex items-center gap-2 mt-3">
                  <MapPin className="h-4 w-4 text-[var(--text-tertiary)]" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    {assignedLocation.name}
                  </span>
                </div>
              )}
            </div>

            {/* Stats badges */}
            <div className="flex gap-3">
              <div className="text-center px-4 py-2 bg-[var(--surface-1)] rounded-xl border border-[var(--border-color)]">
                <div className="text-lg font-bold text-[var(--text-primary)]">
                  {completedShifts.length}
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {t('profile_shifts') || 'Смен'}
                </div>
              </div>
              <div className="text-center px-4 py-2 bg-[var(--surface-1)] rounded-xl border border-[var(--border-color)]">
                <div className="text-lg font-bold text-emerald-500">
                  {avgRevenue.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  {t('profile_avg_revenue') || 'Ср. выручка'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-2xl p-6 mb-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            {t('profile_contact_info') || 'Контактная информация'}
          </h3>
          
          <div className="space-y-4">
            {currentUser?.email && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-1)] flex items-center justify-center">
                  <Mail className="h-5 w-5 text-[var(--text-secondary)]" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">Email</div>
                  <div className="text-sm text-[var(--text-primary)]">{currentUser.email}</div>
                </div>
              </div>
            )}

            {currentUser?.phone && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-1)] flex items-center justify-center">
                  <Phone className="h-5 w-5 text-[var(--text-secondary)]" />
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)]">{t('lbl_phone') || 'Телефон'}</div>
                  <div className="text-sm text-[var(--text-primary)]">{currentUser.phone}</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-1)] flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <div className="text-xs text-[var(--text-tertiary)]">{t('profile_joined') || 'Дата регистрации'}</div>
                <div className="text-sm text-[var(--text-primary)]">
                  {formatDate(currentUser?.hireDate) || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-2xl p-6 mb-6">
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">
            {t('profile_statistics') || 'Статистика'}
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-color)]">
              <Clock className="h-5 w-5 text-blue-500 mb-2" />
              <div className="text-xl font-bold text-[var(--text-primary)]">
                {completedShifts.length}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                {t('profile_total_shifts') || 'Всего смен'}
              </div>
            </div>

            <div className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-color)]">
              <TrendingUp className="h-5 w-5 text-emerald-500 mb-2" />
              <div className="text-xl font-bold text-[var(--text-primary)]">
                {totalRevenue.toLocaleString()} {currency}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                {t('profile_total_revenue') || 'Общая выручка'}
              </div>
            </div>

            <div className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-color)]">
              <Award className="h-5 w-5 text-amber-500 mb-2" />
              <div className="text-xl font-bold text-[var(--text-primary)]">
                {avgRevenue.toLocaleString()} {currency}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                {t('profile_avg_per_shift') || 'Средняя за смену'}
              </div>
            </div>

            <div className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-color)]">
              <User className="h-5 w-5 text-purple-500 mb-2" />
              <div className="text-xl font-bold text-[var(--text-primary)]">
                {completedShifts.reduce((sum, s) => sum + (s.checkCount || 0), 0)}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                {t('profile_total_orders') || 'Всего заказов'}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Shifts */}
        <div className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              {t('profile_recent_shifts') || 'Последние смены'}
            </h3>
            <button
              onClick={() => router.push('/dashboard/employee/orders-history')}
              className="text-sm text-[var(--accent-primary)] hover:underline"
            >
              {t('view_all') || 'Смотреть все'}
            </button>
          </div>
          
          {completedShifts.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-tertiary)]">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t('profile_no_shifts') || 'Пока нет завершенных смен'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedShifts.slice(0, 5).map((shift, index) => (
                <div 
                  key={shift.id || index}
                  className="flex items-center justify-between p-3 bg-[var(--surface-1)] rounded-xl border border-[var(--border-color)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {formatDate(shift.clockIn || new Date(shift.date).toISOString())}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {((shift.revenueCash || 0) + (shift.revenueCard || 0)).toLocaleString()} {currency}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="bg-[var(--surface-2)] border border-[var(--border-color)] rounded-2xl overflow-hidden mb-8">
          <h3 className="text-base font-semibold text-[var(--text-primary)] p-6 pb-4">
            {t('profile_settings') || 'Настройки'}
          </h3>
          
          <div className="divide-y divide-[var(--border-color)]">
            <button className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-1)] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {t('profile_notifications') || 'Уведомления'}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {t('profile_notifications_desc') || 'Настройка push-уведомлений'}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-1)] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {t('profile_security') || 'Безопасность'}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {t('profile_security_desc') || 'Пароль и данные входа'}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-[var(--surface-1)] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {t('profile_preferences') || 'Предпочтения'}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">
                    {t('profile_preferences_desc') || 'Язык, тема и другие настройки'}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--text-tertiary)]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




