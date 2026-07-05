import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/features/**/*.vue',
    './app/app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        bg:           'rgb(var(--bg-rgb) / <alpha-value>)',
        surface:      'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-el': 'rgb(var(--surface-el-rgb) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-el-rgb) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--border-rgb) / <alpha-value>)',
          strong:  'rgb(var(--border-strong-rgb) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary-rgb) / <alpha-value>)',
          hover:   'var(--primary-h)',
        },
        // Alias legacy : l'ancien accent terracotta pointe désormais vers le
        // seul accent de marque (bleu). Évite de casser les écrans pas encore
        // refondus ; sera retiré une fois toutes les références migrées.
        accent: {
          DEFAULT: 'rgb(var(--primary-rgb) / <alpha-value>)',
          hover:   'var(--primary-h)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted:   'var(--muted)',
          subtle:  'var(--subtle)',
        },
        success: 'rgb(var(--success-rgb) / <alpha-value>)',
        warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
        danger:  'rgb(var(--danger-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Geist', 'system-ui', 'sans-serif'],
        sans:    ['Geist', 'system-ui', 'sans-serif'],
        mono:    ['"Geist Mono"', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card:  '16px',
        el:    '12px',
        btn:   '12px',
        input: '10px',
        sheet: '24px',
        xs:    '8px',
        full:  '999px',
      },
      boxShadow: {
        card: 'var(--elev-card)',
        pop:  'var(--elev-pop)',
        btn:  'var(--elev-btn)',
      },
      spacing: {
        sidebar: '220px',
        topbar:  '64px',
      },
      keyframes: {
        'fade-rise': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-rise': 'fade-rise 0.15s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
