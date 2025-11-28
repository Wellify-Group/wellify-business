/**
 * Product Brand Configuration
 * 
 * Централизованная конфигурация брендового цвета продукта.
 * Изменение здесь автоматически применяется ко всей платформе.
 */

export interface ProductBrandConfig {
  name: string;
  accentMain: string; // Hex color, e.g., "#4b5cff"
  accentSoft?: string; // Optional, auto-generated if not provided
  accentStrong?: string; // Optional, auto-generated if not provided
}

/**
 * Convert hex color to HSL values
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Current product brand configuration
 * 
 * To change brand color for a different product:
 * 1. Update accentMain with the new hex color
 * 2. Optionally set accentSoft and accentStrong
 * 3. The entire platform will automatically update
 */
export const PRODUCT_CONFIG: ProductBrandConfig = {
  name: "Wellify Business",
  accentMain: "#4b5cff", // Wellify Business brand color
  // accentSoft and accentStrong are auto-generated from accentMain
};

/**
 * Get HSL values for accent-main
 */
export function getAccentMainHsl() {
  return hexToHsl(PRODUCT_CONFIG.accentMain);
}

/**
 * Apply product brand colors to CSS variables
 * Call this function to update the accent color dynamically
 */
export function applyProductBrand() {
  if (typeof window === 'undefined') return;
  
  const hsl = getAccentMainHsl();
  const root = document.documentElement;
  
  root.style.setProperty('--accent-main-h', hsl.h.toString());
  root.style.setProperty('--accent-main-s', `${hsl.s}%`);
  root.style.setProperty('--accent-main-l', `${hsl.l}%`);
}

/**
 * Initialize product brand on mount
 */
export function initProductBrand() {
  if (typeof window !== 'undefined') {
    applyProductBrand();
  }
}















