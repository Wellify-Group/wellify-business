"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/language-provider";
import { useBusinessModalStore } from "@/lib/useBusinessModalStore";
import businessTypesData from "@/data/businessTypes.json";
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
} from "lucide-react";

export default function Home() {
  const { t } = useLanguage();
  const { openModal, isOpen, modalData } = useBusinessModalStore();

  const scrollToHowItWorks = () => {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Иконки для типов бизнеса
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

  // Объединяем данные из JSON с иконками и переводами
  const SEGMENTS = useMemo(() => {
    return businessTypesData.map((business) => {
      // Используем fileId для переводов, если он есть, иначе id
      const translationKey = business.fileId || String(business.id);
      // Нормализуем ключ: barber -> barbershop, beauty_salon -> beauty, car_wash -> auto, fitness_gym -> sports
      const normalizedKey = translationKey === 'barber' ? 'barbershop' 
        : translationKey === 'beauty_salon' ? 'beauty'
        : translationKey === 'car_wash' ? 'auto'
        : translationKey === 'fitness_gym' ? 'sports'
        : translationKey;
      
      // Получаем описание для категории
      const descriptionKey = `landing_industriesDescriptions_${normalizedKey}`;
      const description = t(descriptionKey) || "";
      
      return {
        id: business.id,
        label: t(`biz_${normalizedKey}`) || business.name,
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
      openModal({
        id: String(segment.data.id),
        title: segment.label,
        description: segment.description,
        features: [],
        functions: [],
        icon: (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        ),
      });
    }
  };

  // Определяем активную карточку на основе открытой модалки
  const activeCategoryId = isOpen && modalData ? modalData.id : null;

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
    <main className="relative min-h-screen bg-[#F7F7F7] dark:bg-[#0F0F0F]">
      {/* 1. HERO - Redesigned */}
      <section className="relative flex items-center justify-center px-4 pt-10 md:pt-14 pb-8 sm:px-6 lg:px-8 bg-[#F7F7F7] dark:bg-[#0F0F0F]">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 py-8 md:py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight"
          >
            Вся выручка, смены и сотрудники в одном кабинете
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="max-w-2xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400"
          >
            {t("landing_hero_main_desc")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href={signupHref}
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              {t("landing_btn_create_director")}
            </Link>
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              {t("landing_btn_how_it_works")}
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. BUSINESS TYPES - Full Grid of Categories */}
      <section className="relative bg-[#F7F7F7] dark:bg-[#0F0F0F] px-4 pt-8 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">
            {t("sec_whom")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {SEGMENTS.map((segment, index) => {
              const Icon = segment.icon;
              const isActive = activeCategoryId === String(segment.id);
              return (
                <motion.button
                  key={segment.id}
                  type="button"
                  onClick={() => handleCardClick(segment)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: index * 0.03, duration: 0.3 }}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer shadow-lg bg-white/90 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 min-h-[120px] sm:min-h-[140px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:shadow-xl hover:border-white/60 dark:hover:border-white/20",
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xl border-zinc-800 dark:border-zinc-200"
                      : ""
                  )}
                >
                  <Icon className={cn(
                    "mb-2 sm:mb-3 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0",
                    isActive 
                      ? "text-white dark:text-zinc-900" 
                      : "text-zinc-700 dark:text-zinc-300"
                  )} />
                  <span className={cn(
                    "break-words leading-tight font-medium text-xs sm:text-sm mb-1",
                    isActive ? "text-white dark:text-zinc-900" : ""
                  )}>
                    {segment.label}
                  </span>
                  {segment.description && (
                    <span className={cn(
                      "text-[10px] sm:text-xs leading-tight mt-1 opacity-80",
                      isActive 
                        ? "text-white/90 dark:text-zinc-900/90" 
                        : "text-zinc-600 dark:text-zinc-400"
                    )}>
                      {segment.description}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES - Categorized */}
      <section className="relative bg-[#F7F7F7] dark:bg-[#0F0F0F] px-4 py-[60px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            {t("sec_caps")}
          </h2>
          <div className="space-y-12">
            {FEATURES.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1, duration: 0.5 }}
              >
                <h3 className="mb-6 text-xl font-semibold text-foreground">
                  {category.category}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: categoryIndex * 0.1 + itemIndex * 0.05,
                          duration: 0.3,
                        }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="flex flex-col gap-2 rounded-2xl bg-white/90 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 p-4 transition-all shadow-lg hover:shadow-xl hover:border-white/60 dark:hover:border-white/20"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-6 w-6 flex-shrink-0 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
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

      {/* 4. HOW IT WORKS - Updated */}
      <section
        id="how-it-works"
        className="relative bg-[#F7F7F7] dark:bg-[#0F0F0F] px-4 py-[60px] sm:px-6 lg:px-8 scroll-mt-32"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            {t("sec_how")}
          </h2>
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex flex-1 flex-col items-center text-center"
            >
              <div className="mb-4 rounded-full bg-primary/10 p-6">
                <Smartphone className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {t("landing_how_works_step1_title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("landing_how_works_step1_desc")}
              </p>
            </motion.div>

            {/* Arrow */}
            <ArrowRight className="hidden h-8 w-8 rotate-90 text-muted-foreground lg:block lg:rotate-0" />

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-1 flex-col items-center text-center"
            >
              <div className="mb-4 rounded-full bg-primary/10 p-6">
                <Cpu className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {t("landing_how_works_step2_title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("landing_how_works_step2_desc")}
              </p>
            </motion.div>

            {/* Arrow */}
            <ArrowRight className="hidden h-8 w-8 rotate-90 text-muted-foreground lg:block lg:rotate-0" />

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-1 flex-col items-center text-center"
            >
              <div className="mb-4 rounded-full bg-primary/10 p-6">
                <LineChart className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                {t("landing_how_works_step3_title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("landing_how_works_step3_desc")}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. QUICK START */}
      <section className="relative bg-[#F7F7F7] dark:bg-[#0F0F0F] px-4 py-[60px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground">
            {t("landing_quick_start_title")}
          </h2>
          <p className="mb-8 text-center text-muted-foreground max-w-xl mx-auto">
            Откройте аккаунт директора и настройте свои точки, сотрудников и смены в одном кабинете.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              {t("landing_btn_create_director")}
            </Link>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
