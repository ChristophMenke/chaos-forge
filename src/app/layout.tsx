import type { Metadata } from "next";
import { Cinzel, Crimson_Text, Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { ApprovalBanner } from "@/components/approval-banner";
import { ApprovalErrorToast } from "@/components/approval-error-toast";
import { SkipToMain } from "@/components/skip-to-main";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const crimsonText = Crimson_Text({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chaos Forge — AD&D 2nd Edition Manager",
  description: "Charakter-Manager und Session-Tracker für Advanced Dungeons & Dragons 2nd Edition.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Chaos Forge",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#1a1408",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${cinzel.variable} ${crimsonText.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        {/* Embed mode: hide header, sidebar, nav when loaded in iframe */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(new URLSearchParams(location.search).has('embed'))document.documentElement.classList.add('embed-mode')`,
          }}
        />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <TooltipProvider>
              <SkipToMain />
              <AppHeader />
              <ApprovalBanner />
              <ApprovalErrorToast />

              <main id="main" className="flex flex-1 flex-col pb-16 sm:pb-0">
                {children}
              </main>
              <AppFooter />
            </TooltipProvider>
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </NextIntlClientProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
