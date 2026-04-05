/** @type {import('tailwindcss').Config} */
/**
 * Nebula + logo palette: overrides default Tailwind cyan/teal/gray/blue scales so
 * utilities like `text-cyan-400` / `bg-gray-800` match globals.css + deep-trade-tokens.
 */
const nebulaCyan = {
  50: '#ecfeff',
  100: '#cffafe',
  200: '#a5f3fc',
  300: '#67e8f9',
  400: '#38bdf8',
  500: '#00e5ff',
  600: '#00b8d8',
  700: '#0891b2',
  800: '#0e7490',
  900: '#155e75',
  950: '#082f3a',
};

const nebulaTeal = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6',
  600: '#0d9488',
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
  950: '#042f2e',
};

const nebulaGray = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#243652',
  800: '#1a2d48',
  900: '#0f1a30',
  950: '#020b26',
};

const nebulaBlue = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
  950: '#082f49',
};

module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        cyan: nebulaCyan,
        teal: nebulaTeal,
        gray: nebulaGray,
        blue: nebulaBlue,
        // Theme-aware colors using CSS variables (Deep Trade when tokens loaded)
        background: 'var(--bg-primary)',
        'background-secondary': 'var(--bg-secondary)',
        'background-tertiary': 'var(--bg-tertiary)',
        'background-card': 'var(--bg-card)',
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        accent: 'var(--accent-color)',
        success: 'var(--success-color)',
        warning: 'var(--warning-color)',
        error: 'var(--error-color)',
        text: 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        border: 'var(--border-color)',
        'border-hover': 'var(--border-hover)',
        // Legacy
        'text-muted': 'var(--text-tertiary)',
        highlight: 'var(--accent-teal)',
        // Deep Trade finance palette (for utility classes)
        'finance-primary': 'var(--finance-primary)',
        'finance-green': 'var(--finance-green)',
        'finance-gold': 'var(--finance-gold)',
        'finance-red': 'var(--finance-red)',
        'finance-purple': 'var(--finance-purple)',
        boing: {
          black: 'var(--boing-black)',
          navy: 'var(--boing-navy)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Comfortaa', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'pulse-fade': 'pulseFade 3s ease-in-out infinite',
        'shooting-star-1': 'shootingStar1 8s linear infinite',
        'shooting-star-2': 'shootingStar2 12s linear infinite',
        'shooting-star-3': 'shootingStar3 10s linear infinite',
        'shooting-star-4': 'shootingStar4 15s linear infinite',
        'shooting-star-5': 'shootingStar5 6s linear infinite',
        'shooting-star-6': 'shootingStar6 9s linear infinite',
        'shooting-star-7': 'shootingStar7 11s linear infinite',
        'shooting-star-8': 'shootingStar8 14s linear infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'float-slower': 'floatSlower 8s ease-in-out infinite',
        'float-slowest': 'floatSlowest 10s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%': { boxShadow: '0 0 5px var(--glow-cyan), 0 0 10px var(--glow-cyan), 0 0 15px var(--glow-cyan)' },
          '100%': { boxShadow: '0 0 10px var(--glow-cyan), 0 0 20px var(--glow-cyan), 0 0 30px var(--glow-cyan)' },
        },
        pulseFade: {
          '0%': { opacity: '0.1' },
          '50%': { opacity: '0.8' },
          '100%': { opacity: '0.1' },
        },
        shootingStar1: {
          '0%': { transform: 'translateX(-100px) translateY(0px)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(calc(100vw + 100px)) translateY(calc(-28vw))', opacity: '0' },
        },
        shootingStar2: {
          '0%': { transform: 'translateX(calc(100vw + 100px)) translateY(0px)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(-100px) translateY(140px)', opacity: '0' },
        },
        shootingStar3: {
          '0%': { transform: 'translateX(0px) translateY(-50px)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(calc(100vw + 50px)) translateY(calc(100vw))', opacity: '0' },
        },
        shootingStar4: {
          '0%': { transform: 'translateX(calc(100vw + 50px)) translateY(calc(100vh + 50px))', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(-50px) translateY(-50px)', opacity: '0' },
        },
        shootingStar5: {
          '0%': { transform: 'translateX(-80px) translateY(20px)', opacity: '0' },
          '5%': { opacity: '0.8' },
          '95%': { opacity: '0.8' },
          '100%': { transform: 'translateX(calc(100vw + 80px)) translateY(calc(-18vw))', opacity: '0' },
        },
        shootingStar6: {
          '0%': { transform: 'translateX(calc(100vw + 60px)) translateY(-20px)', opacity: '0' },
          '8%': { opacity: '0.7' },
          '92%': { opacity: '0.7' },
          '100%': { transform: 'translateX(-60px) translateY(calc(18vw))', opacity: '0' },
        },
        shootingStar7: {
          '0%': { transform: 'translateX(30%) translateY(-60px)', opacity: '0' },
          '12%': { opacity: '0.6' },
          '88%': { opacity: '0.6' },
          '100%': { transform: 'translateX(calc(100vw + 100px)) translateY(calc(70vw))', opacity: '0' },
        },
        shootingStar8: {
          '0%': { transform: 'translateX(70%) translateY(120px)', opacity: '0' },
          '7%': { opacity: '0.5' },
          '93%': { opacity: '0.5' },
          '100%': { transform: 'translateX(calc(-25vw)) translateY(calc(-25vw))', opacity: '0' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '0.3' },
          '50%': { transform: 'translateY(-10px)', opacity: '0.6' },
        },
        floatSlower: {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '0.4' },
          '50%': { transform: 'translateY(-8px)', opacity: '0.7' },
        },
        floatSlowest: {
          '0%, 100%': { transform: 'translateY(0px)', opacity: '0.3' },
          '50%': { transform: 'translateY(-12px)', opacity: '0.5' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 