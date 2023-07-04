/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    "node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      roboto: ["Roboto", "serif"],
    },
    fontWeight: {
      thin: "100",
      hairline: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      semibold: "500",
      extrabold: "600",
      bold: "700",
    },
    extend: {
      colors: {
        grey: "#3d4048",
        primary: "#1347FF",
        muted: "#707583",
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
  plugins: [require("@tailwindcss/line-clamp"), require("flowbite/plugin")],

  fontFamily: {
    sans: ["Roboto", "Graphik", "sans-serif"],
    serif: ["Merriweather", "serif"],
  },
};
