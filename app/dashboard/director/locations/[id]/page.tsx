"use client";

export const runtime = 'nodejs';

import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";
import useStore from "@/lib/store";
import { 
  PauseCircle, 
  PlayCircle, 
  Copy, 
  Archive, 
  Save, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  User,
  Users,
  Briefcase,
  Settings,
  FileText,
  History,
  Camera,
  X,
  Check,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Download,
  Maximize2,
  Crop,
  Dices
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { HeroStaffCard } from "@/components/dashboard/hero-staff-card";
import { ImageCropperModal } from "@/components/ui/image-cropper-modal";
import { AnimatePresence } from "framer-motion";
import { StaffPassportModal } from "@/components/dashboard/staff-passport-modal";

type TabType = 'info' | 'team' | 'schedule' | 'settings' | 'docs' | 'history';

const DAYS = [
  { key: 'mon' as const, label: 'Понедельник' },
  { key: 'tue' as const, label: 'Вторник' },
  { key: 'wed' as const, label: 'Среда' },
  { key: 'thu' as const, label: 'Четверг' },
  { key: 'fri' as const, label: 'Пятница' },
  { key: 'sat' as const, label: 'Суббота' },
  { key: 'sun' as const, label: 'Воскресенье' }
];

export default function LocationProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { 
    locations, 
    employees, 
    users,
    shifts,
    currency,
    toggleLocationPause, 
    archiveLocation, 
    duplicateLocation,
    updateLocationProfile,
    assignManager,
    deleteLocation,
    updateLocationBranding,
    addLocationDocument,
    removeLocationDocument,
    updateLocationSchedule,
    moveStaffToLocation,
    regenerateLocationCode,
    currentUser
  } = useStore();
  const { toast, success, error } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Cropper state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'banner'>('logo');
  const [isLogoPreviewOpen, setIsLogoPreviewOpen] = useState(false);
  
  const location = useMemo(() => {
    return locations.find(loc => loc.id === params.id);
  }, [locations, params.id]);

  if (!location) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-xl font-semibold text-card-foreground mb-4">Локация не найдена</p>
        <Link 
          href="/dashboard/director/locations"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const isPaused = location.status === 'paused';
  const isActive = location.status === 'active' || location.status === 'green';
  
  const locationManager = location.managerId 
    ? employees.find(emp => emp.id === location.managerId) || users.find(u => u.id === location.managerId)
    : null;
  
  const locationStaff = employees.filter(emp => 
    emp.assignedPointId === location.id && 
    emp.role === 'employee' &&
    emp.id !== location.managerId
  );

  const handlePause = () => {
    toggleLocationPause(location.id);
  };

  const handleDuplicate = () => {
    const newId = duplicateLocation(location.id);
    if (newId) {
      router.push(`/dashboard/director/locations/${newId}`);
    }
  };

  const handleArchive = () => {
    setArchiveConfirmOpen(true);
  };

  const confirmArchive = () => {
    archiveLocation(location.id);
    router.push('/dashboard/director/locations');
    success("Локация архивирована");
  };

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    await deleteLocation(location.id);
    router.push('/dashboard/director/locations');
    success("Локация удалена");
  };

  const handleFileSelect = (type: 'logo' | 'banner') => {
    const inputRef = type === 'banner' ? bannerInputRef : logoInputRef;
    inputRef.current?.click();
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setSelectedImage(dataUrl);
        setCropType('banner');
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setSelectedImage(dataUrl);
        setCropType('logo');
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageBase64: string) => {
    try {
      if (cropType === 'banner') {
        await updateLocationBranding(location.id, location.branding?.logo || null, croppedImageBase64);
      } else {
        await updateLocationBranding(location.id, croppedImageBase64, location.branding?.banner || null);
      }
      setCropModalOpen(false);
      setSelectedImage(null);
      success("Изображение обновлено");
    } catch (err) {
      console.error('Error updating branding:', err);
      error("Ошибка при обновлении изображения");
    }
  };

  const handleDeleteBanner = async () => {
    try {
      await updateLocationBranding(location.id, location.branding?.logo || null, null);
      success("Баннер удален");
    } catch (err) {
      console.error('Error deleting banner:', err);
      error("Ошибка при удалении баннера");
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await updateLocationBranding(location.id, null, location.branding?.banner || null);
      setIsLogoPreviewOpen(false);
      success("Логотип удален");
    } catch (err) {
      console.error('Error deleting logo:', err);
      error("Ошибка при удалении логотипа");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Banner */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        {location.branding?.banner || location.coverImage ? (
          <img 
            src={location.branding?.banner || location.coverImage} 
            alt={location.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-900/50" />
        )}
        
        {/* Banner Controls - Top Right */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {location.branding?.banner || location.coverImage ? (
            <>
              <button
                onClick={() => handleFileSelect('banner')}
                className="px-3 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/10"
                title={t("dashboard.btn_edit")}
              >
                <Crop className="h-4 w-4" />
                <span className="hidden sm:inline">{t("dashboard.btn_edit")}</span>
              </button>
              <button
                onClick={handleDeleteBanner}
                className="px-3 py-2 bg-black/60 hover:bg-rose-500/80 backdrop-blur-sm text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/10"
                title={t("dashboard.btn_delete")}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t("dashboard.btn_delete")}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleFileSelect('banner')}
              className="px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/10"
            >
              <Camera className="h-4 w-4" />
              <span>{t("dashboard.btn_upload_cover")}</span>
            </button>
          )}
        </div>
        
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          className="hidden"
        />
      </div>

      {/* Profile Header */}
      <div className="relative px-4 sm:px-6 lg:px-8 pb-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-16">
          {/* Logo Avatar */}
          <div className="relative group">
            {location.branding?.logo ? (
              <>
                <img 
                  src={location.branding.logo} 
                  alt={location.name}
                  onClick={() => setIsLogoPreviewOpen(true)}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-background shadow-xl cursor-pointer hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                  <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </>
            ) : (
              <div 
                onClick={() => handleFileSelect('logo')}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold border-4 border-background shadow-xl cursor-pointer hover:opacity-90 transition-opacity"
              >
                {location.name[0].toUpperCase()}
              </div>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {location.branding?.logo && (
            <button 
              onClick={() => handleFileSelect('logo')}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors z-10"
              title={t("dashboard.btn_edit")}
            >
              <Camera className="h-4 w-4" />
            </button>
            )}
          </div>

          {/* Title Block */}
          <div className="flex-1 pb-2 mt-16 sm:mt-20">
            <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground mb-2">
              {location.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{location.address}</span>
              </div>
              {location.contact?.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  <span>{location.contact.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Bar & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap justify-end">
            {/* Status Badge */}
            <div className={cn(
              "px-4 py-2 rounded-lg font-semibold text-sm",
              isActive && "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30",
              isPaused && "bg-blue-500/20 text-blue-500 border border-blue-500/30",
              !isActive && !isPaused && "bg-zinc-500/20 text-zinc-500 border border-zinc-500/30"
            )}>
              {isActive 
              ? (t("dashboard.loc_active") || "Активна") 
              : isPaused 
                ? (t("dashboard.status_suspended") || "Приостановлена") 
                : getStatusText(location.status)}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-end items-center">
              <button
                onClick={handlePause}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap",
                  isPaused 
                    ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20"
                )}
              >
                {isPaused ? (
                  <>
                    <PlayCircle className="h-4 w-4" />
                    Возобновить
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-4 w-4" />
                    Приостановить
                  </>
                )}
              </button>
              <button
                onClick={handleDuplicate}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Copy className="h-4 w-4" />
                Дублировать
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20 border border-zinc-500/20 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Archive className="h-4 w-4" />
                Архивировать
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {[
              { id: 'info' as TabType, label: 'Информация', icon: FileText },
              { id: 'team' as TabType, label: 'Команда', icon: Users },
              { id: 'schedule' as TabType, label: 'Расписание', icon: Clock },
              { id: 'settings' as TabType, label: 'Настройки', icon: Settings },
              { id: 'docs' as TabType, label: 'Документы', icon: FileText },
              { id: 'history' as TabType, label: 'История', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                    activeTab === tab.id
                      ? "text-primary border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'info' && (
          <InfoTab location={location} />
        )}
        {activeTab === 'team' && (
          <TeamTab 
            location={location} 
            manager={locationManager}
            staff={locationStaff}
            employees={employees}
            users={users}
            onAssignManager={assignManager}
            onMoveStaff={moveStaffToLocation}
          />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab location={location} onUpdate={updateLocationSchedule} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab location={location} onUpdate={updateLocationProfile} />
        )}
        {activeTab === 'docs' && (
          <DocsTab 
            location={location} 
            onAdd={addLocationDocument}
            onRemove={removeLocationDocument}
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab location={location} employees={employees} />
        )}
      </div>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={archiveConfirmOpen}
        onClose={() => setArchiveConfirmOpen(false)}
        onConfirm={confirmArchive}
        title="Архивировать локацию"
        message="Вы уверены, что хотите архивировать эту локацию?"
        confirmText="Архивировать"
        cancelText="Отмена"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Удалить локацию"
        message="Вы уверены, что хотите удалить эту локацию? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />

      {/* Image Cropper Modal */}
      {selectedImage && (
        <ImageCropperModal
          isOpen={cropModalOpen}
          imageSrc={selectedImage}
          aspectRatio={cropType === 'banner' ? 3 : 1}
          isCircular={cropType === 'logo'}
          onCancel={() => {
            setCropModalOpen(false);
            setSelectedImage(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Logo Preview Modal */}
      {isLogoPreviewOpen && location.branding?.logo && (
        <div 
          className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center p-4"
          onClick={() => setIsLogoPreviewOpen(false)}
        >
          <div 
            className="flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsLogoPreviewOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={location.branding.logo}
              alt={location.name}
              className="object-contain max-h-[60vh] rounded-lg"
            />
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => {
                  setIsLogoPreviewOpen(false);
                  handleFileSelect('logo');
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-lg transition-all flex items-center gap-2 font-medium border border-white/20"
              >
                <Edit2 className="h-4 w-4" />
                {t("dashboard.btn_edit_photo")}
              </button>
              <button
                onClick={handleDeleteLogo}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 backdrop-blur-sm text-white rounded-lg transition-all flex items-center gap-2 font-medium border border-rose-500/30"
              >
                <Trash2 className="h-4 w-4" />
                {t("dashboard.btn_delete_photo")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusText(status: string): string {
  switch (status) {
    case 'active':
    case 'green':
      return 'Активна';
    case 'paused':
    case 'yellow':
      return 'Приостановлена';
    case 'archived':
      return 'Архивирована';
    case 'error':
    case 'red':
      return 'Ошибка';
    default:
      return 'Активна';
  }
}

// Info Tab Component
function InfoTab({ location }: { location: any }) {
  const { t } = useLanguage();
  const { updateLocationProfile } = useStore();
  const { toast, success, error } = useToast();
  const [formData, setFormData] = useState({
    name: location.name,
    address: location.address,
    phone: location.contact?.phone || '',
    email: location.contact?.email || '',
  });

  const handleSave = async () => {
    await updateLocationProfile(location.id, {
      name: formData.name,
      address: formData.address,
      contact: {
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        geo: location.contact?.geo || ''
      }
    });
    success('Изменения сохранены');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-card-foreground mb-2">
          Название локации
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full h-12 px-4 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-card-foreground mb-2">
          Адрес
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full h-12 px-4 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none transition-all"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">
            Телефон
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full h-12 px-4 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-card-foreground mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full h-12 px-4 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl text-card-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none transition-all"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold"
      >
        {t("dashboard.btn_save")}
      </button>
    </div>
  );
}

// Team Tab Component
function TeamTab({ location, manager, staff, employees, users, onAssignManager, onMoveStaff }: any) {
  const router = useRouter();
  const { t } = useLanguage();
  const store = useStore();
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [selectedPassport, setSelectedPassport] = useState<any>(null);
  
  // Get all managers assigned to this location
  const managers = useMemo(() => {
    const managerList = [];
    if (manager) {
      managerList.push(manager);
    }
    // Also include any other managers assigned to this location
    const otherManagers = users.filter((u: any) => 
      u.role === 'manager' && 
      u.assignedPointId === location.id && 
      u.id !== location.managerId
    );
    return [...managerList, ...otherManagers];
  }, [manager, users, location.id, location.managerId]);

  // Get all staff (employees) assigned to this location, sorted alphabetically
  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => a.name.localeCompare(b.name));
  }, [staff]);

  // Sort managers alphabetically
  const sortedManagers = useMemo(() => {
    return [...managers].sort((a, b) => a.name.localeCompare(b.name));
  }, [managers]);

  const handleCardClick = (employee: any) => {
    setSelectedPassport(employee);
  };

  const handleAssignManager = (userId: string) => {
    onAssignManager(location.id, userId);
    setShowManagerModal(false);
  };

  const [removeManagerConfirmOpen, setRemoveManagerConfirmOpen] = useState(false);

  const handleRemoveManager = () => {
    setRemoveManagerConfirmOpen(true);
  };

  const confirmRemoveManager = () => {
    onAssignManager(location.id, null);
    setRemoveManagerConfirmOpen(false);
  };

  const handleAddStaff = (staffId: string) => {
    onMoveStaff(staffId, location.id, 'employee');
    setShowStaffModal(false);
  };

  const [removeStaffConfirmOpen, setRemoveStaffConfirmOpen] = useState(false);
  const [removeStaffId, setRemoveStaffId] = useState<string | null>(null);

  const handleRemoveStaff = (staffId: string) => {
    setRemoveStaffId(staffId);
    setRemoveStaffConfirmOpen(true);
  };

  const confirmRemoveStaff = () => {
    if (removeStaffId) {
      onMoveStaff(removeStaffId, '', 'employee');
      setRemoveStaffId(null);
    }
    setRemoveStaffConfirmOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Section A: Management */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-purple-500" />
            {t("dashboard.loc_section_manager") || t("dashboard.team_management") || "Менеджер"}
          </h3>
          <button 
            onClick={() => setShowManagerModal(true)}
            className="px-4 py-2 text-sm font-medium text-purple-500 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.team_add_manager") || "Добавить менеджера"}
          </button>
        </div>
        {sortedManagers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedManagers.map((mgr: any) => (
              <div key={mgr.id} className="relative group">
                <HeroStaffCard
                  employee={mgr}
                  onClick={() => handleCardClick(mgr)}
                  size="large"
                />
                {mgr.id === location.managerId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveManager();
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-purple-500/5 border border-purple-500/20 rounded-xl">
            <Briefcase className="h-12 w-12 text-purple-500/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("dashboard.team_no_managers") || "Менеджеры не назначены"}</p>
          </div>
        )}
      </div>

      {/* Section B: Staff */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-card-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-indigo-500" />
            {t("dashboard.loc_section_staff") || t("dashboard.team_staff") || "Сотрудники"} ({sortedStaff.length})
          </h3>
          <button
            onClick={() => setShowStaffModal(true)}
            className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("dashboard.team_add_member") || "Добавить сотрудника"}
          </button>
        </div>
        {sortedStaff.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sortedStaff.map((emp: any) => (
              <div key={emp.id} className="relative group">
                <HeroStaffCard
                  employee={emp}
                  onClick={() => handleCardClick(emp)}
                />
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveStaff(emp.id, location.id, 'manager');
                    }}
                    className="p-1.5 bg-purple-500/80 hover:bg-purple-500 text-white rounded-lg"
                    title="Повысить"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStaff(emp.id);
                    }}
                    className="p-1.5 bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg"
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
            <User className="h-12 w-12 text-indigo-500/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("dashboard.team_no_staff") || "Персонал не назначен"}</p>
          </div>
        )}
      </div>

      {/* Manager Modal */}
      {showManagerModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowManagerModal(false)}
        >
          <div 
            className="bg-background rounded-xl p-6 max-w-md w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">Выберите менеджера</h3>
              <button onClick={() => setShowManagerModal(false)} className="text-white hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {(() => {
                // Filter employees directly in render body - reactive to store changes
                const availableManagers = store.employees.filter((e: any) => 
                  e.role === 'manager' && e.id !== location.managerId
                );
                
                if (availableManagers.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-purple-500/50 mx-auto mb-3" />
                      <p className="text-sm font-medium text-card-foreground mb-2">No managers found</p>
                      <p className="text-xs text-muted-foreground mb-4">Create a new manager to assign to this location</p>
                    </div>
                  );
                }
                
                return availableManagers.map((mgr: any) => (
                  <button
                    key={mgr.id}
                    onClick={() => handleAssignManager(mgr.id)}
                    className="w-full p-3 text-left bg-card border border-border rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <p className="font-medium text-card-foreground">{mgr.name}</p>
                    <p className="text-xs text-muted-foreground">{mgr.email || mgr.phone || 'Нет контакта'}</p>
                  </button>
                ));
              })()}
            </div>
            <div className="border-t border-border pt-4">
              <Link
                href={`/dashboard/director/staff?action=new&role=manager&assignTo=${location.id}`}
                onClick={() => setShowManagerModal(false)}
                className="w-full px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Plus className="h-4 w-4" />
                Register New Manager
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowStaffModal(false)}
        >
          <div 
            className="bg-background rounded-xl p-6 max-w-md w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-card-foreground">Выберите сотрудника</h3>
              <button onClick={() => setShowStaffModal(false)} className="text-white hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {(() => {
                // Filter employees directly in render body - reactive to store changes
                const availableStaff = store.employees.filter((e: any) => 
                  e.role === 'employee' && 
                  (!e.assignedPointId || e.assignedPointId === location.id) &&
                  e.id !== location.managerId
                );
                
                if (availableStaff.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground mb-4">Нет доступных сотрудников</p>
                    </div>
                  );
                }
                
                return availableStaff.map((emp: any) => (
                  <button
                    key={emp.id}
                    onClick={() => handleAddStaff(emp.id)}
                    className="w-full p-3 text-left bg-card border border-border rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <p className="font-medium text-card-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">PIN: {emp.pin || '—'}</p>
                  </button>
                ));
              })()}
            </div>
            <div className="border-t border-border pt-4">
              <Link
                href={`/dashboard/director/staff?action=new&role=employee&assignTo=${location.id}`}
                onClick={() => setShowStaffModal(false)}
                className="w-full px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Plus className="h-4 w-4" />
                Register New Employee
              </Link>
            </div>
          </div>
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

// Schedule Tab Component
function ScheduleTab({ location, onUpdate }: any) {
  const [schedule, setSchedule] = useState(() => {
    const currentSchedule = location.schedule || {};
    return DAYS.map(day => {
      const dayData = currentSchedule[day.key] || {
        start: '09:00',
        end: '21:00',
        lunchStart: '13:00',
        lunchEnd: '14:00',
        active: day.key !== 'sun'
      };
      return { ...day, ...dayData };
    });
  });

  const handleUpdate = (dayKey: string, field: string, value: any) => {
    const updated = schedule.map(day => 
      day.key === dayKey ? { ...day, [field]: value } : day
    );
    setSchedule(updated);
    
    const scheduleObj: any = {};
    updated.forEach(day => {
      scheduleObj[day.key] = {
        start: day.start,
        end: day.end,
        lunchStart: day.lunchStart,
        lunchEnd: day.lunchEnd,
        active: day.active
      };
    });
    
    onUpdate(location.id, scheduleObj);
  };

  return (
    <div className="max-w-2xl space-y-3">
      {schedule.map((day) => (
        <div key={day.key} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-card border border-border rounded-xl">
          <div className="w-32 flex items-center gap-2">
            <label className="text-sm font-medium text-card-foreground">{day.label}</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={day.active}
                onChange={(e) => handleUpdate(day.key, 'active', e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-xs text-muted-foreground">Выходной</span>
            </label>
          </div>
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Начало:</span>
              <input
                type="time"
                value={day.start}
                onChange={(e) => handleUpdate(day.key, 'start', e.target.value)}
                disabled={!day.active}
                className="h-10 px-3 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-card-foreground focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Обед:</span>
              <input
                type="time"
                value={day.lunchStart}
                onChange={(e) => handleUpdate(day.key, 'lunchStart', e.target.value)}
                disabled={!day.active}
                className="h-10 px-3 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-card-foreground focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none disabled:opacity-50"
              />
              <span className="text-muted-foreground">—</span>
              <input
                type="time"
                value={day.lunchEnd}
                onChange={(e) => handleUpdate(day.key, 'lunchEnd', e.target.value)}
                disabled={!day.active}
                className="h-10 px-3 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-card-foreground focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none disabled:opacity-50"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Конец:</span>
              <input
                type="time"
                value={day.end}
                onChange={(e) => handleUpdate(day.key, 'end', e.target.value)}
                disabled={!day.active}
                className="h-10 px-3 bg-transparent dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-card-foreground focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Settings Tab Component
function SettingsTab({ location, onUpdate }: any) {
  const { t } = useLanguage();
  const { regenerateLocationCode } = useStore();
  const { toast, success, error } = useToast();
  const settings = location.settings || {};
  const [localSettings, setLocalSettings] = useState(settings);
  const [copiedLocationCode, setCopiedLocationCode] = useState(false);

  const handleToggle = (key: string) => {
    const updated = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(updated);
    onUpdate(location.id, { settings: updated });
  };

  // Helper function to generate 16-digit code (same as in store)
  const generate16DigitCode = () => {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    const part3 = Math.floor(1000 + Math.random() * 9000);
    const part4 = Math.floor(1000 + Math.random() * 9000);
    return `${part1}-${part2}-${part3}-${part4}`;
  };

  // Ensure location has accessCode (migration for existing locations)
  // If location doesn't have accessCode, generate and save it
  useEffect(() => {
    if (!location.accessCode) {
      const newCode = generate16DigitCode();
      onUpdate(location.id, { accessCode: newCode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.id, location.accessCode]);

  const locationAccessCode = location.accessCode || "---- ---- ---- ----";

  const handleCopyLocationCode = () => {
    navigator.clipboard.writeText(locationAccessCode);
    setCopiedLocationCode(true);
    setTimeout(() => setCopiedLocationCode(false), 2000);
  };

  const handleRegenerateCode = () => {
    regenerateLocationCode(location.id);
    success(t("dashboard.code_updated_toast") || "Access Code updated. Old code is now invalid.");
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Terminal Access - Location Access Code */}
      <div className="p-6 bg-card border border-border rounded-xl">
        <h2 className="mb-4 text-lg font-bold tracking-tight text-card-foreground">
          {t("dashboard.settings_terminal_access") || t("dashboard.terminal_access") || "Terminal Access"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              {t("dashboard.lbl_location_code") || "Location Access Code"}
            </label>
            <p className="text-xs text-muted-foreground mb-4">
              {t("dashboard.lbl_location_code_desc") || "Use this code to connect a Terminal specifically to this location."}
            </p>
            <div className="space-y-3">
              <div className="relative">
                <div className="h-16 rounded-xl border border-zinc-800 bg-zinc-900 px-6 flex items-center justify-center">
                  <p className="text-xl font-mono font-bold text-white tracking-widest">
                    {locationAccessCode}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyLocationCode}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  {copiedLocationCode ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t("dashboard.msg_copied") || "Copied"}
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
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Dices className="h-4 w-4" />
                  {t("dashboard.btn_regenerate") || "Regenerate"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground/70 italic">
                {t("dashboard.code_regenerate_warning") || "Changing this will log out all devices using the old code."}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div>
          <p className="font-medium text-card-foreground">Требовать фото при открытии</p>
          <p className="text-sm text-muted-foreground">{t('dashboard.employee_photo_required') || 'Сотрудник должен загрузить фото при открытии смены'}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localSettings.requirePhotoOpen || false}
            onChange={() => handleToggle('requirePhotoOpen')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div>
          <p className="font-medium text-card-foreground">Требовать фото при закрытии</p>
          <p className="text-sm text-muted-foreground">{t('dashboard.employee_z_report_required') || 'Сотрудник должен загрузить фото Z-отчета при закрытии'}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localSettings.requirePhotoClose || false}
            onChange={() => handleToggle('requirePhotoClose')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div>
          <p className="font-medium text-card-foreground">Гео-ограждение</p>
          <p className="text-sm text-muted-foreground">Требовать подтверждение местоположения</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localSettings.geoFenceEnabled || false}
            onChange={() => handleToggle('geoFenceEnabled')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div>
          <p className="font-medium text-card-foreground">Строгий контроль кассы</p>
          <p className="text-sm text-muted-foreground">Требовать точное соответствие кассового остатка</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={localSettings.strictCashControl || false}
            onChange={() => handleToggle('strictCashControl')}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
    </div>
  );
}

// Documents Tab Component
function DocsTab({ location, onAdd, onRemove }: any) {
  const documents = location.documents || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteDocConfirmOpen, setDeleteDocConfirmOpen] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileType = file.type || 'application/octet-stream';
      const fileName = file.name;
      // Simulate file upload - in real app, upload to server and get URL
      const mockUrl = URL.createObjectURL(file);
      
      onAdd(location.id, {
        name: fileName,
        type: fileType,
        url: mockUrl
      });
    }
  };

  const handleEditName = (doc: any) => {
    setEditingDocId(doc.id);
    setEditingName(doc.name);
  };

  const handleSaveName = (docId: string) => {
    // In real app, update document name via API
    setEditingDocId(null);
    setEditingName('');
  };

  const handlePreview = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Загрузите инструкции, договоры и руководства здесь. Видны менеджерам.
      </p>
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileUpload}
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer"
      >
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm font-medium text-card-foreground mb-1">Перетащите файлы сюда</p>
        <p className="text-xs text-muted-foreground">или нажмите для выбора</p>
      </div>
      
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {editingDocId === doc.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSaveName(doc.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveName(doc.id);
                        }
                        if (e.key === 'Escape') {
                          setEditingDocId(null);
                          setEditingName('');
                        }
                      }}
                      autoFocus
                      className="w-full px-2 py-1 bg-transparent border border-zinc-300 dark:border-zinc-600 rounded text-sm text-card-foreground focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <p 
                      className="text-sm font-medium text-card-foreground cursor-pointer hover:text-primary"
                      onClick={() => handleEditName(doc)}
                    >
                      {doc.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePreview(doc.url)}
                  className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                  title="Просмотр"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => window.open(doc.url, '_blank')}
                  className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                  title="Скачать"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setDeleteDocId(doc.id);
                    setDeleteDocConfirmOpen(true);
                  }}
                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Document Confirmation */}
      <ConfirmDialog
        isOpen={deleteDocConfirmOpen}
        onClose={() => {
          setDeleteDocConfirmOpen(false);
          setDeleteDocId(null);
        }}
        onConfirm={() => {
          if (deleteDocId) {
            onRemove(location.id, deleteDocId);
            setDeleteDocId(null);
          }
          setDeleteDocConfirmOpen(false);
        }}
        title="Удалить документ"
        message="Удалить документ?"
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
}

// History Tab Component - Shift History & Calendar
function HistoryTab({ location, employees }: any) {
  const { t } = useLanguage();
  const { shifts, currency } = useStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  
  // Filter shifts for this location
  const locationShifts = shifts.filter((shift: any) => shift.locationId === location.id);
  
  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    locationShifts.forEach((shift: any) => {
      const dateKey = new Date(shift.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(shift);
    });
    return grouped;
  }, [locationShifts]);
  
  // Get current month
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();
  
  // Get shifts for selected date or all if none selected
  const displayedShifts = selectedDate
    ? shiftsByDate[selectedDate.toISOString().split('T')[0]] || []
    : locationShifts.sort((a: any, b: any) => b.date - a.date);
  
  // Calculate daily totals
  const getDayTotal = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateKey = date.toISOString().split('T')[0];
    const dayShifts = shiftsByDate[dateKey] || [];
    return dayShifts.reduce((sum: number, shift: any) => sum + shift.revenueCash + shift.revenueCard, 0);
  };
  
  const hasShifts = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateKey = date.toISOString().split('T')[0];
    return !!shiftsByDate[dateKey];
  };
  
  const meetsRevenue = (day: number) => {
    const total = getDayTotal(day);
    return location.dailyPlan ? total >= location.dailyPlan : true;
  };
  
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Calendar */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-card-foreground">
              {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <span className="text-sm">‹</span>
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-2 text-xs hover:bg-muted rounded-lg transition-colors"
              >
                Сегодня
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <span className="text-sm">›</span>
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasShift = hasShifts(day);
              const isGood = meetsRevenue(day);
              const isSelected = selectedDate && 
                selectedDate.getDate() === day && 
                selectedDate.getMonth() === currentMonth.getMonth() &&
                selectedDate.getFullYear() === currentMonth.getFullYear();
              
              return (
                <button
                  key={day}
                  onClick={() => {
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    setSelectedDate(isSelected ? null : date);
                  }}
                  className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : hasShift
                      ? isGood
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {day}
                  {hasShift && (
                    <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-0.5 ${
                      isGood ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right: Shift List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-card-foreground">
            {selectedDate 
              ? `${t('dashboard.shifts_for_date') || 'Смены за'} ${selectedDate.toLocaleDateString('ru-RU')}`
              : 'Все смены'}
          </h3>
          
          {displayedShifts.length > 0 ? (
            <div className="space-y-3">
              {Object.entries(shiftsByDate).map(([dateKey, dayShifts]) => {
                const date = new Date(dateKey);
                const dayTotal = dayShifts.reduce((sum: number, s: any) => sum + s.revenueCash + s.revenueCard, 0);
                const dayEmployees = Array.from(new Set(dayShifts.map((s: any) => s.employeeId)));
                
                if (selectedDate && dateKey !== selectedDate.toISOString().split('T')[0]) return null;
                
                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedShift({ dateKey, dayShifts, dayTotal, dayEmployees })}
                    className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">
                        {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {dayTotal.toLocaleString('ru-RU')} {currency}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {dayEmployees.slice(0, 3).map((empId: string) => {
                        const emp = employees.find((e: any) => e.id === empId);
                        return emp ? (
                          <div key={empId} className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {emp.name[0]}
                          </div>
                        ) : null;
                      })}
                      {dayEmployees.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{dayEmployees.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет смен</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Shift Details Modal */}
      {selectedShift && (
        <ShiftDetailsModal
          shift={selectedShift}
          location={location}
          employees={employees}
          currency={currency}
          onClose={() => setSelectedShift(null)}
        />
      )}
    </>
  );
}

// Shift Details Modal Component
function ShiftDetailsModal({ shift, location, employees, currency, onClose }: any) {
  const { t } = useLanguage();
  const shiftDate = new Date(shift.dateKey);
  const totalRevenue = shift.dayTotal || 0;
  const totalGuests = shift.dayShifts?.reduce((sum: number, s: any) => sum + (s.guestCount || 0), 0) || 0;
  const avgCheck = totalGuests > 0 ? totalRevenue / totalGuests : 0;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{location.name}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {shiftDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{t('dashboard.metric_revenue') || 'Выручка'}</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {totalRevenue.toLocaleString('ru-RU')} {currency}
            </div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Гостей</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">{totalGuests}</div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Средний чек</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {avgCheck.toLocaleString('ru-RU')} {currency}
            </div>
          </div>
        </div>
        
        {/* Staff Table */}
        <div className="border border-zinc-200 dark:border-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t('dashboard.employee_label') || 'Сотрудник'}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t('dashboard.time') || 'Время'}</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t('dashboard.metric_revenue') || 'Выручка'}</th>
              </tr>
            </thead>
            <tbody>
              {shift.dayShifts?.map((s: any) => {
                const emp = employees.find((e: any) => e.id === s.employeeId);
                const clockIn = s.clockIn ? new Date(s.clockIn).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '-';
                const clockOut = s.clockOut ? new Date(s.clockOut).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '-';
                const isLate = s.clockIn && new Date(s.clockIn).getHours() > 9; // Mock late check
                
                return (
                  <tr key={s.id} className="border-t border-zinc-200 dark:border-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {emp?.avatar ? (
                          <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {emp?.name[0] || '?'}
                          </div>
                        )}
                        <span className="text-sm font-medium text-zinc-900 dark:text-white">{emp?.name || s.employeeName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${isLate ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                        {clockIn} - {clockOut} {isLate && '(ОПОЗДАЛ)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {(s.revenueCash + s.revenueCard).toLocaleString('ru-RU')} {currency}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            {t('dashboard.loc_close') || 'Закрыть'}
          </button>
        </div>
      </div>
    </div>
  );
}
