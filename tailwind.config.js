/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1f4fa3",
        primaryDark: "#173e82",
        primaryLight: "#2d6cdf",
        background: "#f4f6f9",
        textPrimary: "#2c3e50",
        textSecondary: "#6b7280",
        textMuted: "#9ca3af",
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6"
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'lg': '8px',
        'md': '6px',
      },
      boxShadow: {
        'sm': '0 1px 3px rgba(0,0,0,0.1)',
        'md': '0 4px 12px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
