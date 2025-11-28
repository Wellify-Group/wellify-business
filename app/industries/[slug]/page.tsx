"use client";

import { useLanguage } from "@/components/language-provider";
import { INDUSTRIES, type IndustryProfile } from "@/lib/industries";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ArrowRight, TrendingUp, Users, DollarSign } from "lucide-react";
import { useMemo } from "react";

// Цветовые темы для индустрий
const getIndustryTheme = (slug: string | null) => {
  if (!slug) return "from-zinc-500/20 to-zinc-600/20";
  
  const warm = ["cafe", "coffee", "bakery"];
  const soft = ["beauty", "flowers"];
  const cool = ["auto", "services", "pickup", "print"];
  const fresh = ["retail", "shop", "street"];
  
  if (warm.includes(slug)) return "from-orange-500/20 to-blue-500/20";
  if (soft.includes(slug)) return "from-pink-500/20 to-rose-500/20";
  if (cool.includes(slug)) return "from-blue-600/20 to-cyan-500/20";
  if (fresh.includes(slug)) return "from-emerald-500/20 to-green-500/20";
  
  return "from-zinc-500/20 to-zinc-600/20";
};

export default function IndustryPage() {
  const { t } = useLanguage();
  const params = useParams();
  const pathname = usePathname();

  // Извлекаем slug напрямую из params или pathname
  const slug = useMemo(() => {
    if (params?.slug) {
      const slugValue = params.slug;
      if (Array.isArray(slugValue)) {
        return slugValue[0] || null;
      }
      if (typeof slugValue === 'string' && slugValue !== 'undefined') {
        return slugValue;
      }
    }
    
    if (pathname) {
      const match = pathname.match(/\/industries\/([^\/]+)/);
      if (match?.[1] && match[1] !== 'undefined') {
        return match[1];
      }
    }
    
    return null;
  }, [params, pathname]);

  // Получаем индустрию по slug
  const industry = useMemo(() => {
    if (!slug) return null;
    return INDUSTRIES[slug] as IndustryProfile | undefined || null;
  }, [slug]);

  // Получаем цветовую тему
  const themeGradient = useMemo(() => getIndustryTheme(slug), [slug]);
  
  // Показываем загрузку только если pathname еще не загружен
  if (!pathname) {
    return (
      <main className="relative min-h-screen bg-background">
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  // Если slug undefined или пустой - показываем 404
  if (!slug || slug === "undefined") {
    return (
      <main className="relative min-h-screen bg-background">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
            <p className="text-muted-foreground">This industry page could not be found.</p>
            <Link href="/" className="mt-4 inline-block text-primary hover:underline">
              {t("back_to_home")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Если индустрия не найдена - показываем 404
  if (!industry) {
    return (
      <main className="relative min-h-screen bg-background">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
            <p className="text-muted-foreground">Industry "{slug}" not found.</p>
            <Link href="/" className="mt-4 inline-block text-primary hover:underline">
              {t("back_to_home")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const Icon = industry.icon;
  const industryTitle = t(industry.titleKey);

  return (
    <main className="relative min-h-screen bg-background">
      {/* HERO SECTION with Color Theme */}
      <section className="relative flex min-h-[70vh] items-center justify-center border-b border-border bg-card/30 px-4 pt-32 pb-16 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Glow Orb */}
        <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${themeGradient} blur-3xl opacity-50`} />
        
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex justify-center"
          >
            <div className="rounded-full bg-primary/10 p-6">
              <Icon className="h-16 w-16 text-primary" />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            {t("industry_hero_title").replace("{industry}", industryTitle)}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 text-xl text-muted-foreground sm:text-2xl"
          >
            {t(industry.descKey)}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <span>{t("btn_optimize")}</span>
                <ArrowRight className="ml-2 inline h-5 w-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* SECTION 1: The Perfect Shift - Apple-style Showcase */}
      <section className="relative border-b border-border bg-background px-4 py-24 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle radial gradient background */}
        <div 
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            background: `radial-gradient(circle at center, ${themeGradient.includes('orange') ? 'rgba(249, 115, 22, 0.1)' : themeGradient.includes('pink') ? 'rgba(236, 72, 153, 0.1)' : themeGradient.includes('blue') ? 'rgba(37, 99, 235, 0.1)' : themeGradient.includes('emerald') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(113, 113, 122, 0.1)'}) 0%, transparent 70%)`
          }}
        />
        
        <div className="mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center text-4xl font-bold text-foreground sm:text-5xl"
          >
            {t("sec_ideal_shift")}
          </motion.h2>
          
          {/* Centered Phone Showcase */}
          <div className="relative flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative scale-110 lg:scale-125"
            >
              {/* Phone Frame - High-Fidelity */}
              <div className="relative rounded-[3rem] border-8 border-zinc-800 dark:border-zinc-700 bg-zinc-900 p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)]">
                {/* Screen with gloss effect */}
                <div className="relative rounded-[2rem] bg-gradient-to-b from-zinc-950 to-zinc-900 p-6 shadow-inner">
                  {/* Screen reflection overlay */}
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Header */}
                  <div className="mb-6 flex items-center justify-between relative z-10">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      {t("shift_report")}
                    </h3>
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                  </div>
                  
                  {/* Glassmorphism Inputs */}
                  <div className="space-y-3 relative z-10">
                    {industry.recommendedFields.slice(0, 3).map((fieldKey: string, index: number) => {
                      const values = [
                        industry.shiftExample.cash || "12,500 ₴",
                        industry.shiftExample.card || "28,000 ₴",
                        industry.shiftExample.metric || "145 Guests"
                      ];
                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-white/10 bg-white/10 dark:bg-white/5 backdrop-blur-md p-4 shadow-lg"
                        >
                          <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {t(fieldKey)}
                          </label>
                          <div className="text-right text-lg font-semibold text-foreground tabular-nums">
                            {values[index]}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Submit Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 px-6 py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all"
                    >
                      <span>{t("finish_shift")}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Floating Recommendation Cards */}
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industry.recommendedFields.slice(0, 3).map((fieldKey: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                className="glass-card rounded-xl border border-border bg-card/50 p-4 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t("lbl_rec_fields").split(":")[0]}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {t(fieldKey)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: Director's Insights - Premium Analytics */}
      <section className="relative border-b border-border bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
        {/* Subtle pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        
        <div className="mx-auto max-w-6xl relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center text-4xl font-bold text-foreground sm:text-5xl"
          >
            {t("sec_director_insights")}
          </motion.h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1: Revenue Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="glass-card rounded-2xl border border-border bg-card/50 p-8 backdrop-blur-xl"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t("feat_revenue")}
                </h3>
              </div>
              
              {/* Sparkline SVG */}
              <div className="mb-4 h-16 w-full">
                <svg className="h-full w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <polyline
                    points="0,30 20,25 40,20 60,15 80,10 100,5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary opacity-60"
                  />
                </svg>
              </div>
              
              <div className="space-y-2">
                <div className="text-5xl font-bold tracking-tight text-foreground tabular-nums">
                  {industry.shiftExample.cash || industry.shiftExample.services || "0"}
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {industry.shiftExample.card && `+ ${industry.shiftExample.card}`}
                </p>
              </div>
            </motion.div>

            {/* Card 2 & 3: Analytics Highlights */}
            {industry.analyticsHighlights.slice(0, 2).map((metricKey: string, index: number) => {
              const sparklineData = index === 0 
                ? [30, 25, 20, 15, 10, 5]
                : [20, 25, 30, 28, 32, 35];
              const values = index === 0 ? "₴1,240" : "87%";
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  className="glass-card rounded-2xl border border-border bg-card/50 p-8 backdrop-blur-xl"
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-3">
                      {index === 0 ? (
                        <DollarSign className="h-6 w-6 text-primary" />
                      ) : (
                        <Users className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {t(metricKey)}
                    </h3>
                  </div>
                  
                  {/* Sparkline SVG */}
                  <div className="mb-4 h-16 w-full">
                    <svg className="h-full w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                      <polyline
                        points={sparklineData.map((val, i) => `${(i * 20)},${40 - val}`).join(' ')}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-primary opacity-60"
                      />
                    </svg>
                  </div>
                  
                  <div className="text-5xl font-bold tracking-tight text-foreground tabular-nums">
                    {values}
                  </div>
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    {index === 0 ? (t("metric_avg_check") || "Average") : (t("metric_retention") || "Retention rate")}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: CTA - Premium Gradient Card */}
      <section className="relative bg-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-zinc-900 to-zinc-950 p-12 shadow-2xl`}
          >
            {/* Industry color glow behind */}
            <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${themeGradient} blur-3xl opacity-20`} />
            
            <div className="relative z-10 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
                {t("ready_to_optimize").replace("{industry}", industryTitle)}
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                {t("hero.subheadline") || "Start your free trial today and see the difference."}
              </p>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl bg-white px-8 py-4 text-lg font-bold text-black transition-all hover:bg-gray-100 shadow-lg"
                >
                  <span>{t("btn_optimize")}</span>
                  <ArrowRight className="ml-2 inline h-5 w-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
