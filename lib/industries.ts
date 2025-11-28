import type { LucideIcon } from "lucide-react";
import {
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Scissors,
  Store,
  CarFront,
  Package,
  Flower2,
  Printer,
  Wrench,
  ChefHat,
} from "lucide-react";

export type IndustryProfile = {
  slug: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  translationKey: string;
  recommendedFields: string[];
  analyticsHighlights: string[];
  shiftExample: {
    cash?: string;
    card?: string;
    metric?: string;
    [key: string]: string | undefined;
  };
};

// Array with correct order (1-12)
export const INDUSTRIES_ARRAY: IndustryProfile[] = [
  {
    slug: "cafe",
    titleKey: "biz_cafe",
    translationKey: "biz_cafe",
    descKey: "industry_cafe_desc",
    icon: UtensilsCrossed,
    recommendedFields: ["field_cash", "field_card", "field_guests", "field_tips", "field_waste"],
    analyticsHighlights: ["metric_avg_check", "metric_table_turnover"],
    shiftExample: {
      cash: "15 000",
      card: "32 000",
      metric: "145 Guests",
    },
  },
  {
    slug: "coffee",
    titleKey: "biz_coffee",
    translationKey: "biz_coffee",
    descKey: "industry_coffee_desc",
    icon: Coffee,
    recommendedFields: ["field_cash", "field_card", "field_guests", "field_tips"],
    analyticsHighlights: ["metric_avg_check", "metric_peak_hours"],
    shiftExample: {
      cash: "8 500",
      card: "24 000",
      metric: "98 Guests",
    },
  },
  {
    slug: "retail",
    titleKey: "biz_retail",
    translationKey: "biz_retail",
    descKey: "industry_retail_desc",
    icon: ShoppingBag,
    recommendedFields: ["field_cash", "field_card", "field_returns", "field_discounts"],
    analyticsHighlights: ["metric_avg_receipt", "metric_conversion"],
    shiftExample: {
      cash: "12 000",
      card: "45 000",
      metric: "67 Receipts",
    },
  },
  {
    slug: "beauty",
    titleKey: "biz_beauty",
    translationKey: "biz_beauty",
    descKey: "industry_beauty_desc",
    icon: Scissors,
    recommendedFields: ["field_services", "field_products", "field_returns"],
    analyticsHighlights: ["metric_retention", "metric_avg_service"],
    shiftExample: {
      services: "28 000",
      products: "12 000",
      metric: "23 Clients",
    },
  },
  {
    slug: "street",
    titleKey: "biz_street",
    translationKey: "biz_street",
    descKey: "industry_street_desc",
    icon: Store,
    recommendedFields: ["field_cash", "field_card", "field_guests", "field_waste"],
    analyticsHighlights: ["metric_avg_order", "metric_weather_corr"],
    shiftExample: {
      cash: "18 000",
      card: "22 000",
      metric: "312 Orders",
    },
  },
  {
    slug: "bakery",
    titleKey: "biz_bakery",
    translationKey: "biz_bakery",
    descKey: "industry_bakery_desc",
    icon: Store,
    recommendedFields: ["field_cash", "field_card", "field_guests", "field_waste"],
    analyticsHighlights: ["metric_avg_check", "metric_product_mix"],
    shiftExample: {
      cash: "9 500",
      card: "19 000",
      metric: "89 Guests",
    },
  },
  {
    slug: "auto",
    titleKey: "biz_auto",
    translationKey: "biz_auto",
    descKey: "industry_auto_desc",
    icon: CarFront,
    recommendedFields: ["field_washes", "field_polishing", "field_chemicals"],
    analyticsHighlights: ["metric_cars_per_hour", "metric_weather_corr"],
    shiftExample: {
      washes: "45",
      polishing: "12",
      metric: "57 Cars",
    },
  },
  {
    slug: "pickup",
    titleKey: "biz_pickup",
    translationKey: "biz_pickup",
    descKey: "industry_pickup_desc",
    icon: Package,
    recommendedFields: ["field_orders", "field_returns", "field_issues"],
    analyticsHighlights: ["metric_avg_orders", "metric_peak_hours"],
    shiftExample: {
      orders: "234",
      returns: "8",
      metric: "226 Delivered",
    },
  },
  {
    slug: "flowers",
    titleKey: "biz_flowers",
    translationKey: "biz_flowers",
    descKey: "industry_flowers_desc",
    icon: Flower2,
    recommendedFields: ["field_cash", "field_card", "field_orders", "field_waste"],
    analyticsHighlights: ["metric_avg_order", "metric_seasonal"],
    shiftExample: {
      cash: "6 000",
      card: "18 000",
      metric: "42 Orders",
    },
  },
  {
    slug: "print",
    titleKey: "biz_print",
    translationKey: "biz_print",
    descKey: "industry_print_desc",
    icon: Printer,
    recommendedFields: ["field_cash", "field_card", "field_paper_count", "field_services_revenue"],
    analyticsHighlights: ["metric_avg_order", "metric_daily_prints"],
    shiftExample: {
      cash: "8 000",
      card: "12 000",
      metric: "450 Prints",
    },
  },
  {
    slug: "services",
    titleKey: "biz_services",
    translationKey: "biz_services",
    descKey: "industry_services_desc",
    icon: Wrench,
    recommendedFields: ["field_services", "field_products", "field_returns"],
    analyticsHighlights: ["metric_avg_service", "metric_retention"],
    shiftExample: {
      services: "35 000",
      products: "8 000",
      metric: "18 Services",
    },
  },
  {
    slug: "dark",
    titleKey: "biz_dark",
    translationKey: "biz_dark",
    descKey: "industry_dark_desc",
    icon: ChefHat,
    recommendedFields: ["field_orders", "field_delivery", "field_waste"],
    analyticsHighlights: ["metric_avg_order", "metric_delivery_time"],
    shiftExample: {
      orders: "156",
      delivery: "142",
      metric: "142 Delivered",
    },
  },
];

// Record for backward compatibility
export const INDUSTRIES: Record<string, IndustryProfile> = INDUSTRIES_ARRAY.reduce(
  (acc, industry) => {
    acc[industry.slug] = industry;
    return acc;
  },
  {} as Record<string, IndustryProfile>
);

