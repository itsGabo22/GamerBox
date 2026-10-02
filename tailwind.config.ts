import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'obsidian-black': '#050505',
        'obsidian-dark': '#12141D',
        'neon-red': '#E50914',
        'neon-red-bright': '#FF003C',
        'mint-green': '#5EE6A8',
        'surface-glass': 'rgba(255, 255, 255, 0.05)',
        'surface-glass-hover': 'rgba(255, 255, 255, 0.1)',
        'surface-border': 'rgba(255, 255, 255, 0.1)',
        'text-dim': '#858A96',
      },
      fontFamily: {
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glass': 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      boxShadow: {
        'neon': '0 0 15px rgba(229, 9, 20, 0.5)',
        'neon-bright': '0 0 25px rgba(255, 0, 60, 0.7)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
export default config;
