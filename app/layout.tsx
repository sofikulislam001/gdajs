import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ORG_NAME, ORG_SLOGAN } from "@/lib/bn";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: ORG_NAME, template: `%s | ${ORG_NAME}` },
  description: ORG_SLOGAN,
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
  themeColor: "#0f5c4d",
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
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@600;700&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="container-x flex-1 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
