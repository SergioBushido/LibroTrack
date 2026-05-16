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
};

export const lightColors: ColorTheme = {
  cream: '#F7F4EF',
  ink: '#1a1714',
  ink2: '#4a4540',
  ink3: '#8a8480',
  accent: '#8B3A3A',
  accent2: '#C4845A',
  gold: '#C9A84C',
  green: '#4A7C59',
  blue: '#3A5F8B',
  cardBg: '#FDFAF6',
  border: 'rgba(26,23,20,0.08)',
  error: '#D32F2F',
  glass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
};

export const darkColors: ColorTheme = {
  cream: '#0F0F0F',
  ink: '#F7F4EF',
  ink2: '#B0ADA8',
  ink3: '#6E6A66',
  accent: '#E57373',
  accent2: '#E29C74',
  gold: '#DDBB5C',
  green: '#81C784',
  blue: '#64B5F6',
  cardBg: '#1A1A1A',
  border: 'rgba(255, 255, 255, 0.05)',
  error: '#EF5350',
  glass: 'rgba(26, 26, 26, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

export const theme = {
  ratingColors: {
    'Malo': { bg: '#FCEBEB', text: '#A32D2D', darkBg: '#3A1616', darkText: '#E57373' },
    'Regular': { bg: '#FAEEDA', text: '#854F0B', darkBg: '#33230C', darkText: '#DDBB5C' },
    'Bueno': { bg: '#EAF3DE', text: '#3B6D11', darkBg: '#192C07', darkText: '#81C784' },
    'Muy bueno': { bg: '#E6F1FB', text: '#185FA5', darkBg: '#09233D', darkText: '#64B5F6' },
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
    s: 6,
    m: 10,
    l: 16,
    xl: 24,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 6,
    },
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
