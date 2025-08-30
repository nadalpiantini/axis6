import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    // Enhanced mobile-first screens with better breakpoint control
    screens: {
      'xs': '375px',      // Small mobile devices
      'sm': '640px',      // Large mobile / small tablet
      'md': '768px',      // Tablet
      'lg': '1024px',     // Desktop
      'xl': '1280px',     // Large desktop
      '2xl': '1400px',    // Extra large desktop
      // Touch-first breakpoints
      'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
      'mouse': { 'raw': '(hover: hover) and (pointer: fine)' },
      // Landscape orientation
      'landscape': { 'raw': '(orientation: landscape)' },
      // Safe area aware breakpoints
      'safe-mobile': { 'raw': '(max-width: 640px) and (display-mode: standalone)' },
    },
    container: {
      center: true,
      // Mobile-first padding system
      padding: {
        DEFAULT: '1rem',
        'xs': '0.75rem',
        'sm': '1.5rem',
        'md': '2rem',
        'lg': '2rem',
        'xl': '2rem',
        '2xl': '2rem',
      },
      screens: {
        "2xl": "1400px",
      },
    },
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
        // AXIS6 custom colors for the 6 axes
        axis: {
          spiritual: "#9B8AE6",
          mental: "#6AA6FF",
          material: "#FFB366",
          social: "#FF8B7D",
          physical: "#65D39A",
          artistic: "#F97B8B"
        }
      },
      // Safe area spacing utilities
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        // Touch target sizes (44px minimum for accessibility)
        'touch': '44px',
        'touch-sm': '40px',
        'touch-lg': '48px',
        'touch-xl': '56px',
        // Mobile-specific spacing
        'mobile-xs': '0.375rem',
        'mobile-sm': '0.75rem',
        'mobile-base': '1rem',
        'mobile-lg': '1.5rem',
        'mobile-xl': '2rem',
      },
      // Mobile-optimized font sizes with proper line heights
      fontSize: {
        'mobile-xs': ['0.75rem', { lineHeight: '1rem' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'mobile-base': ['1rem', { lineHeight: '1.5rem' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'mobile-xl': ['1.25rem', { lineHeight: '1.75rem' }],
        'mobile-2xl': ['1.5rem', { lineHeight: '2rem' }],
        'mobile-3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        'mobile-4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      // Mobile-specific widths and heights
      width: {
        'mobile-full': '100vw',
        'mobile-safe': 'calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))',
        'modal-mobile': 'calc(100vw - 1rem)',
        'modal-sm': 'calc(100vw - 2rem)',
        'modal-safe': 'calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 2rem)',
      },
      height: {
        'mobile-full': '100vh',
        'mobile-safe': 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
        'modal-mobile': 'calc(100vh - 2rem)',
        'modal-safe': 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem)',
      },
      // Mobile-optimized max widths
      maxWidth: {
        'mobile-xs': '20rem',
        'mobile-sm': '24rem',
        'mobile-md': '28rem',
        'mobile-lg': '32rem',
        'modal-mobile': '95vw',
        'modal-tablet': '90vw',
      },
      // Mobile-optimized max heights
      maxHeight: {
        'mobile-screen': '100vh',
        'mobile-safe': 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
        'modal-mobile': '95vh',
        'modal-safe': 'calc(95vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        // Mobile-optimized animations
        "mobile-fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "mobile-slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "mobile-slide-down": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "mobile-scale-in": {
          from: {
            opacity: "0",
            transform: "scale(0.95)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        "mobile-scale-out": {
          from: {
            opacity: "1",
            transform: "scale(1)",
          },
          to: {
            opacity: "0",
            transform: "scale(0.95)",
          },
        },
        "touch-feedback": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "modal-appear": {
          from: {
            opacity: "0",
            transform: "scale(0.95) translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "scale(1) translateY(0)",
          },
        },
        "backdrop-appear": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        // Performance-optimized animations with hardware acceleration
        "gpu-slide-in": {
          from: {
            opacity: "0",
            transform: "translate3d(0, 20px, 0)",
          },
          to: {
            opacity: "1",
            transform: "translate3d(0, 0, 0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-out": "fade-out 0.5s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        // Mobile-optimized animations (shorter durations for better perceived performance)
        "mobile-fade-in": "mobile-fade-in 0.3s ease-out",
        "mobile-slide-up": "mobile-slide-up 0.3s ease-out",
        "mobile-slide-down": "mobile-slide-down 0.3s ease-out",
        "mobile-scale-in": "mobile-scale-in 0.2s ease-out",
        "mobile-scale-out": "mobile-scale-out 0.2s ease-in",
        "touch-feedback": "touch-feedback 0.1s ease-out",
        "modal-appear": "modal-appear 0.3s ease-out",
        "backdrop-appear": "backdrop-appear 0.2s ease-out",
        "gpu-slide-in": "gpu-slide-in 0.25s ease-out",
      },
      // Mobile-specific transitions
      transitionDuration: {
        '50': '50ms',
        '100': '100ms',
        '250': '250ms',
      },
      // Mobile-optimized backdrop blur
      backdropBlur: {
        'xs': '2px',
        'mobile': '8px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
