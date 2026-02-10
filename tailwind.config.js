/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#050816',
        'bg-secondary': '#0A1428',
        'bg-card': '#0D1B2A',
        'bg-card-hover': '#112240',
        'accent-blue': '#00C8FF',
        'accent-cyan': '#1BA9FF',
        'accent-gold': '#C8AA6E',
        'accent-gold-light': '#F0E6D2',
        'win': '#28A0F0',
        'lose': '#E84057',
        'text-primary': '#F0F0F0',
        'text-secondary': '#8B8B8B',
        'text-muted': '#5B5B5B',
        'border-color': '#1E3A5F',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 200, 255, 0.3)',
        'glow-gold': '0 0 20px rgba(200, 170, 110, 0.3)',
      },
    },
  },
  plugins: [],
}
