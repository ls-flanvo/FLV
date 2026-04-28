/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Teal accent — CTA, active states, highlights
        primary: {
          50:  '#e6faf8',
          100: '#b3f0ea',
          200: '#80e6db',
          300: '#4ddccc',
          400: '#1ad2bd',
          500: '#00D1B2', // brand teal
          600: '#00B89E',
          700: '#009f8a',
          800: '#008676',
          900: '#006d62',
        },
        // Dark surfaces
        surface: {
          0:   '#0B0B0B', // body background
          1:   '#141414', // cards, modals
          2:   '#1A1A1A', // elevated cards
          3:   '#222222', // inputs, hover
          4:   '#2A2A2A', // borders
          5:   '#333333', // subtle borders
        },
        // Text hierarchy
        ink: {
          primary:   '#FFFFFF',
          secondary: '#A1A1AA',
          muted:     '#71717A',
          disabled:  '#52525B',
        },
        // Keep accent for legacy (purple)
        accent: {
          500: '#00D1B2',
          600: '#00B89E',
        },
        // Semantic
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'teal':    '0 0 20px rgba(0,209,178,0.15)',
        'teal-lg': '0 0 40px rgba(0,209,178,0.20)',
        'surface': '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
        'glow':    'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'teal-gradient':    'linear-gradient(135deg, #00D1B2 0%, #00B89E 100%)',
        'dark-gradient':    'linear-gradient(135deg, #141414 0%, #1A1A1A 100%)',
        'hero-gradient':    'radial-gradient(ellipse at 50% 0%, rgba(0,209,178,0.12) 0%, transparent 70%)',
        'card-gradient':    'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)',
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease-out',
        'pulse-teal': 'pulseTeal 2s ease-in-out infinite',
        'shimmer':   'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseTeal: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,209,178,0.3)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(0,209,178,0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
