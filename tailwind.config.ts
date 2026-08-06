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
        background: "var(--background)",
        foreground: "var(--foreground)",
        medical: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
        healthGreen: {
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
        },
        navyDark: "#0B132B",
        cardDark: "#1C2541",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'orb-listen': 'orbListen 1.5s ease-in-out infinite alternate',
        'orb-think': 'orbThink 2s linear infinite',
        'orb-speak': 'orbSpeak 0.8s ease-in-out infinite alternate',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        orbListen: {
          '0%': { boxShadow: '0 0 25px rgba(20, 184, 166, 0.4), 0 0 50px rgba(20, 184, 166, 0.2)' },
          '100%': { boxShadow: '0 0 50px rgba(20, 184, 166, 0.8), 0 0 100px rgba(59, 130, 246, 0.5)' },
        },
        orbThink: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.08)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        orbSpeak: {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 30px rgba(34, 197, 94, 0.6)' },
          '100%': { transform: 'scale(1.12)', boxShadow: '0 0 60px rgba(34, 197, 94, 0.9), 0 0 120px rgba(16, 185, 129, 0.4)' },
        }
      },
    },
  },
  plugins: [],
};
export default config;
