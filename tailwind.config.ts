import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Discord-specific tier colors
        tier: {
          d: "hsl(0, 84%, 60%)", // red
          c: "hsl(25, 95%, 53%)", // orange  
          b: "hsl(45, 93%, 56%)", // yellow
          a: "hsl(142, 76%, 36%)", // green
          s: "hsl(45, 93%, 56%)", // gold gradient base
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        discord: ["Whitney", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "regen-glow": {
          "0%": {
            boxShadow: "0 0 5px hsl(var(--secondary))",
          },
          "100%": {
            boxShadow: "0 0 20px hsl(var(--secondary)), 0 0 30px hsl(var(--secondary))",
          },
        },
        "glow": {
          "0%": {
            boxShadow: "0 0 5px hsl(var(--primary))",
          },
          "100%": {
            boxShadow: "0 0 20px hsl(var(--primary)), 0 0 30px hsl(var(--primary))",
          },
        },
        "pulse-secondary": {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.5",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "regen-glow": "regen-glow 2s ease-in-out infinite alternate",
        "glow": "glow 2s ease-in-out infinite alternate",
        "pulse-secondary": "pulse-secondary 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      spacing: {
        "discord": "var(--spacing)",
      },
      boxShadow: {
        "discord-sm": "var(--shadow-sm)",
        "discord": "var(--shadow)",
        "discord-md": "var(--shadow-md)",
        "discord-lg": "var(--shadow-lg)",
        "discord-xl": "var(--shadow-xl)",
        "discord-2xl": "var(--shadow-2xl)",
        "tier-s": "0 0 20px hsl(45, 93%, 56%, 0.3)",
        "tier-a": "0 0 15px hsl(142, 76%, 36%, 0.3)",
        "tier-b": "0 0 10px hsl(45, 93%, 56%, 0.2)",
      },
      backgroundImage: {
        "tier-s-gradient": "linear-gradient(90deg, hsl(45, 93%, 56%), hsl(38, 92%, 50%))",
        "discord-embed": "linear-gradient(90deg, hsl(var(--primary)) 0%, transparent 100%)",
      },
      borderColor: {
        "discord": "hsl(var(--border))",
        "tier-s": "hsl(45, 93%, 56%)",
        "tier-a": "hsl(142, 76%, 36%)",
        "tier-b": "hsl(45, 93%, 56%)",
        "tier-c": "hsl(25, 95%, 53%)",
        "tier-d": "hsl(0, 84%, 60%)",
      },
      backgroundColor: {
        "tier-s": "hsl(45, 93%, 56%)",
        "tier-a": "hsl(142, 76%, 36%)",
        "tier-b": "hsl(45, 93%, 56%)",
        "tier-c": "hsl(25, 95%, 53%)",
        "tier-d": "hsl(0, 84%, 60%)",
        "discord-dark": "hsl(var(--background))",
        "discord-card": "hsl(var(--card))",
        "discord-muted": "hsl(var(--muted))",
      },
      textColor: {
        "tier-s": "hsl(45, 6%, 13%)",
        "tier-a": "hsl(0, 0%, 100%)",
        "tier-b": "hsl(45, 6%, 13%)",
        "tier-c": "hsl(0, 0%, 100%)",
        "tier-d": "hsl(0, 0%, 100%)",
        "discord-primary": "hsl(var(--primary))",
        "discord-secondary": "hsl(var(--secondary))",
        "discord-accent": "hsl(var(--accent))",
      },
      opacity: {
        "15": "0.15",
        "35": "0.35",
        "85": "0.85",
      },
      scale: {
        "102": "1.02",
        "98": "0.98",
      },
      transitionProperty: {
        "colors-transform": "color, background-color, border-color, text-decoration-color, fill, stroke, transform",
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    // Custom plugin for Discord-style utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.discord-embed': {
          borderLeft: `4px solid ${theme('colors.primary.DEFAULT')}`,
        },
        '.tier-s-badge': {
          background: 'linear-gradient(90deg, hsl(45, 93%, 56%), hsl(38, 92%, 50%))',
          color: 'hsl(45, 6%, 13%)',
        },
        '.tier-a-badge': {
          backgroundColor: 'hsl(142, 76%, 36%)',
          color: 'hsl(0, 0%, 100%)',
        },
        '.tier-b-badge': {
          backgroundColor: 'hsl(45, 93%, 56%)',
          color: 'hsl(45, 6%, 13%)',
        },
        '.tier-c-badge': {
          backgroundColor: 'hsl(25, 95%, 53%)',
          color: 'hsl(0, 0%, 100%)',
        },
        '.tier-d-badge': {
          backgroundColor: 'hsl(0, 84%, 60%)',
          color: 'hsl(0, 0%, 100%)',
        },
        '.regen-pulse': {
          animation: 'regen-glow 2s ease-in-out infinite alternate',
        },
        '.status-online': {
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '50%',
          backgroundColor: 'hsl(var(--secondary))',
          animation: 'pulse-secondary 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        '.status-offline': {
          width: '0.75rem',
          height: '0.75rem', 
          borderRadius: '50%',
          backgroundColor: 'hsl(var(--destructive))',
        },
        '.interactive-hover': {
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
        },
        '.interactive-hover:hover': {
          opacity: '0.8',
          transform: 'scale(1.02)',
        },
        '.interactive-active': {
          transform: 'scale(0.98)',
        },
        '.character-kyuu': {
          borderColor: 'hsl(var(--secondary) / 0.3)',
          backgroundColor: 'hsl(var(--secondary) / 0.05)',
        },
        '.character-shimi': {
          borderColor: 'hsl(var(--primary) / 0.3)',
          backgroundColor: 'hsl(var(--primary) / 0.05)',
        },
        '.character-dreymi': {
          borderColor: 'hsl(var(--accent) / 0.3)',
          backgroundColor: 'hsl(var(--accent) / 0.05)',
        },
        '.stat-bar': {
          background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary)) var(--fill-percent, 0%), hsl(var(--muted)) var(--fill-percent, 0%), hsl(var(--muted)) 100%)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config;
