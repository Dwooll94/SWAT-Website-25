/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'swat-black': '#000000',
        'swat-white': '#FFFFFF',
        'swat-green': '#005728',
        'swat-green-light': '#007830',
        'swat-green-dark': '#003d1c',
        'warrior-gold' : '#FFEB3B'
      },
      fontFamily: {
        'impact': ['Impact', 'Franklin Gothic Bold', 'Charcoal', 'Helvetica Inserat', 'Bitstream Vera Sans Bold', 'Arial Black', 'sans-serif']
      },
      backgroundImage: {
        'swat-gradient': 'linear-gradient(135deg, #000000 0%, #005728 100%)',
        'warrior-gradient': 'linear-gradient(90deg, #005728 0%, #FFEB3B 100%)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}