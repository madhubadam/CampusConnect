/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cc: {
          bg: '#E3FDFD',         // Primary background
          surface: '#CBF1F5',    // Secondary background
          hover: '#A6E3E9',      // Highlight & hover color
          teal: '#71C9CE',       // Primary teal accent
          dark: '#0C6B75',       // Deep teal brand accent
          navy: '#102A43',       // Primary text
          slate: '#334E68',      // Secondary text
          muted: '#627D98',      // Muted caption text
          card: '#FFFFFF',       // Card surfaces
          border: '#CBF1F5'      // Border lines
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(113, 201, 206, 0.15)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'elevated': '0 10px 25px -3px rgba(16, 42, 67, 0.08), 0 4px 6px -2px rgba(16, 42, 67, 0.04)'
      }
    },
  },
  plugins: [],
}
