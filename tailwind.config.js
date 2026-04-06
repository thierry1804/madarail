/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Charte proche du site madarail.mg + rouge du logo officiel (Wikimedia)
        madarail: {
          navy: '#0a2341',
          'navy-mid': '#0f2d4a',
          'navy-bright': '#153a5c',
          red: '#e30613',
          'red-dark': '#b3050f',
          'red-soft': '#fef2f2',
          'red-muted': '#fecaca',
          rail: '#f4f8fb',
        },
      },
    },
  },
  plugins: [],
};
