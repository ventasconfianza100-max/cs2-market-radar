import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0e14",
        surface: "#121722",
        card: "#161c2a",
        border: "#232b3d",
        accent: "#4f8cff",
        accent2: "#22d3a5",
        warn: "#f5b544",
        danger: "#f2555a",
        muted: "#8b94a8"
      }
    }
  },
  plugins: []
};

export default config;
