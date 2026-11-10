/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDECEC',
          100: '#FAD4D4',
          200: '#F5A9A9',
          300: '#EE7C7C',
          400: '#E65252',
          500: '#E23A3A',
          600: '#D32F2F',
          700: '#B71C1C',
          800: '#9A1818',
          900: '#7F1616',
        },
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'sheet-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translate(-50%, 12px)' },
          to: { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        ticker: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'sheet-up': 'sheet-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'toast-in': 'toast-in 0.25s ease-out',
        ticker: 'ticker 28s linear infinite',
        'ping-slow': 'ping-slow 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
