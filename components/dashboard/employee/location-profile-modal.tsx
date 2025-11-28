"use client";

import { useLanguage } from "@/components/language-provider";
import { MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Location } from "@/lib/store";

interface LocationProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
  readOnly?: boolean;
}

export function LocationProfileModal({ isOpen, onClose, location, readOnly = true }: LocationProfileModalProps) {
  const { t } = useLanguage();

  if (!isOpen || !location) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                      {location.name}
                    </h3>
                    {location.address && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {location.address}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
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
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
















