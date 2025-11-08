/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {}
  },
  plugins: [
    plugin(function({ addVariant }) {
      addVariant('group-open', ':merge(.group):where([open]) &');
      addVariant('open', '&:where([open])');
    })
  ],
};
