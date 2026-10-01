/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      transitionTimingFunction: {
        'coverflow': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-down': {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.93)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'progress-bar': {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'fade-in-up':    'fade-in-up 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':       'fade-in 0.3s ease both',
        'slide-down':    'slide-down 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':      'scale-in 0.2s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-up-d1': 'fade-in-up 0.45s 0.08s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-up-d2': 'fade-in-up 0.45s 0.16s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-up-d3': 'fade-in-up 0.45s 0.24s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-up-d4': 'fade-in-up 0.45s 0.32s cubic-bezier(0.16,1,0.3,1) both',
        'progress-bar':  'progress-bar 5.5s linear both',
      },
    },
  },
  plugins: [],
}
