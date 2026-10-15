/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#07090E',
        panel: '#10141D',
        pitch: '#00FF87',
        ballon: '#FFD700',
        neon: '#00E5FF',
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 34px rgba(0,255,135,.16)',
      },
    },
  },
  plugins: [],
};
