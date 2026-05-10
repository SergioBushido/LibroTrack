import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  quote: string;
}

export const QuoteBlock: React.FC<Props> = ({ quote }) => {
  if (!quote) return null;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name="format-quote-open" 
        size={32} 
        color={theme.colors.gold} 
        style={styles.icon} 
      />
      <Text style={styles.text}>"{quote}"</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.gold,
    backgroundColor: theme.colors.cream,
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
    color: theme.colors.ink2,
    lineHeight: 24,
  }
});
