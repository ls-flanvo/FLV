/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f9f7',
          100: '#ccf3ef',
          200: '#99e7df',
          300: '#66dbcf',
          400: '#33cfbf',
          500: '#4DB8AC',
          600: '#3d9389',
          700: '#2e6e67',
          800: '#1e4a44',
          900: '#0f2522',
        },
        accent: {
          50: '#f0f2ff',
          100: '#e0e5ff',
          200: '#c7d0ff',
          300: '#a3b0ff',
          400: '#7a86ff',
          500: '#5B4FFF',
          600: '#4937e6',
          700: '#3a2ab8',
          800: '#2e2294',
          900: '#271e78',
        },
        dark: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b8b9c1',
          400: '#92939f',
          500: '#747583',
          600: '#5d5e6b',
          700: '#4c4d57',
          800: '#41424a',
          900: '#1a1b1f',
          950: '#0a0a0c',
        },
      },
    },
  },
  plugins: [],
}