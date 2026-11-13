import type { Config } from "tailwindcss";

const withAlpha = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        background: withAlpha("background"),
        foreground: withAlpha("foreground"),
        card: withAlpha("card"),
        "card-foreground": withAlpha("foreground"),
        muted: withAlpha("muted"),
        "muted-foreground": withAlpha("muted-foreground"),
        border: withAlpha("border"),
        ring: withAlpha("ring"),
        primary: {
          DEFAULT: withAlpha("primary"),
          foreground: withAlpha("primary-foreground"),
        },
        accent: {
          DEFAULT: withAlpha("accent"),
          foreground: withAlpha("accent-foreground"),
        },
        gold: {
          DEFAULT: withAlpha("gold"),
          foreground: withAlpha("gold-foreground"),
        },
        destructive: withAlpha("accent"),
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(15 23 42 / 0.04), 0 8px 24px -8px rgb(15 23 42 / 0.10)",
        lift: "0 2px 4px rgb(15 23 42 / 0.05), 0 16px 32px -12px rgb(15 23 42 / 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;