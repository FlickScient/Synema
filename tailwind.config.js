/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        synema: {
          bg: '#08090d',
          surface: '#0f1015',
          card: '#16171d',
          'card-hover': '#1e1f27',
          border: '#252630',
          muted: '#6b7280',
          violet: '#7c3aed',
          'violet-dark': '#5b21b6',
          crimson: '#9b1c1c',
          'crimson-dark': '#7f1d1d',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-violet': 'pulseViolet 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        pulseViolet: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.3)'
          },
          '50%': {
            boxShadow: '0 0 30px rgba(124, 58, 237, 0.7), 0 0 60px rgba(124, 58, 237, 0.4)'
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7c3aed 0%, #9b1c1c 100%)',
        'gradient-brand-hover': 'linear-gradient(135deg, #8b5cf6 0%, #b91c1c 100%)',
        'gradient-dark': 'linear-gradient(to top, #08090d 0%, transparent 100%)',
        'gradient-dark-horizontal': 'linear-gradient(to right, #08090d 0%, transparent 100%)',
      },
    },
  },
  plugins: [],
};
