/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Theme-aware colors using CSS variables
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
        // Legacy colors for backward compatibility
        'text-muted': 'var(--text-tertiary)',
        highlight: 'var(--accent-teal)',
      },
      fontFamily: {
        sans: ['Comfortaa', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
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