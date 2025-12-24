  /** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tiro Bangla', 'Hind Siliguri', 'Inter', 'sans-serif'],
        serif: ['Tiro Bangla', 'serif'],
      },
    },
  },
  plugins: [],
}
