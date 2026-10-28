/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mars: {
          darkest: '#0a0504',
          deep: '#180c08',
          ground: '#26120b',
          rust: '#8c3b23',
          crimson: '#c25e36',
          sand: '#e07a5f',
          ice: '#38bdf8',
          solar: '#facc15',
          bio: '#4ade80',
        },
      },
      fontFamily: {
        orbitron: ['"Orbitron"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        cairo: ['"Cairo"', 'sans-serif'],
        kenney: ['"Kenney Future"', '"Orbitron"', 'sans-serif'],
      },
      boxShadow: {
        'hud': '0 0 15px rgba(224, 122, 95, 0.25)',
        'hud-glow': '0 0 25px rgba(224, 122, 95, 0.45)',
        'cyan-glow': '0 0 20px rgba(56, 189, 248, 0.4)',
        'green-glow': '0 0 20px rgba(74, 222, 128, 0.4)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 10px rgba(224, 122, 95, 0.5))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 3px rgba(224, 122, 95, 0.2))' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
