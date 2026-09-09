import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mosque: {
          dark: "#4a4a2e",
          DEFAULT: "#6b6b3f",
          light: "#8a8a5c",
          cream: "#f7f6f0",
          gold: "#c9a94f",
        },
      },
      fontFamily: {
        arabic: ["Tajawal", "Cairo", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
