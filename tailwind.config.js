import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // เพิ่มบรรทัดนี้
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // เพิ่มบรรทัดนี้
  ],
  theme: {
    // Override default colors
    colors: {
      // Keep essential Tailwind colors
      transparent: "transparent",
      current: "currentColor",
      black: "#000000",
      white: "#ffffff",

      // WarrantyHub Brand Colors - Red, White, Dark Gray Theme
      primary: {
        50: "#fef2f2",
        100: "#fee2e2",
        200: "#fecaca",
        300: "#fca5a5",
        400: "#f87171",
        500: "#ef4444", // Main Red
        600: "#dc2626",
        700: "#b91c1c",
        800: "#991b1b",
        900: "#7f1d1d",
        950: "#450a0a",
      },
      secondary: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563", // Medium Gray
        700: "#374151",
        800: "#1f2937", // Dark Gray
        900: "#111827",
        950: "#030712", // Very Dark Gray
      },
      accent: {
        50: "#ffffff", // Pure White
        100: "#fafafa",
        200: "#f5f5f5",
        300: "#f0f0f0",
        400: "#d4d4d4",
        500: "#a3a3a3",
        600: "#737373",
        700: "#525252",
        800: "#404040",
        900: "#262626",
      },
      success: {
        50: "#f0fdf4",
        100: "#dcfce7",
        200: "#bbf7d0",
        300: "#86efac",
        400: "#4ade80",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
        800: "#166534",
        900: "#14532d",
      },
      warning: {
        50: "#fffbeb",
        100: "#fef3c7",
        200: "#fde68a",
        300: "#fcd34d",
        400: "#fbbf24",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
        800: "#92400e",
        900: "#78350f",
      },
      danger: {
        50: "#fef2f2",
        100: "#fee2e2",
        200: "#fecaca",
        300: "#fca5a5",
        400: "#f87171",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
        800: "#991b1b",
        900: "#7f1d1d",
      },
    },
    extend: {
      fontSize: {
        // Override default Tailwind font sizes to be larger
        xs: ["0.875rem", { lineHeight: "1.5" }], // 14px
        sm: ["1rem", { lineHeight: "1.6" }], // 16px (เดิมเป็น 14px)
        base: ["1.125rem", { lineHeight: "1.6" }], // 18px (เดิมเป็น 16px)
        lg: ["1.25rem", { lineHeight: "1.6" }], // 20px (เดิมเป็น 18px)
        xl: ["1.375rem", { lineHeight: "1.5" }], // 22px (เดิมเป็น 20px)
        "2xl": ["1.5rem", { lineHeight: "1.4" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "1.3" }], // 30px
        "4xl": ["2.25rem", { lineHeight: "1.2" }], // 36px
        "5xl": ["3rem", { lineHeight: "1.1" }], // 48px
        "6xl": ["3.75rem", { lineHeight: "1" }], // 60px
        "7xl": ["4.5rem", { lineHeight: "1" }], // 72px
        "8xl": ["6rem", { lineHeight: "1" }], // 96px
        "9xl": ["8rem", { lineHeight: "1" }], // 128px
      },
      colors: {
        // ถ้าต้องการเพิ่มสีอื่นๆ ใส่ที่นี่
      },
      colors: {
        // WarrantyHub Brand Colors - Red, White, Dark Gray Theme
        primary: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444", // Main Red
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        secondary: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563", // Medium Gray
          700: "#374151",
          800: "#1f2937", // Dark Gray
          900: "#111827",
          950: "#030712", // Very Dark Gray
        },
        accent: {
          50: "#ffffff", // Pure White
          100: "#fafafa",
          200: "#f5f5f5",
          300: "#f0f0f0",
          400: "#d4d4d4",
          500: "#a3a3a3",
          600: "#737373",
          700: "#525252",
          800: "#404040",
          900: "#262626",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans Thai", "Inter", "sans-serif"],
        thai: ["IBM Plex Sans Thai", "Sarabun", "sans-serif"],
        display: ["IBM Plex Sans Thai", "Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px 0 rgba(0, 0, 0, 0.1)",
        "soft-lg": "0 10px 40px 0 rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};

export default config;
