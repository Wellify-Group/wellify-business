"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";
import { useBusinessModalStore } from "@/lib/useBusinessModalStore";
import businessTypesData from "@/data/businessTypes.json";
import { BUSINESS_MODAL_CONFIG } from "@/data/businessModalConfig";
import { PrimaryButton } from "@/components/ui/button";
import {
  Smartphone,
  ArrowRight,
  Coffee,
  ShoppingBag,
  Scissors,
  Car,
  Package,
  Wrench,
  Store,
  UtensilsCrossed,
  Clock,
  DollarSign,
  Target,
  Camera,
  MapPin,
  AlertTriangle,
  Star,
  FileText,
  CheckSquare,
  Bell,
  Flower2,
  Printer,
  MessageSquare,
  Download,
  Cpu,
  LineChart,
  Heart,
  Dumbbell,
  Building,
  Image as ImageIcon,
  BarChart3,
  AlarmClock,
} from "lucide-react";

export default function Home() {
  const { t } = useLanguage();
  const { openModal, isOpen, modalData, closeModal } = useBusinessModalStore();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const scrollToHowItWorks = () => {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const iconMap: Record<string, any> = {
    cafe: UtensilsCrossed,
    coffee: Coffee,
    retail: ShoppingBag,
    beauty: Scissors,
    street: Store,
    bakery: Store,
    auto: Car,
    pickup: Package,
    flowers: Flower2,
    print: Printer,
    services: Wrench,
    dark: Package,
    barbershop: Scissors,
    medical: Heart,
    sports: Dumbbell,
    "car-dealer": Car,
    tire: Car,
    repair: Wrench,
    hotel: Building,
    photo: ImageIcon,
  };

  const SEGMENTS = useMemo(() => {
    return businessTypesData.map((business) => {
      const translationKey = business.fileId || String(business.id);

      const normalizedKey =
        translationKey === "barber"
          ? "barbershop"
          : translationKey === "beauty_salon"
          ? "beauty"
          : translationKey === "car_wash"
          ? "auto"
          : translationKey === "fitness_gym"
          ? "sports"
          : translationKey;

      const translationKeyNormalized = normalizedKey.replace(/-/g, "_");

      const descriptionKey = `landing_industriesDescriptions_${translationKeyNormalized}`;
      const description = t(descriptionKey) || "";

      return {
        id: business.id,
        label: t(`biz_${translationKeyNormalized}`) || business.name,
        description: description,
        icon: iconMap[normalizedKey] || iconMap[translationKey] || Store,
        data: business,
        normalizedKey: normalizedKey,
      };
    });
  }, [t]);

  const handleCardClick = (segment: typeof SEGMENTS[0]) => {
    if (segment.data) {
      const Icon = segment.icon;
      const normalizedKey = segment.normalizedKey;
      const config = BUSINESS_MODAL_CONFIG[normalizedKey];

      setActiveCategoryId(String(segment.data.id));

      if (config) {
        openModal({
          id: config.id,
          title: config.title,
          format: config.format,
          description: config.description,
          benefits: config.benefits,
          howToStart: config.howToStart,
          icon: (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          ),
        });
      } else {
        openModal({
          id: String(segment.data.id),
          title: segment.label,
          description: segment.description,
          features: [],
          functions: [],
          icon: (
            <Icon className="h-8 w-8 text-neutral-200 dark:text-neutral-100" />
          ),
        });
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setActiveCategoryId(null);
    }
  }, [isOpen]);

  const FEATURES = [
    {
      category: t("landing_features_category_shifts"),
      items: [
        {
          title: t("landing_feature_shift_30s_title"),
          description: t("landing_feature_shift_30s_desc"),
          icon: Clock,
        },
        {
          title: t("landing_feature_checklists_title"),
          description: t("landing_feature_checklists_desc"),
          icon: CheckSquare,
        },
        {
          title: t("landing_feature_photo_title"),
          description: t("landing_feature_photo_desc"),
          icon: Camera,
        },
        {
          title: t("landing_feature_geo_title"),
          description: t("landing_feature_geo_desc"),
          icon: MapPin,
        },
        {
          title: t("landing_feature_late_control_title"),
          description: t("landing_feature_late_control_desc"),
          icon: AlarmClock,
        },
        {
          title: t("landing_feature_incidents_title"),
          description: t("landing_feature_incidents_desc"),
          icon: AlertTriangle,
        },
      ],
    },
    {
      category: t("landing_features_category_finance"),
      items: [
        {
          title: t("landing_feature_revenue_title"),
          description: t("landing_feature_revenue_desc"),
          icon: DollarSign,
        },
        {
          title: t("landing_feature_plan_title"),
          description: t("landing_feature_plan_desc"),
          icon: Target,
        },
        {
          title: t("landing_feature_anomalies_title"),
          description: t("landing_feature_anomalies_desc"),
          icon: AlertTriangle,
        },
        {
          title: t("landing_feature_statement_title"),
          description: t("landing_feature_statement_desc"),
          icon: FileText,
        },
        {
          title: t("landing_feature_export_title"),
          description: t("landing_feature_export_desc"),
          icon: Download,
        },
        {
          title: t("landing_feature_analytics_title"),
          description: t("landing_feature_analytics_desc"),
          icon: BarChart3,
        },
      ],
    },
    {
      category: t("landing_features_category_team"),
      items: [
        {
          title: t("landing_feature_rating_title"),
          description: t("landing_feature_rating_desc"),
          icon: Star,
        },
        {
          title: t("landing_feature_notifications_title"),
          description: t("landing_feature_notifications_desc"),
          icon: Bell,
        },
        {
          title: t("landing_feature_telegram_title"),
          description: t("landing_feature_telegram_desc"),
          icon: MessageSquare,
        },
      ],
    },
  ];

  const signupHref = activeCategoryId
    ? `/register?role=director&segment=${activeCategoryId}`
    : "/register?role=director";

  return (
    <main
      className="relative min-h-screen bg-background"
    >
      {/* HERO */}
      <section
        className="relative flex items-center justify-center px-4 pt-24 md:pt-32 pb-16 sm:px-6 lg:px-8 overflow-hidden bg-background"
      >

        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 py-8 md:py-12 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.6, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight"
          >
            {t("landing_hero_main_title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl text-base text-muted-foreground sm:text-lg leading-relaxed"
          >
            {t("landing_hero_main_desc")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:gap-4"
          >
            <Link href={signupHref}>
              <PrimaryButton className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-indigo-500 shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200">
                {t("landing_btn_create_director")}
              </PrimaryButton>
            </Link>

            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="px-6 h-12 rounded-full border border-border bg-transparent text-sm font-medium text-foreground hover:bg-muted/50 hover:border-border-hover transition-all duration-200"
            >
              {t("landing_btn_how_it_works")}
            </button>
          </motion.div>
        </div>
      </section>

      {/* BUSINESS CATEGORIES */}
      <section
        className="relative px-4 pt-8 pb-10 sm:px-6 lg:px-8"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            {t("sec_whom")}
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {SEGMENTS.map((segment, index) => {
              const Icon = segment.icon;
              const isActive = activeCategoryId === String(segment.id);
              // Первая строка (первые 4 элемента) - более акцентная
              const isFirstRow = index < 4;

              return (
                <motion.button
                  key={segment.id}
                  type="button"
                  onClick={() => handleCardClick(segment)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  className={cn(
                    "group flex flex-col items-center justify-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-all duration-250 ease-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    isFirstRow
                      ? "border-[color:var(--color-border-strong)] dark:border-border shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-sm hover:border-primary/50 dark:hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:hover:shadow-md hover:bg-muted/30 dark:hover:bg-transparent hover:ring-1 hover:ring-primary/20"
                      : "border-[color:var(--color-border-strong)] dark:border-border shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-sm hover:border-primary/40 dark:hover:border-primary/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:hover:shadow-md hover:bg-muted/20 dark:hover:bg-transparent hover:ring-1 hover:ring-primary/10",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(37,99,235,0.3)] dark:shadow-md border-primary"
                      : "text-foreground bg-card"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-250 group-hover:scale-[1.05]",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-primary"
                    )}
                    strokeWidth={2}
                  />
                  <span
                    className={cn(
                      "break-words leading-tight text-center text-sm font-medium",
                      isActive
                        ? "text-primary-foreground"
                        : "text-foreground"
                    )}
                  >
                    {segment.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section
        className="relative px-4 py-[60px] sm:px-6 lg:px-8"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-3xl font-bold text-foreground">
            {t("sec_caps")}
          </h2>

          <div className="space-y-16">
            {FEATURES.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1, duration: 0.5 }}
              >
                <div className="mb-8">
                  <h3 className="mb-3 text-2xl font-semibold text-foreground">
                    {category.category}
                  </h3>
                  <div className="h-px w-24 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                </div>

                <div
                  className={cn(
                    "grid gap-5",
                    categoryIndex === 0
                      ? "md:grid-cols-2 lg:grid-cols-3"
                      : categoryIndex === 1
                      ? "md:grid-cols-2 lg:grid-cols-3"
                      : "sm:grid-cols-2 lg:grid-cols-3"
                  )}
                >
                  {category.items.map((item, itemIndex) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay:
                            categoryIndex * 0.1 + itemIndex * 0.05,
                          duration: 0.3,
                        }}
                        whileHover={{ y: -2 }}
                        className="flex flex-col gap-3 rounded-2xl bg-card backdrop-blur-sm border border-border p-6 transition-all duration-250 ease-out shadow-[var(--shadow-soft)] hover:border-border-hover hover:shadow-[var(--shadow-card)]"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-6 w-6 flex-shrink-0 text-primary" strokeWidth={2} />
                          <span className="text-base font-semibold text-foreground">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS + QUICK START */}
      <section
        id="how-it-works"
        className="relative px-4 py-[60px] sm:px-6 lg:px-8 scroll-mt-32"
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-3xl font-bold text-foreground">
            {t("sec_how")}
          </h2>

          <div className="relative flex flex-col items-center gap-12 lg:flex-row lg:justify-between lg:gap-8 mb-20">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex flex-1 flex-col items-center text-center"
            >
              <div className="mb-4 rounded-full bg-primary/10 p-6">
                <Smartphone className="h-12 w-12 text-primary" strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {t("landing_how_works_step1_title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("landing_how_works_step1_desc")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="hidden lg:block"
            >
              <ArrowRight className="h-8 w-8 text-muted-foreground" strokeWidth={2} />
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-1 flex-col items-center text-center"
            >
              <div className="mb-4 rounded-full bg-primary/10 p-6">
                <Cpu className="h-12 w-12 text-primary" strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {t("landing_how_works_step2_title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("landing_how_works_step2_desc")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="hidden lg:block"
            >
              <ArrowRight className="h-8 w-8 text-muted-foreground" strokeWidth={2} />
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-1 flex-col items-center text-center"
            >
              <div className="mb-4 rounded-full bg-primary/10 p-6">
                <LineChart className="h-12 w-12 text-primary" strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {t("landing_how_works_step3_title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("landing_how_works_step3_desc")}
              </p>
            </motion.div>
          </div>

          {/* QUICK START */}
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              {t("landing_quick_start_title")}
            </h2>

            <p className="mb-8 text-muted-foreground max-w-xl mx-auto text-sm">
              Меньше минуты, без карты и платежей
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex justify-center"
            >
              <Link href="/register">
                <PrimaryButton className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:via-blue-400 hover:to-indigo-500 shadow-[0_10px_30px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.55)] hover:-translate-y-[1px] transition-all duration-200 px-8 h-14 text-base">
                  {t("landing_btn_create_director")}
                </PrimaryButton>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
