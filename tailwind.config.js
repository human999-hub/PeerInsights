module.exports = {
    content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
    theme:{
        extend:{
            fontFamily:{
                figtree: ['Figtree', 'sans-serif']
            },
            colors:{
                primary: '#861f41',
                secondary: '#FFA25B',
            }
        }
    },
    plugins: [],
}