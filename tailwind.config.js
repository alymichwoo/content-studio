/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: '#1C1C1E',
        coral: '#FF5733',
        cream: '#FAF9F6',
        slate: '#8E8E93',
        pillar: {
          train: '#378ADD',
          live: '#D4537E',
          think: '#7F77DD',
          feel: '#1D9E75',
          fuel: '#EF9F27',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
