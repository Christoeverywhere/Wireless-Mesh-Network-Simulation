/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: '#00f0ff',     // Cyber blue / Cyan highlight
          deep: '#0066ff',     // Corporate Deep Blue
          dark: '#050b14',     // Darkest navy background
          bg: '#0a0f1d',       // Primary dark navy background
          card: '#0f172a',     // Cards deep navy
          border: '#1e293b',   // Slate border
          text: '#f8fafc'      // Slate-50 off-white
        },
        security: {
          success: '#10b981',  // Emerald success green
          warning: '#f97316',  // Alert warning orange
          threat: '#ef4444',   // Fire threat red
          unknown: '#64748b'   // Gray indicator
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.3)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.3)',
        'glow-blue': '0 0 15px rgba(0, 102, 255, 0.3)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2s infinite alternate'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.6)' }
        }
      }
    },
  },
  plugins: [],
}
