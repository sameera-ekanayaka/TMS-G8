/** @type {import('tailwindcss').Config} */
// Colors reference the channel tokens (--c-*) defined in src/styles/design-tokens.css,
// so every utility class (bg-canvas, text-ink, bg-primary/20, …) flips with the
// .dark theme automatically. The `/ <alpha-value>` form keeps opacity modifiers working.
const tw = (channel) => `rgb(var(${channel}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: tw("--c-primary"),
          active: tw("--c-primary-active"),
        },
        ink: tw("--c-ink"),
        body: tw("--c-body"),
        muted: tw("--c-muted"),
        hairline: tw("--c-hairline"),
        borderstrong: tw("--c-hairline-strong"),
        canvas: tw("--c-canvas"),
        surface: {
          soft: tw("--c-surface-soft"),
          strong: tw("--c-surface-strong"),
          dark: tw("--c-surface-dark"),
          "dark-elevated": tw("--c-surface-dark-elevated"),
        },
        signature: {
          coral: tw("--c-sig-coral"),
          forest: tw("--c-sig-forest"),
          cream: tw("--c-sig-cream"),
          peach: "#fcab79",
          mint: "#a8d8c4",
          yellow: "#f4d35e",
          mustard: "#d9a441",
        },
        on: {
          primary: tw("--c-on-primary"),
          dark: tw("--c-on-dark"),
        },
        link: {
          DEFAULT: tw("--c-link"),
          active: tw("--c-link-active"),
        },
        info: {
          DEFAULT: tw("--c-info"),
          border: "#458fff",
        },
        success: {
          DEFAULT: tw("--c-success"),
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
