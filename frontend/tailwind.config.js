/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // KA BOOM corporate palette — use as `bg-kaboom-red`, `text-kaboom-black`, etc.
        kaboom: {
          red: 'hsl(var(--kaboom-red))',
          'red-dark': 'hsl(var(--kaboom-red-dark))',
          'red-soft': 'hsl(var(--kaboom-red-soft))',
          black: 'hsl(var(--kaboom-black))',
          white: 'hsl(var(--kaboom-white))',
          gray: 'hsl(var(--kaboom-gray))',
          'light-gray': 'hsl(var(--kaboom-light-gray))',
          cream: 'hsl(var(--kaboom-cream))',
        },
        // shadcn semantic aliases so utilities like `bg-primary`, `text-primary-foreground` work
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Inter', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'kaboom-gradient': 'linear-gradient(135deg, hsl(var(--kaboom-red)) 0%, hsl(var(--kaboom-red-dark)) 100%)',
      },
    },
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
        '.glass-card': {
          '@apply backdrop-blur-md bg-white/60 dark:bg-neutral-900/40 border border-white/20 dark:border-neutral-800/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl': {},
        },
      })
    },
  ],
}

