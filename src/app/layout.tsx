import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"], 
  variable: '--font-space-grotesk',
  display: 'swap',
});

const spaceMono = Space_Mono({ 
  weight: ["400", "700"],
  subsets: ["latin"], 
  variable: '--font-space-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "GamerBox",
  description: "A premium social platform for gamers",
  manifest: "/manifest.ts",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GamerBox",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col bg-obsidian-black text-white selection:bg-neon-red/30 overscroll-none">
        <NotificationProvider>
          <div className="w-full max-w-md mx-auto min-h-screen relative flex flex-col bg-obsidian-dark/20 border-x border-white/5 shadow-2xl">
            <GlobalHeader />
            <main className="flex-1 pb-32 relative">
              {children}
            </main>
            <Navigation />
          </div>
        </NotificationProvider>
      </body>
    </html>
  );
}
