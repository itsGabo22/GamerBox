import type { Metadata } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";

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
        <div className="w-full max-w-md mx-auto min-h-screen relative flex flex-col bg-obsidian-dark/20 border-x border-white/5 shadow-2xl">
          <main className="flex-1 pb-32 relative">
            {children}
          </main>
          <Navigation />
        </div>
      </body>
    </html>
  );
}
