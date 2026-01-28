/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bid-placed': 'bidPlaced 0.6s ease-out',
        'outbid-shake': 'outbidShake 0.5s ease-in-out',
      },
      keyframes: {
        bidPlaced: {
          '0%': { transform: 'scale(1)', color: '#111827' },
          '30%': { transform: 'scale(1.15)', color: '#16a34a', textShadow: '0 0 8px rgba(34, 197, 94, 0.6)' },
          '60%': { transform: 'scale(1.05)', color: '#16a34a' },
          '100%': { transform: 'scale(1)', color: '#111827', textShadow: 'none' },
        },
        outbidShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
  },
  plugins: [],
}