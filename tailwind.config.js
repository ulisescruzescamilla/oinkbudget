/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx,mdx}',
    './components/**/*.{js,jsx,ts,tsx,mdx}',
    './screens/**/*.{js,jsx,ts,tsx,mdx}',
    './navigation/**/*.{js,jsx,ts,tsx,mdx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Aurora semantic tokens — backed by CSS vars in global.css (light/dark).
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          press: 'rgb(var(--color-primary-press) / <alpha-value>)',
          soft: 'rgb(var(--color-primary-soft) / <alpha-value>)',
          line: 'rgb(var(--color-primary-line) / <alpha-value>)',
        },
        'on-primary': 'rgb(var(--color-on-primary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        income: {
          DEFAULT: 'rgb(var(--color-income) / <alpha-value>)',
          soft: 'rgb(var(--color-income-soft) / <alpha-value>)',
        },
        expense: {
          DEFAULT: 'rgb(var(--color-expense) / <alpha-value>)',
          soft: 'rgb(var(--color-expense-soft) / <alpha-value>)',
        },
        page: 'rgb(var(--color-page) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
          2: 'rgb(var(--color-card-2) / <alpha-value>)',
        },
        text: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        faint: 'rgb(var(--color-faint) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          2: 'rgb(var(--color-border-2) / <alpha-value>)',
        },
      },
      borderRadius: {
        card: '24px',
        inner: '16px',
        chip: '12px',
        pill: '999px',
      },
      // Unique family names (avoid Tailwind's font-weight utility names like
      // `bold`/`semibold`, which only set fontWeight and can't switch the RN
      // font family when each weight is a separate font file).
      fontFamily: {
        sans: ['PlusJakartaSans_500Medium'],
        body: ['PlusJakartaSans_500Medium'],
        semi: ['PlusJakartaSans_600SemiBold'],
        strong: ['PlusJakartaSans_700Bold'],
        display: ['PlusJakartaSans_800ExtraBold'],
      },
      fontSize: {
        '2xs': '10px',
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(80, 50, 130, 0.16)',
        soft: '0 6px 18px -10px rgba(80, 50, 130, 0.14)',
        btn: '0 6px 16px -6px rgba(123, 75, 224, 0.5)',
        pop: '0 12px 40px -8px rgba(40, 20, 70, 0.3)',
      },
    },
  },
  plugins: [],
};
