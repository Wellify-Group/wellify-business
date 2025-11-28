"use client";

import { useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EmployeeLocationCardProps {
  location: any;
  manager?: any;
}

export function EmployeeLocationCard({ location, manager }: EmployeeLocationCardProps) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  if (!location) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
          {t("dashboard.emp_my_location") || "Моя точка"}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("dashboard.no_location_assigned") || "Точка не назначена"}
        </p>
      </div>
    );
  }

  const status = location.status === 'active' ? 'active' : location.status === 'paused' ? 'paused' : 'closed';

  return (
    <>
      {/* Clickable Card */}
      <div 
        id="employee-location-card" 
        onClick={() => setShowDetails(true)}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
      >
        {/* Title */}
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          {t("dashboard.emp_my_location") || "Моя точка"}
        </h3>

        {/* Location Name */}
        <h4 className="text-xl font-bold text-zinc-900 dark:text-white">
          {location.name}
        </h4>
        
        {/* Status Badge */}
        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          status === 'active'
            ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            : status === 'paused'
            ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
            : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
        }`}>
          {status === 'active' 
            ? (t("dashboard.emp_working") || "Работает")
            : status === 'paused'
            ? (t("dashboard.emp_on_pause") || "Пауза")
            : (t("dashboard.emp_closed") || "Закрыта")}
        </div>

        {/* Address with Map Icon */}
        <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-zinc-500 dark:text-zinc-400" />
          <span>{location.address || '-'}</span>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {location.name}
                  </h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                  </button>
                </div>

                {/* Banner Image */}
                {location.branding?.banner && (
                  <div className="mb-6 rounded-lg overflow-hidden">
                    <img 
                      src={location.branding.banner} 
                      alt={location.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                      {t("dashboard.emp_location_rules") || "Правила точки"}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {location.rules || t("dashboard.emp_no_rules") || "Правила не указаны"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                      {t("dashboard.emp_closing_standards") || "Стандарты закрытия"}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {location.closingStandards || t("dashboard.emp_no_standards") || "Стандарты не указаны"}
                    </p>
                  </div>

                  {/* Schedule */}
                  {location.schedule && (
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                        {t("dashboard.schedule") || "График работы"}
                      </h4>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                        {location.schedule.workingHours && (
                          <p>{location.schedule.workingHours}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  {location.documents && location.documents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                        {t("dashboard.documents") || "Документы"}
                      </h4>
                      <div className="space-y-2">
                        {location.documents.map((doc: any) => (
                          <a
                            key={doc.id}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                          >
                            {doc.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
                      {t("dashboard.emp_special_requirements") || "Особые требования"}
                    </h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {location.specialRequirements || t("dashboard.emp_no_requirements") || "Особых требований нет"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
