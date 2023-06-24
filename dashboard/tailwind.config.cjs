/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        error: {
          "border-color": "#DC3545",
          background: "#F9D7DA",
          color: "#842029",
        },
        "link-color": "#0D6EFD",
        "body-background": "#F4F7FA",
        "upgrade-color": "#FC1683",
      },
    },
  },
  plugins: [],
  fontFamily: {
    sans: ["Graphik", "sans-serif"],
    serif: ["Merriweather", "serif"],
    roboto: ['Roboto', 'sans-serif'],
  },
};
