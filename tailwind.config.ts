import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        app: "#0A0B10",
        elevated: "#11131A",
        card: "#141722",
        hover: "#1A1E2A",
        border: "#232838",
        borderStrong: "#31374B",
        text: "#F5F7FB",
        textSecondary: "#B6BED0",
        textMuted: "#8891A7",
        accent: "#7C5CFF",
        accentHover: "#8B70FF",
        accentPressed: "#6949F0",
        accentSoft: "rgba(124,92,255,0.12)",
        success: "#23C16B",
        warning: "#F5A524",
        danger: "#F04461",
        info: "#38BDF8"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      },
      boxShadow: {
        panel: "0 10px 30px rgba(0, 0, 0, 0.22)",
        lift: "0 14px 34px rgba(0, 0, 0, 0.28)"
      },
      borderRadius: {
        xl2: "20px"
      }
    }
  },
  plugins: []
} satisfies Config;
