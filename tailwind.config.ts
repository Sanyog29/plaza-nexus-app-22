
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				md: '2rem',
				lg: '3rem',
				xl: '4rem',
				'2xl': '5rem',
			},
			screens: {
				sm: '640px',
				md: '768px', 
				lg: '1024px',
				xl: '1280px',
				'2xl': '1600px',
				'3xl': '1920px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				// Maintenance Request Status Colors
				'status-pending': {
					DEFAULT: 'hsl(var(--status-pending))',
					foreground: 'hsl(var(--status-pending-foreground))'
				},
				'status-in-progress': {
					DEFAULT: 'hsl(var(--status-in-progress))',
					foreground: 'hsl(var(--status-in-progress-foreground))'
				},
				'status-completed': {
					DEFAULT: 'hsl(var(--status-completed))',
					foreground: 'hsl(var(--status-completed-foreground))'
				},
				'status-overdue': {
					DEFAULT: 'hsl(var(--status-overdue))',
					foreground: 'hsl(var(--status-overdue-foreground))'
				},
				'priority-high': {
					DEFAULT: 'hsl(var(--priority-high))',
					foreground: 'hsl(var(--priority-high-foreground))'
				},
				'priority-medium': {
					DEFAULT: 'hsl(var(--priority-medium))',
					foreground: 'hsl(var(--priority-medium-foreground))'
				},
				'priority-low': {
					DEFAULT: 'hsl(var(--priority-low))',
					foreground: 'hsl(var(--priority-low-foreground))'
				},
				// Semantic design tokens for app-specific colors
				surface: {
					DEFAULT: 'hsl(var(--card))',
					elevated: 'hsl(var(--popover))',
					foreground: 'hsl(var(--card-foreground))'
				},
				glass: 'hsl(var(--card-glass))',
				// Legacy plaza colors - now semantic
				plaza: {
					blue: 'hsl(var(--primary))',
					dark: 'hsl(var(--background))',
					grey: 'hsl(var(--muted))',
					lightgrey: 'hsl(var(--muted-foreground))',
					success: 'hsl(var(--success))',
					warning: 'hsl(var(--warning))',
					danger: 'hsl(var(--destructive))',
				}
			},
			fontFamily: {
				apple: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
				system: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' },
				},
				'pulse-gentle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'pulse-gentle': 'pulse-gentle 2s infinite ease-in-out',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
