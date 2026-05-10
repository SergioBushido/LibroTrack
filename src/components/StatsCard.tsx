import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  flex?: number;
}

export const StatsCard: React.FC<Props> = ({ title, value, subtitle, flex = 1 }) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  return (
    <View style={[globalStyles.card, styles.container, { flex }]}>
      <Text style={[styles.title, { color: colors.ink3 }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.accent }]}>{value}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.ink2 }]}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.m,
  },
  title: {
    ...theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  value: {
    ...theme.typography.h2,
  },
  subtitle: {
    ...theme.typography.small,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  }
});
