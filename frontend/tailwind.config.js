/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],  // Make sure to include all relevant extensions
  theme: {
    extend: {
      fontFamily: {
        ubuntu: ["Ubuntu", "sans-serif"],  // Add your custom font here
      },
    },
  },
  plugins: [],
};
