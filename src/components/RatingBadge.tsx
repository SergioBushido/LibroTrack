import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Rating } from '../types/Book';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  rating: Rating;
  mini?: boolean;
}

export const RatingBadge: React.FC<Props> = ({ rating, mini }) => {
  const { isDark } = useTheme();
  const colors = theme.ratingColors[rating];
  const bg = isDark ? colors.darkBg : colors.bg;
  const text = isDark ? colors.darkText : colors.text;
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: bg },
      mini && styles.miniContainer
    ]}>
      <Text style={[
        styles.text, 
        { color: text },
        mini && styles.miniText
      ]}>
        {rating}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
    alignSelf: 'flex-start',
  },
  miniContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    ...theme.typography.small,
    fontSize: 10,
  },
  miniText: {
    fontSize: 9,
  }
});
