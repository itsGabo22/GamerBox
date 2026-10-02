import type { Metadata } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

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

import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "GamerBox | Obsidian Arcade",
  description: "A premium social platform for gamers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="antialiased min-h-screen flex flex-col bg-obsidian-black text-white selection:bg-neon-red/30">
        <Sidebar />
        <main className="flex-1 md:pl-64 pb-24 md:pb-0 relative min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
