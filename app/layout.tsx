import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/lang";
import AppShell from "@/components/AppShell";
import PwaRegister from "@/components/PwaRegister";
import { ORG_NAME, ORG_SLOGAN } from "@/lib/bn";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: ORG_NAME, template: `%s | ${ORG_NAME}` },
  description: ORG_SLOGAN,
  appleWebApp: { capable: true, title: "আলোকিত যুব শক্তি", statusBarStyle: "default" },
  icons: { apple: "/icon-192.png" },
  openGraph: {
    title: ORG_NAME,
    description: ORG_SLOGAN,
    locale: "bn_BD",
    type: "website",
    siteName: ORG_NAME,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#5a9fd0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <LangProvider><AppShell>{children}</AppShell></LangProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
