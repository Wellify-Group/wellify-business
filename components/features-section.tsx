"use client";

import { useLanguage } from "@/components/language-provider";
import {
  Clock,
  CheckSquare,
  Camera,
  MapPin,
  AlertTriangle,
  Target,
  DollarSign,
  BarChart3,
  FileText,
  Download,
  Bell,
  Star,
  MessageCircle,
} from "lucide-react";

export function FeaturesSection() {
  const { t } = useLanguage();

  const shiftCards = [
    {
      icon: Clock,
      title: t("landing_feature_shift_30s_title"),
      desc: t("landing_feature_shift_30s_desc"),
    },
    {
      icon: CheckSquare,
      title: t("landing_feature_checklists_title"),
      desc: t("landing_feature_checklists_desc"),
    },
    {
      icon: Camera,
      title: t("landing_feature_photo_title"),
      desc: t("landing_feature_photo_desc"),
    },
    {
      icon: MapPin,
      title: t("landing_feature_geo_title"),
      desc: t("landing_feature_geo_desc"),
    },
    {
      icon: AlertTriangle,
      title: t("landing_feature_late_control_title"),
      desc: t("landing_feature_late_control_desc"),
    },
    {
      icon: AlertTriangle,
      title: t("landing_feature_incidents_title"),
      desc: t("landing_feature_incidents_desc"),
    },
  ];

  const financeCards = [
    {
      icon: DollarSign,
      title: t("landing_feature_revenue_title"),
      desc: t("landing_feature_revenue_desc"),
    },
    {
      icon: Target,
      title: t("landing_feature_plan_title"),
      desc: t("landing_feature_plan_desc"),
    },
    {
      icon: AlertTriangle,
      title: t("landing_feature_anomalies_title"),
      desc: t("landing_feature_anomalies_desc"),
    },
    {
      icon: FileText,
      title: t("landing_feature_statement_title"),
      desc: t("landing_feature_statement_desc"),
    },
    {
      icon: Download,
      title: t("landing_feature_export_title"),
      desc: t("landing_feature_export_desc"),
    },
    {
      icon: BarChart3,
      title: t("landing_feature_analytics_title"),
      desc: t("landing_feature_analytics_desc"),
    },
  ];

  const teamCards = [
    {
      icon: Star,
      title: t("landing_feature_rating_title"),
      desc: t("landing_feature_rating_desc"),
    },
    {
      icon: Bell,
      title: t("landing_feature_notifications_title"),
      desc: t("landing_feature_notifications_desc"),
    },
    {
      icon: MessageCircle,
      title: t("landing_feature_telegram_title"),
      desc: t("landing_feature_telegram_desc"),
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight mb-10">
          {t("sec_caps")}
        </h2>

        <div className="grid gap-10 lg:grid-cols-3">
          {/* Смены и контроль */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-300">
              {t("landing_features_category_shifts")}
            </h3>
            <div className="space-y-3">
              {shiftCards.map((card, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 rounded-2xl bg-[#05070A]/40 border border-white/5 px-4 py-3"
                >
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                    <card.icon className="h-4 w-4 text-slate-100" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {card.title}
                    </div>
                    <p className="text-xs text-white/60">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Финансы и аналитика */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-300">
              {t("landing_features_category_finance")}
            </h3>
            <div className="space-y-3">
              {financeCards.map((card, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 rounded-2xl bg-[#05070A]/40 border border-white/5 px-4 py-3"
                >
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                    <card.icon className="h-4 w-4 text-slate-100" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {card.title}
                    </div>
                    <p className="text-xs text-white/60">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Команда и мотивация */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-300">
              {t("landing_features_category_team")}
            </h3>
            <div className="space-y-3">
              {teamCards.map((card, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 rounded-2xl bg-[#05070A]/40 border border-white/5 px-4 py-3"
                >
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                    <card.icon className="h-4 w-4 text-slate-100" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {card.title}
                    </div>
                    <p className="text-xs text-white/60">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
