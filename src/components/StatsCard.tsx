import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, globalStyles } from '../constants/theme';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  flex?: number;
}

export const StatsCard: React.FC<Props> = ({ title, value, subtitle, flex = 1 }) => {
  return (
    <View style={[globalStyles.card, styles.container, { flex }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
    color: theme.colors.accent,
  },
  subtitle: {
    ...theme.typography.small,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  }
});
