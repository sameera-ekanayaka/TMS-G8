/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#181d26",
          active: "#0d1218",
        },
        ink: "#181d26",
        body: "#333840",
        muted: "#41454d",
        hairline: "#dddddd",
        borderstrong: "#9297a0",
        canvas: "#ffffff",
        surface: {
          soft: "#f8fafc",
          strong: "#e0e2e6",
          dark: "#181d26",
          "dark-elevated": "#1d1f25",
        },
        signature: {
          coral: "#aa2d00",
          forest: "#0a2e0e",
          cream: "#f5e9d4",
          peach: "#fcab79",
          mint: "#a8d8c4",
          yellow: "#f4d35e",
          mustard: "#d9a441",
        },
        on: {
          primary: "#ffffff",
          dark: "#ffffff",
        },
        link: {
          DEFAULT: "#1b61c9",
          active: "#1a3866",
        },
        info: {
          DEFAULT: "#254fad",
          border: "#458fff",
        },
        success: {
          DEFAULT: "#006400",
          border: "#39bf45",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        pill: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(24, 29, 38, 0.05)",
        md: "0 4px 6px rgba(24, 29, 38, 0.1)",
        lg: "0 12px 24px rgba(24, 29, 38, 0.15)",
      },
    },
  },
  plugins: [],
};
