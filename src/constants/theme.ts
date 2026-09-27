import { StyleSheet } from 'react-native';

export type ColorTheme = {
  cream: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  accent2: string;
  gold: string;
  green: string;
  blue: string;
  cardBg: string;
  border: string;
  error: string;
  glass: string;
  glassBorder: string;
  // New premium tokens
  gradientStart: string;
  gradientEnd: string;
  accentSoft: string;
  surface: string;
  surfaceElevated: string;
  shimmer: string;
};

export const lightColors: ColorTheme = {
  cream: '#FAF8F5',
  ink: '#1B1520',
  ink2: '#4A4358',
  ink3: '#9590A0',
  accent: '#6C5CE7',      // Rich violet
  accent2: '#E17055',     // Warm coral
  gold: '#D4A03C',
  green: '#00B894',       // Teal-green
  blue: '#0984E3',
  cardBg: '#FFFFFF',
  border: '#EAE6F0',
  error: '#FF7675',
  glass: 'rgba(255,255,255,0.85)',
  glassBorder: 'rgba(108,92,231,0.1)',
  gradientStart: '#6C5CE7',
  gradientEnd: '#A29BFE',
  accentSoft: '#6C5CE715',
  surface: '#F8F6FA',
  surfaceElevated: '#FFFFFF',
  shimmer: '#F0ECF4',
};

export const darkColors: ColorTheme = {
  cream: '#0D0B14',
  ink: '#F0ECF4',
  ink2: '#A29BFE',
  ink3: '#6A6378',
  accent: '#A29BFE',
  accent2: '#FAB1A0',
  gold: '#FDCB6E',
  green: '#55EFC4',
  blue: '#74B9FF',
  cardBg: '#161320',
  border: '#2D283E',
  error: '#FF7675',
  glass: 'rgba(22,19,32,0.85)',
  glassBorder: 'rgba(162,155,254,0.15)',
  gradientStart: '#A29BFE',
  gradientEnd: '#81ECEC',
  accentSoft: '#A29BFE15',
  surface: '#120F1A',
  surfaceElevated: '#1D192B',
  shimmer: '#231E33',
};

export const theme = {
  ratingColors: {
    'Malo': { bg: '#FFF0F0', text: '#C0392B', darkBg: '#2D1216', darkText: '#FF6B6B' },
    'Regular': { bg: '#FFF8E1', text: '#B7791F', darkBg: '#2D2410', darkText: '#FFEAA7' },
    'Bueno': { bg: '#E8F8F5', text: '#0E8C6C', darkBg: '#0D2920', darkText: '#55EFC4' },
    'Muy bueno': { bg: '#EDE7F6', text: '#5B3CC4', darkBg: '#1A1232', darkText: '#A29BFE' },
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    s: 8,
    m: 12,
    l: 18,
    xl: 26,
    round: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 16, lineHeight: 24 },
    caption: { fontSize: 14, lineHeight: 20 },
    small: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const, letterSpacing: 1 },
  },
  shadow: {
    soft: {
      shadowColor: '#1B1520',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
    medium: {
      shadowColor: '#1B1520',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 6,
    },
    glow: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    }),
    accent: (color: string) => ({
      shadowColor: color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    }),
  }
};

export const getGlobalStyles = (colors: ColorTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    ...theme.shadow.soft,
  },
  glassCard: {
    backgroundColor: colors.glass,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  }
});
