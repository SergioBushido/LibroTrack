import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Rating } from '../types/Book';
import { theme } from '../constants/theme';

interface Props {
  rating: Rating;
}

export const RatingBadge: React.FC<Props> = ({ rating }) => {
  const colors = theme.ratingColors[rating];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{rating}</Text>
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
