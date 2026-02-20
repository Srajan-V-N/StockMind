import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neutral grays (sophisticated palette)
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Brand colors (refined blue)
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6', // Primary
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Semantic colors
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          950: '#052E16',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          950: '#450A0A',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.015em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em' }],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #60A5FA 0%, #1E40AF 100%)',
        'gradient-brand-reverse': 'linear-gradient(135deg, #1E40AF 0%, #60A5FA 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [
    function({ addComponents }: any) {
      addComponents({
        '.glass-card': {
          '@apply bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl shadow-xl': {},
        },
        '.glass-card-premium': {
          '@apply bg-white/15 dark:bg-neutral-900/40 backdrop-blur-xl border border-white/25 dark:border-white/15 rounded-2xl shadow-lg shadow-black/5': {},
        },
        '.glass-card-hover': {
          '@apply hover:bg-white/15 dark:hover:bg-black/25 hover:border-white/30 dark:hover:border-white/20 transition-all duration-300': {},
        },
        '.glass-card-hover-premium': {
          '@apply hover:bg-white/20 dark:hover:bg-neutral-900/50 hover:border-white/30 dark:hover:border-white/20 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 ease-out': {},
        },
        '.glass-button': {
          '@apply bg-white/5 hover:bg-white/10 dark:hover:bg-white/15 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-lg transition-all duration-200': {},
        },
        '.glass-button-premium': {
          '@apply bg-white/10 dark:bg-neutral-800/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl hover:bg-white/20 dark:hover:bg-neutral-800/40 active:scale-95 transition-all duration-200': {},
        },
        '.glass-navbar': {
          '@apply bg-white/80 dark:bg-neutral-900/80 backdrop-blur-2xl border-b border-white/20 dark:border-white/10 shadow-sm': {},
        },
        '.glass-input': {
          '@apply bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 focus:border-brand-400 dark:focus:border-brand-500 rounded-lg transition-all': {},
        },
        '.glass-input-premium': {
          '@apply bg-white/10 dark:bg-neutral-800/30 backdrop-blur-md border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 rounded-2xl transition-all duration-200': {},
        },
        '.glass-dropdown': {
          '@apply bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-lg shadow-2xl': {},
        },
        '.glass-dropdown-premium': {
          '@apply bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl': {},
        },
        '.gradient-text': {
          '@apply bg-gradient-to-r from-brand-600 to-brand-800 dark:from-brand-400 dark:to-brand-600 bg-clip-text text-transparent': {},
        },
        '.skeleton': {
          '@apply animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 dark:from-neutral-800/50 dark:via-neutral-700/50 dark:to-neutral-800/50 rounded-lg': {},
          'backgroundSize': '1000px 100%',
        },
        '.skeleton-text': {
          '@apply skeleton h-4 w-24': {},
        },
        '.skeleton-title': {
          '@apply skeleton h-6 w-32': {},
        },
        '.skeleton-card': {
          '@apply skeleton rounded-xl': {},
        },
      })
    }
  ],
}

export default config
