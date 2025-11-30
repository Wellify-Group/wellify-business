import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { SupportWidget } from "@/components/support-widget";
import { Navbar } from "@/components/navbar";
import { AppFooter } from "@/components/footer";
import { BusinessModal } from "@/components/modals/BusinessModal";
import { MainWrapper } from "@/components/main-wrapper";
import { ProductBrandInit } from "@/components/product-brand-init";

export const runtime = 'nodejs';

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "WELLIFY business - вся выручка, смены и сотрудники в одном кабинете",
  description: "Управляйте своим бизнесом эффективно. WELLIFY business - платформа для контроля смен, выручки, сотрудников и аналитики в реальном времени.",
  openGraph: {
    title: "WELLIFY business - вся выручка, смены и сотрудники в одном кабинете",
    description: "Управляйте своим бизнесом эффективно. WELLIFY business - платформа для контроля смен, выручки, сотрудников и аналитики в реальном времени.",
    type: "website",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "WELLIFY business",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} style={{ backgroundColor: 'var(--color-background)' }}>
        <LanguageProvider>
          {/* Initialize product brand colors */}
          <ProductBrandInit />
          {/* ⚠️ ЗАФИКСИРОВАННЫЙ КОД - НЕ ИЗМЕНЯТЬ БЕЗ ЯВНОГО РАЗРЕШЕНИЯ ⚠️
              ThemeProvider теперь содержит все настройки внутри себя.
              Не передавайте props в ThemeProvider - они уже настроены. */}
          <ThemeProvider>
            <Navbar />
            <MainWrapper>
              {children}
            </MainWrapper>
            <AppFooter />
          </ThemeProvider>
          {/* Support Widget - Outside ThemeProvider to avoid layout constraints */}
          <SupportWidget />
          {/* Business Modal - Outside ThemeProvider to avoid layout constraints */}
          <BusinessModal />
        </LanguageProvider>
      </body>
    </html>
  );
}
