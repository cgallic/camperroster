import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["600", "700"],
  display: "swap"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "700"],
  display: "swap"
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#10b981" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1713" }
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export const metadata: Metadata = {
  metadataBase: new URL("https://camperroster.com"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CamperRoster"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  title: {
    default: "CamperRoster — Modern Camp Registration Software & Operations Platform",
    template: "%s | CamperRoster"
  },
  description: "Get every camper and volunteer ready before opening day with registration, paperwork tracking, health records, cabin assignments, and camp operations in one place.",
  keywords: [
    "camp registration software",
    "church camp software",
    "ultracamp alternative",
    "summer camp management software",
    "camp medical software",
    "camp emar",
    "camp volunteer reference check",
    "cashless camp canteen pos",
    "Camp Hope registration"
  ],
  authors: [{ name: "CamperRoster" }],
  creator: "CamperRoster",
  publisher: "CamperRoster Inc.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    // relative, so og:url matches the canonical on every route (see alternates below)
    url: "./",
    siteName: "CamperRoster",
    title: "CamperRoster — Modern Camp Registration Software & Operations Platform",
    description: "Camp registration, paperwork tracking, health records, cabin assignments, and express QR gate check-in.",
    images: [
      {
        url: "/images/camp_hero.jpg",
        width: 1200,
        height: 630,
        alt: "CamperRoster — Modern Camp OS for Summer Camps"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CamperRoster — Modern Camp Registration Software",
    description: "Mobile-first camp registration and day-to-day camp operations without off-season retainers.",
    images: ["/images/camp_hero.jpg"]
  },
  // "./" resolves against metadataBase + the current pathname, so every route
  // emits a SELF-referencing canonical. A hard-coded homepage URL here made all
  // nine programmatic landing pages canonicalise to "/".
  alternates: {
    canonical: "./"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <JsonLd />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-[100dvh] flex flex-col font-sans bg-stone-50 text-stone-900 antialiased selection:bg-forest-800 selection:text-white">
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
