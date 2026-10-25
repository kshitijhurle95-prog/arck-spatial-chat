/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nebula: {
          purple: '#6E44FF',
          'purple-light': '#8C65FF',
          'purple-soft': '#ECE6FA',
          'purple-dark': '#5528E6',
          bg: '#090C16',
          surface: '#111626',
          card: '#182035',
          elevated: '#202B47',
          border: 'rgba(255, 255, 255, 0.1)',
          cyan: '#69E6FF',
          violet: '#A78BFA',
          text: '#F8FAFC',
          muted: '#94A3B8',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-purple': '0 0 24px -2px rgba(110, 68, 255, 0.35)',
        'glow-cyan': '0 0 20px -3px rgba(105, 230, 255, 0.25)',
        'glass-card': '0 16px 40px -10px rgba(0, 0, 0, 0.07)',
        'glass-card-dark': '0 24px 50px -12px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
