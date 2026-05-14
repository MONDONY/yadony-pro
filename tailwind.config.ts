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
        primary: {
          DEFAULT: '#0B5FFF',
          hover: '#0A4DD9',
          press: '#083CAB',
          50: '#EDF2FF',
          500: '#0B5FFF',
          600: '#0A4DD9',
          700: '#083CAB',
        },
        accent: {
          DEFAULT: '#D96A3A',
          500: '#D96A3A',
          600: '#B95524',
        },
        bg: '#0A1024',
        surface: '#111A33',
        'surface-elevated': '#162041',
        border: '#1E2A4A',
        text: {
          DEFAULT: '#F2F1ED',
          muted: '#A8A294',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
      },
      fontFamily: {
        display: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        btn: '14px',
        sheet: '24px',
      },
      spacing: {
        sidebar: '220px',
        topbar: '64px',
      },
    },
  },
  plugins: [],
} satisfies Config;
