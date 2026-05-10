import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  quote: string;
}

export const QuoteBlock: React.FC<Props> = ({ quote }) => {
  const { colors } = useTheme();
  if (!quote) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.cream, borderLeftColor: colors.gold }]}>
      <MaterialCommunityIcons 
        name="format-quote-open" 
        size={32} 
        color={colors.gold} 
        style={styles.icon} 
      />
      <Text style={[styles.text, { color: colors.ink2 }]}>"{quote}"</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    padding: theme.spacing.m,
    paddingLeft: theme.spacing.l,
    marginVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.s,
  },
  icon: {
    position: 'absolute',
    top: -10,
    left: 8,
    opacity: 0.3,
  },
  text: {
    ...theme.typography.body,
    fontStyle: 'italic',
    lineHeight: 24,
  }
});
