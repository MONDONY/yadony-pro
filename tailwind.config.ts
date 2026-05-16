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
        bg:           'var(--bg)',
        surface:      'var(--surface)',
        'surface-el': 'var(--surface-el)',
        'surface-elevated': 'var(--surface-el)',
        border:       'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover:   'var(--primary-h)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-h)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted:   'var(--muted)',
          subtle:  'var(--subtle)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
      },
      fontFamily: {
        display: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:  '16px',
        btn:   '14px',
        sheet: '24px',
        sm:    '8px',
        full:  '999px',
      },
      spacing: {
        sidebar: '220px',
        topbar:  '64px',
      },
    },
  },
  plugins: [],
} satisfies Config;
