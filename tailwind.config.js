module.exports = {
  content: ["./renderer/index.html", "./renderer/js/renderer.js"],
  theme: {
    extend: {
      fontFamily: {
        primary: ['"Josefin Sans"', 'ui-sans-serif', 'system-ui'],
        secondary: ['Roboto', 'ui-sans', 'system-ui'],
      },
      colors: {
        primary: '#5a5a5a', // light gray
        secondary: '#323232', // darker gray
        tertiary: '#f5f5f5', // off-white
        accent: '#00bdca', // blue
        hoverColor: '#787878', // gray between primary & secondary
      },
    },
  },
  plugins: [],
}
