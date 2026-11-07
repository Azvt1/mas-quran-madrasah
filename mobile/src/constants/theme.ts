import { Platform } from 'react-native';

// Brand: teal-600 (#0d9488), matching the website.
export const Colors = {
  light: {
    text: '#0f172a',
    textSecondary: '#64748b',
    background: '#f8fafc',
    card: '#ffffff',
    border: '#e2e8f0',
    tint: '#0d9488',
    tintSoft: '#ccfbf1',
    onTint: '#ffffff',
    danger: '#dc2626',
    warning: '#d97706',
  },
  dark: {
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    background: '#020617',
    card: '#0f172a',
    border: '#1e293b',
    tint: '#2dd4bf',
    tintSoft: '#134e4a',
    onTint: '#042f2e',
    danger: '#f87171',
    warning: '#fbbf24',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded' },
  default: { sans: 'normal', rounded: 'normal' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)' },
});

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;

export const Radius = {
  card: 16,
  pill: 999,
} as const;
