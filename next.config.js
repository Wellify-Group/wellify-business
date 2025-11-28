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
  // Явно указываем, что статические файлы должны обслуживаться
  // Не используем basePath или assetPrefix, чтобы не сломать пути к _next/static
};

module.exports = nextConfig;



