/**
 * Design System Tokens
 * 
 * Единая система дизайн-токенов для всей платформы.
 * Обеспечивает консистентность стилей, поддержку темной/светлой темы
 * и готовность к расширению.
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
  // Dark Theme
  dark: {
    background: {
      primary: '#0F0F0F',
      card: '#1A1A1A',
      secondary: '#252525',
    },
    border: {
      default: '#2A2A2A',
      light: '#3A3A3A',
      dark: '#1A1A1A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B4B4B4',
      tertiary: '#808080',
      disabled: '#4A4A4A',
    },
    accent: {
      // Product brand accent - uses CSS variables, not hardcoded
      // Default: #4b5cff for Wellify Business
      // Change via PRODUCT_CONFIG in product-config.ts
      primary: 'hsl(var(--accent-main-h) var(--accent-main-s) var(--accent-main-l))',
      soft: 'hsl(var(--accent-soft-h) var(--accent-soft-s) var(--accent-soft-l))',
      strong: 'hsl(var(--accent-strong-h) var(--accent-strong-s) var(--accent-strong-l))',
    },
    semantic: {
      success: '#15C27C',
      warning: '#FEC84B',
      error: '#F04438',
      info: '#3B82F6',
    },
  },
  // Light Theme
  light: {
    background: {
      primary: '#FFFFFF',
      card: '#F7F7F8',
      secondary: '#F0F0F0',
    },
    border: {
      default: '#E6E6E6',
      light: '#F0F0F0',
      dark: '#D0D0D0',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      tertiary: '#999999',
      disabled: '#CCCCCC',
    },
    accent: {
      // Product brand accent - uses CSS variables, not hardcoded
      primary: 'hsl(var(--accent-main-h) var(--accent-main-s) var(--accent-main-l))',
      soft: 'hsl(var(--accent-soft-h) var(--accent-soft-s) var(--accent-soft-l))',
      strong: 'hsl(var(--accent-strong-h) var(--accent-strong-s) var(--accent-strong-l))',
    },
    semantic: {
      success: '#15C27C',
      warning: '#FEC84B',
      error: '#F04438',
      info: '#3B82F6',
    },
  },
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typography = {
  fontFamily: {
    sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  full: '9999px',
} as const;

// ============================================================================
// SHADOW TOKENS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  dark: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
  },
} as const;

// ============================================================================
// LAYOUT TOKENS
// ============================================================================

export const layout = {
  navbar: {
    height: '56px',
    zIndex: 1000,
  },
  sidebar: {
    width: '220px',
    collapsedWidth: '64px',
    zIndex: 999,
  },
  container: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1400px',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

export const animations = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// ============================================================================
// EXPORT ALL TOKENS
// ============================================================================

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  layout,
  animations,
  zIndex,
} as const;

export type Theme = typeof theme;

