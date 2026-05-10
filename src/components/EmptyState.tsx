import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface Props {
  icon: string;
  title: string;
  subtitle: string;
}

export const EmptyState: React.FC<Props> = ({ icon, title, subtitle }) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon as any} size={64} color={theme.colors.ink3} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xxl * 2,
  },
  title: {
    ...theme.typography.h3,
    marginTop: theme.spacing.m,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.ink3,
    marginTop: theme.spacing.s,
    textAlign: 'center',
  }
});
