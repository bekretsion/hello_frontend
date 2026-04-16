import { Inter } from 'next/font/google';

// Single Inter instance — one preload tag, one network request for the typeface.
// Both CSS variables are served from the same self-hosted font files.
const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  preload: true,
});

// Backwards-compat aliases — no extra font loaded
const fontMono = fontSans;
const fontInstrument = fontSans;
const fontNotoMono = fontSans;
const fontMullish = fontSans;
const fontInter = fontSans;

// fontVariables applies --font-sans; --font-mono is aliased in CSS/Tailwind config
export const fontVariables = fontSans.variable;
