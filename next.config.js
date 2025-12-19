/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Гарантируем правильную загрузку статических файлов, включая logo.svg
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    // Разрешаем загрузку SVG из public
    dangerouslyAllowSVG: true,
    // Упрощаем CSP для SVG, чтобы не блокировать статику
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Убеждаемся, что public директория правильно обслуживается
  publicRuntimeConfig: {
    logoPath: '/logo.svg',
  },
  // Явно указываем NEXT_PUBLIC_* переменные для встраивания в клиентский bundle
  // Это гарантирует, что переменные будут доступны в браузере
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
    NEXT_PUBLIC_TELEGRAM_API_URL: process.env.NEXT_PUBLIC_TELEGRAM_API_URL,
  },
  // Явно указываем, что статические файлы должны обслуживаться
  // Не используем basePath или assetPrefix, чтобы не сломать пути к _next/static
};

module.exports = nextConfig;



