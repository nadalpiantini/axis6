import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // AXIS6 Brand Colors - Light Theme
        marfil: '#F2E9DC',
        arena: '#E0D2BD',
        bgPrimary: '#FAF8F5',
        bgSecondary: '#F5F2ED',
        
        // AXIS6 Category Colors
        physical: '#A6C26F',    // Verde Lima
        mental: '#365D63',      // Azul Petróleo
        emotional: '#D36C50',   // Coral Profundo
        social: '#6F3D56',      // Ciruela
        spiritual: '#2C3E50',   // Azul Medianoche
        material: '#C85729',    // Naranja Tierra (was Propósito)
        
        // Text Colors
        textPrimary: '#2C3E50',
        textSecondary: '#5A6C7D',
        textMuted: '#8B9CAD',
        
        // Semantic colors
        success: '#A6C26F',
        warning: '#C85729',
        error: '#D36C50',
        info: '#365D63',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
        satoshi: ['Satoshi', 'sans-serif'],
      },
      animation: {
        'celebrate': 'celebrate 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'confetti': 'confetti 1.5s cubic-bezier(0, 0, 0.2, 1) forwards',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        celebrate: {
          '0%': { transform: 'scale(1) rotate(0)' },
          '50%': { transform: 'scale(1.2) rotate(5deg)' },
          '100%': { transform: 'scale(1) rotate(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        confetti: {
          '0%': { 
            transform: 'translateY(0) rotate(0)',
            opacity: '1',
          },
          '100%': { 
            transform: 'translateY(100vh) rotate(720deg)',
            opacity: '0',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}

export default config