import type { Config } from 'tailwindcss';

const config: Config = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  darkMode: ['selector', '[data-theme="dark"]'],
};

export default config;
