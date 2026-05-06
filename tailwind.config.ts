import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        honeycomb: {
          amber:   '#F59E0B',
          gold:    '#D97706',
          dark:    '#1C1917',
          surface: '#292524',
          border:  '#44403C',
          muted:   '#78716C',
          text:    '#E7E5E4',
        },
        channel: {
          social:       '#3B82F6',
          email:        '#8B5CF6',
          newsletter:   '#10B981',
          push:         '#F59E0B',
          sms:          '#EC4899',
        },
        milestone: {
          launch:     '#6366F1',
          strongstart:'#F59E0B',
          midcampaign:'#3B82F6',
          closing:    '#EF4444',
          target:     '#10B981',
        },
        urgency: {
          high:   '#EF4444',
          medium: '#F97316',
          low:    '#6B7280',
        },
      },
    },
  },
  plugins: [],
};

export default config;
