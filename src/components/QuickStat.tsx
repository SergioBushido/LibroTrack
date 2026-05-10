import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface QuickStatProps {
  label: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color?: string;
}

export const QuickStat = ({ label, value, icon, color }: QuickStatProps) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: color || colors.accent + '20' }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color || colors.accent} />
      </View>
      <View>
        <Text style={[styles.value, { color: colors.ink }]}>{value}</Text>
        <Text style={[styles.label, { color: colors.ink3 }]}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    minWidth: 140,
    marginRight: theme.spacing.m,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  value: {
    ...theme.typography.h3,
    fontWeight: '700',
  },
  label: {
    ...theme.typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
