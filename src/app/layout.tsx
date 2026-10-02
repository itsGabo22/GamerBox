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
      <body className="antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
