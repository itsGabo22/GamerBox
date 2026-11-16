import type { Config } from "tailwindcss";

// Tokens are stored as RGB channels so Tailwind opacity modifiers (`bg-neon-red/10`)
// work in both themes. See globals.css.
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'obsidian-black': token('--c-bg'),
        'obsidian-dark': token('--c-panel'),
        'neon-red': token('--c-red'),
        'neon-red-bright': token('--c-red-bright'),
        'mint-green': token('--c-mint'),
        'text-dim': token('--c-dim'),
        white: token('--c-text'),
        scrim: token('--c-scrim'),
        'real-white': '#FFFFFF',
        'surface-glass': 'var(--bg-surface-glass)',
        'surface-glass-hover': 'var(--bg-surface-glass-hover)',
        'surface-border': 'var(--border-base)',
        'surface-solid': 'var(--bg-surface-solid)',
      },
      fontFamily: {
        heading: ['var(--font-space-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 15px rgb(var(--c-red) / 0.45)',
        'neon-bright': '0 0 25px rgb(var(--c-red-bright) / 0.6)',
        mint: '0 0 15px rgb(var(--c-mint) / 0.35)',
        glass: 'var(--shadow-elevation)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        blink: { '0%, 49%': { opacity: '1' }, '50%, 100%': { opacity: '0' } },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-in-out infinite',
        float: 'float 5s ease-in-out infinite',
        'spin-slow': 'spinSlow 18s linear infinite',
        scan: 'scan 3.5s linear infinite',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
};
export default config;
