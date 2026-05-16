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
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.ink }]}>{value}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.ink3 }]}>{subtitle}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.l,
    alignItems: 'flex-start',
  },
  title: {
    ...theme.typography.small,
    fontSize: 10,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    ...theme.typography.h1,
    fontSize: 28,
  },
  subtitle: {
    ...theme.typography.caption,
    fontSize: 12,
    fontWeight: '600',
  }
});
