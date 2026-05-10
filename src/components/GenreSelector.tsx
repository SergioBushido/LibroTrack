import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Genre } from '../types/Book';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const GENRES: Genre[] = [
  'Novela', 'Ensayo', 'Ciencia ficción', 'Histórico', 'Poesía', 'Autobiografía', 'Terror', 'Otro'
];

interface Props {
  value: Genre | null;
  onChange: (genre: Genre | null) => void;
}

export const GenreSelector: React.FC<Props> = ({ value, onChange }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {GENRES.map(genre => {
        const isSelected = value === genre;
        return (
          <TouchableOpacity
            key={genre}
            style={[
              styles.chip, 
              { backgroundColor: isSelected ? colors.ink : colors.cardBg, borderColor: isSelected ? colors.ink : colors.border }
            ]}
            onPress={() => onChange(isSelected ? null : genre)}
          >
            <Text style={[
              styles.text, 
              { color: isSelected ? colors.cream : colors.ink2, fontWeight: isSelected ? '600' : 'normal' }
            ]}>
              {genre}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
    marginVertical: theme.spacing.s,
  },
  chip: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
  },
  text: {
    ...theme.typography.caption,
  }
});
