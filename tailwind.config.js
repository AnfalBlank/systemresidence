/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand & accent — Airbnb Rausch voltage
        primary: '#ff385c',
        'primary-active': '#e00b41',
        'primary-disabled': '#ffd1da',
        'primary-error': '#c13515',
        'primary-error-hover': '#b32505',
        luxe: '#460479',
        plus: '#92174d',
        // Text
        ink: '#222222',
        body: '#3f3f3f',
        muted: '#6a6a6a',
        'muted-soft': '#929292',
        // Surfaces
        canvas: '#ffffff',
        'surface-soft': '#f7f7f7',
        'surface-strong': '#f2f2f2',
        // Hairlines & borders
        hairline: '#dddddd',
        'hairline-soft': '#ebebeb',
        'border-strong': '#c1c1c1',
        // Semantic helpers (derived, used sparingly for status chips)
        success: '#1a7f37',
        'success-soft': '#e6f4ea',
        warning: '#9a6700',
        'warning-soft': '#fff8e1',
        info: '#0b6bcb',
        'info-soft': '#e7f0fb',
        'legal-link': '#428bff',
      },
      fontFamily: {
        sans: [
          "'Airbnb Cereal VF'",
          'Circular',
          'Inter',
          '-apple-system',
          'system-ui',
          'Roboto',
          "'Helvetica Neue'",
          'sans-serif',
        ],
      },
      fontSize: {
        'rating-display': ['64px', { lineHeight: '1.1', letterSpacing: '-1px', fontWeight: '700' }],
        'display-xl': ['28px', { lineHeight: '1.43', letterSpacing: '0', fontWeight: '700' }],
        'display-lg': ['22px', { lineHeight: '1.18', letterSpacing: '-0.44px', fontWeight: '500' }],
        'display-md': ['21px', { lineHeight: '1.43', letterSpacing: '0', fontWeight: '700' }],
        'display-sm': ['20px', { lineHeight: '1.2', letterSpacing: '-0.18px', fontWeight: '600' }],
        'title-md': ['16px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '600' }],
        'title-sm': ['16px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.43', letterSpacing: '0', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '1.29', letterSpacing: '0', fontWeight: '500' }],
        'caption-sm': ['13px', { lineHeight: '1.23', letterSpacing: '0', fontWeight: '400' }],
        badge: ['11px', { lineHeight: '1.18', letterSpacing: '0', fontWeight: '600' }],
        'micro-label': ['12px', { lineHeight: '1.33', letterSpacing: '0', fontWeight: '700' }],
        'uppercase-tag': ['8px', { lineHeight: '1.25', letterSpacing: '0.32px', fontWeight: '700' }],
        'button-md': ['16px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '500' }],
        'button-sm': ['14px', { lineHeight: '1.29', letterSpacing: '0', fontWeight: '500' }],
      },
      borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '8px',
        md: '14px',
        lg: '20px',
        xl: '32px',
        full: '9999px',
      },
      spacing: {
        xxs: '2px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        base: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '64px',
      },
      boxShadow: {
        // The single elevation tier from the design system
        float:
          'rgba(0, 0, 0, 0.02) 0 0 0 1px, rgba(0, 0, 0, 0.04) 0 2px 6px 0, rgba(0, 0, 0, 0.1) 0 4px 8px 0',
        'float-lg':
          'rgba(0, 0, 0, 0.04) 0 0 0 1px, rgba(0, 0, 0, 0.08) 0 4px 12px 0, rgba(0, 0, 0, 0.12) 0 8px 24px 0',
      },
      maxWidth: {
        content: '1280px',
        listing: '1080px',
      },
      screens: {
        // Airbnb breakpoints
        tablet: '744px',
        desktop: '1128px',
        wide: '1440px',
      },
    },
  },
  plugins: [],
}
