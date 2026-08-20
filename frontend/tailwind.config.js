/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#101010',
        darkSec: '#0c0c0c',
        darkCard: '#151515',
        accentLime: '#bef264',
        accentLimeHover: '#d9f99d',
        accentBlue: '#3B82F6',
        purpleGlow: '#8B5CF6',
        cyanAccent: '#06B6D4',
        whiteText: '#f7f7f4',
        mutedGray: '#a1a1aa',
        borderGlass: 'rgba(255, 255, 255, 0.08)',
        bgGlass: 'rgba(16, 16, 16, 0.8)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        glowLime: '0 0 30px 4px rgba(190, 242, 100, 0.2)',
        glowBlue: '0 0 20px 2px rgba(190, 242, 100, 0.15)',
        glowPurple: '0 0 20px 2px rgba(190, 242, 100, 0.15)',
      },
      borderRadius: {
        '24px': '24px',
        '32px': '32px',
      }
    },
  },
  plugins: [],
}
