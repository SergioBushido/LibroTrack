import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Rating } from '../types/Book';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  rating: Rating;
}

export const RatingBadge: React.FC<Props> = ({ rating }) => {
  const { isDark } = useTheme();
  const colors = theme.ratingColors[rating];
  const bg = isDark ? colors.darkBg : colors.bg;
  const text = isDark ? colors.darkText : colors.text;
  
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{rating}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    alignSelf: 'flex-start',
  },
  text: {
    ...theme.typography.small,
    fontWeight: '600',
  }
});
