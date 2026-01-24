import type { Config } from 'tailwindcss'
import brandTokens from './theme/brand-tokens.json'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: brandTokens.colors.background,
        foreground: brandTokens.colors.foreground,
        primary: {
          DEFAULT: brandTokens.colors.primary,
          foreground: brandTokens.colors.background,
        },
        secondary: {
          DEFAULT: brandTokens.colors.secondary,
          foreground: brandTokens.colors.background,
        },
        accent: {
          DEFAULT: brandTokens.colors.accent,
          foreground: brandTokens.colors.background,
        },
        muted: {
          DEFAULT: brandTokens.colors.muted,
          foreground: brandTokens.colors.mutedForeground,
        },
        border: brandTokens.colors.border,
        input: brandTokens.colors.input,
        ring: brandTokens.colors.ring,
      },
      fontFamily: {
        sans: brandTokens.typography.fontFamily.sans,
      },
      borderRadius: {
        lg: brandTokens.borderRadius.lg,
        md: brandTokens.borderRadius.md,
        sm: brandTokens.borderRadius.sm,
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
