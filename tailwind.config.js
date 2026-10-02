/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#EEF1F8',
          100: '#D6DCEC',
          200: '#AEB9D9',
          300: '#8695C2',
          400: '#5A6BA0',
          500: '#3B4A7A',
          600: '#28345C',
          700: '#1B2444',
          800: '#131A33',
          900: '#0D1226',
          950: '#080B1A',
        },
        brand: {
          50: '#EEF2FF',
          100: '#DCE4FF',
          200: '#B9C9FF',
          300: '#8FA6FF',
          400: '#6182FA',
          500: '#3E63DD',
          600: '#2E4BBD',
          700: '#243B96',
          800: '#1D2F78',
          900: '#182660',
        },
        income: {
          50: '#E9F9F1',
          100: '#CBF0DC',
          400: '#2FBE7F',
          500: '#0F9D6D',
          600: '#0B7E58',
        },
        expense: {
          50: '#FDECEC',
          100: '#FBD3D2',
          400: '#EF6560',
          500: '#E5484D',
          600: '#C93B3F',
        },
        warn: {
          50: '#FFF4E5',
          100: '#FEE3BE',
          400: '#F3A24B',
          500: '#EA8C2E',
          600: '#C97220',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(13, 18, 38, 0.04), 0 4px 16px -4px rgba(13, 18, 38, 0.08)',
        cardHover: '0 2px 4px rgba(13, 18, 38, 0.06), 0 8px 24px -6px rgba(13, 18, 38, 0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        'slide-in-right': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        'scale-in': { '0%': { opacity: 0, transform: 'scale(0.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}
