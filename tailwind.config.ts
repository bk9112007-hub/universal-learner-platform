import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9ebff",
          200: "#bcdcff",
          300: "#8dc4ff",
          400: "#58a3ff",
          500: "#2d7ef7",
          600: "#175ed8",
          700: "#164cb0",
          800: "#183f8d",
          900: "#193670"
        },
        ink: "#081226",
        mist: "#f4f8fc",
        line: "#d9e3f0",
        success: "#14866d",
        warning: "#d97706",
        danger: "#dc2626"
      },
      boxShadow: {
        soft: "0 18px 48px rgba(8, 18, 38, 0.08)",
        panel: "0 24px 60px rgba(12, 34, 68, 0.12)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(255,255,255,0.24), transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.12), transparent 45%)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
