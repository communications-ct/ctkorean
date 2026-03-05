/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EBF0FA',
          100: '#D7E1F5',
          200: '#AFCCEA',
          300: '#87A8D8',
          400: '#5F84C6',
          500: '#3A66B0',
          600: '#2E528D',
          700: '#233E6A',
          800: '#172A47',
          900: '#0C1624',
        },
        liturgical: {
          advent:    '#5B2C6F',
          christmas: '#FDFEFE',
          lent:      '#7D3C98',
          easter:    '#F4D03F',
          ordinary:  '#27AE60',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
