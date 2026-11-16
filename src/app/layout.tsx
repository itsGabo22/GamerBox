import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BackButtonHandler } from "@/components/layout/BackButtonHandler";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-space-mono", display: "swap" });

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "GamerBox",
  description: "Obsidian Arcade — your game vault, squad and stats.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GamerBox" },
  formatDetection: { telephone: false },
};

// Applies the saved theme/language before first paint so there is never a wrong-theme flash.
const bootScript = `try{var s=JSON.parse(localStorage.getItem('gamerbox-settings')||'{}').state||{};var d=document.documentElement;d.setAttribute('data-theme',s.theme==='light'?'light':'dark');if(s.language)d.lang=s.language;}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      data-theme="dark"
      className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-[100dvh] flex-col antialiased selection:bg-neon-red/30">
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <BackButtonHandler />
        <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
          <AuthGuard>{children}</AuthGuard>
        </div>
      </body>
    </html>
  );
}
