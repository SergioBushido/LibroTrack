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
  border: 'rgba(26,23,20,0.12)',
  error: '#D32F2F',
};

export const darkColors: ColorTheme = {
  cream: '#121212', // Background principal oscuro
  ink: '#F7F4EF',   // Textos principales claros
  ink2: '#E0DCD6',  // Textos secundarios
  ink3: '#8a8480',  // Textos terciarios (mismo tono o ligeramente más claro)
  accent: '#E57373', // Acento rojo más claro
  accent2: '#E29C74', // Acento naranja más claro
  gold: '#DDBB5C',   // Oro más brillante para destacar en oscuro
  green: '#66A678',
  blue: '#6B90B5',
  cardBg: '#1E1E1E', // Fondo de tarjetas oscuro
  border: 'rgba(255,255,255,0.12)', // Bordes claros translúcidos
  error: '#EF5350',
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
    s: 4,
    m: 8,
    l: 12,
    xl: 16,
    round: 9999,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' as const },
    h2: { fontSize: 22, fontWeight: '600' as const },
    h3: { fontSize: 18, fontWeight: '600' as const },
    body: { fontSize: 16 },
    caption: { fontSize: 14 },
    small: { fontSize: 12 },
  }
};

// Función para generar estilos globales dinámicos
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  }
});
