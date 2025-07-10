import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        'border-hover': 'hsl(var(--border-hover))',
        'border-strong': 'hsl(var(--border-strong))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          muted: 'hsl(var(--surface-muted))',
          hover: 'hsl(var(--surface-hover))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Add the missing color tokens for Reddit-style UI
        tertiary: 'hsl(var(--text-tertiary))',
        'comment-thread': 'hsl(var(--comment-thread))',
        'action-hover': 'hsl(var(--action-hover))',
        // Add proper text color hierarchy mappings
        text: {
          primary: 'hsl(var(--text-primary))',
          secondary: 'hsl(var(--text-secondary))',
          tertiary: 'hsl(var(--text-tertiary))',
        },
        // Reddit Design Tokens
        reddit: {
          'sidebar-bg': 'hsl(var(--reddit-sidebar-background))',
          'main-bg': 'hsl(var(--reddit-background-main))',
          divider: 'hsl(var(--reddit-divider))',
          'text-primary': 'hsl(var(--reddit-text-primary))',
          'text-secondary': 'hsl(var(--reddit-text-secondary))',
          'text-meta': 'hsl(var(--reddit-text-meta))',
          'hover-bg': 'hsl(var(--reddit-hover-background))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2': 'var(--radius-2)', // Reddit's rounded-2
      },
      spacing: {
        rem6: 'var(--rem6)',
        rem10: 'var(--rem10)',
        rem12: 'var(--rem12)',
        xs: '0.25rem', // Reddit's xs spacing
        '2xs': '0.125rem', // Reddit's 2xs spacing
        md: '0.5rem', // Reddit's md spacing
        lg: '1rem', // Reddit's lg spacing
        xl: '1.25rem', // Reddit's xl spacing
      },
      fontSize: {
        '12': ['0.75rem', { lineHeight: '1rem' }], // Reddit's text-12
        '14': ['0.875rem', { lineHeight: '1.25rem' }], // Reddit's text-14
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    function ({ addComponents }) {
      addComponents({
        // Reddit Button Components
        '.button': {
          '@apply inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2':
            {},
        },
        '.button-small': {
          '@apply px-[var(--rem10)] py-[var(--rem6)] text-sm rounded-full': {},
        },
        '.button-primary': {
          '@apply bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary': {},
        },
        '.button-secondary': {
          '@apply bg-reddit-sidebar-bg text-reddit-text-secondary hover:bg-reddit-hover-bg border border-reddit-divider':
            {},
        },
        // Reddit Typography
        '.text-12': {
          '@apply text-[0.75rem] leading-4': {},
        },
        '.text-14': {
          '@apply text-[0.875rem] leading-5': {},
        },
        // Reddit Layout
        '.rounded-2': {
          '@apply rounded-[var(--radius-2)]': {},
        },
        '.py-md': {
          '@apply py-[0.5rem]': {},
        },
        '.px-md': {
          '@apply px-[0.5rem]': {},
        },
        '.my-md': {
          '@apply my-[0.5rem]': {},
        },
        '.mx-md': {
          '@apply mx-[0.5rem]': {},
        },
        '.gap-xs': {
          '@apply gap-[0.25rem]': {},
        },
        '.gap-2xs': {
          '@apply gap-[0.125rem]': {},
        },
      });
    },
  ],
};

export default config;
