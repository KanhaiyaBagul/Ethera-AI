/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F8F8',
        surface: '#FFFFFF',
        border: '#E8E8E8',
        primary: '#3B9BE8',
        primary_hover: '#2A89D8',
        accent: '#C8FF00',
        accent_hover: '#B5EA00',
        dark: '#0D0D0D',
        text_primary: '#0D0D0D',
        text_muted: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B9BE8',
      },
      fontFamily: {
        heading: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'card': '0 2px 20px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.12)',
      }
    },
  },
  plugins: [],
}
