import { StyleSheet } from 'react-native';

export const theme = {
  colors: {
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
    border: 'rgba(26,23,20,0.12)',
    error: '#D32F2F',
  },
  ratingColors: {
    'Malo': { bg: '#FCEBEB', text: '#A32D2D' },
    'Regular': { bg: '#FAEEDA', text: '#854F0B' },
    'Bueno': { bg: '#EAF3DE', text: '#3B6D11' },
    'Muy bueno': { bg: '#E6F1FB', text: '#185FA5' },
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
    s: 4,
    m: 8,
    l: 12,
    xl: 16,
    round: 9999,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700', color: '#1a1714' },
    h2: { fontSize: 22, fontWeight: '600', color: '#1a1714' },
    h3: { fontSize: 18, fontWeight: '600', color: '#1a1714' },
    body: { fontSize: 16, color: '#4a4540' },
    caption: { fontSize: 14, color: '#8a8480' },
    small: { fontSize: 12, color: '#8a8480' },
  }
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  shadow: {
    shadowColor: theme.colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  }
});
