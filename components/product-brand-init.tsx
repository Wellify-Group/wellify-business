"use client";

import { useEffect } from "react";
import { initProductBrand } from "@/lib/ui/product-config";

/**
 * Product Brand Initialization Component
 * 
 * Инициализирует брендовые цвета продукта при загрузке приложения.
 * Устанавливает CSS переменные для accent-main, accent-soft, accent-strong.
 */
export function ProductBrandInit() {
  useEffect(() => {
    initProductBrand();
  }, []);

  return null;
}















