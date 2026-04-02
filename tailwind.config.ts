import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#667eea', // Start of primary gradient
          dark: '#764ba2',   // End of primary gradient
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        dark: '#1e293b',
        'gray-text': '#64748b',
        'gray-light': '#f8fafc',
        'gray-border': '#e2e8f0',
        'gray-bg': '#fafbfc',
        'gray-medium': '#cbd5e1',
        'gray-darker': '#9ca3af',
        'light-green': '#dcfce7',
        'dark-green': '#166534',
        'light-yellow': '#fef3c7',
        'dark-yellow': '#92400e',
        'light-red': '#fee2e2',
        'dark-red': '#991b1b',
        'primary-gradient-light': 'rgba(102, 126, 234, 0.1)',
        'primary-gradient-dark': 'rgba(118, 75, 162, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'h1': '32px',
        'h2': '24px',
        'h3': '18px',
        'body': '14px',
        'small': '12px',
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      boxShadow: {
        'custom-sm': '0 2px 4px rgba(0,0,0,0.1)',
        'custom-md': '0 4px 6px -1px rgba(0,0,0,0.1)',
        'custom-lg': '0 4px 12px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
export default config
