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
        highlight: '#00FFB2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
          '0%': { boxShadow: '0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 15px #3b82f6' },
          '100%': { boxShadow: '0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #3b82f6' },
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
          '100%': { transform: 'translateX(calc(100vw + 100px)) translateY(-80px)', opacity: '0' },
        },
        shootingStar2: {
          '0%': { transform: 'translateX(calc(100vw + 100px)) translateY(0px)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(-100px) translateY(60px)', opacity: '0' },
        },
        shootingStar3: {
          '0%': { transform: 'translateX(0px) translateY(-50px)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(calc(100vw + 50px)) translateY(calc(100vh + 50px))', opacity: '0' },
        },
        shootingStar4: {
          '0%': { transform: 'translateX(calc(100vw + 50px)) translateY(calc(100vh + 50px))', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(-50px) translateY(-50px)', opacity: '0' },
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