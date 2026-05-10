import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Genre } from '../types/Book';
import { theme } from '../constants/theme';

const GENRES: Genre[] = [
  'Novela', 'Ensayo', 'Ciencia ficción', 'Histórico', 'Poesía', 'Autobiografía', 'Terror', 'Otro'
];

interface Props {
  value: Genre | null;
  onChange: (genre: Genre | null) => void;
}

export const GenreSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      {GENRES.map(genre => {
        const isSelected = value === genre;
        return (
          <TouchableOpacity
            key={genre}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onChange(isSelected ? null : genre)}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]}>
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
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardBg,
  },
  chipSelected: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  text: {
    ...theme.typography.caption,
  },
  textSelected: {
    color: theme.colors.cream,
    fontWeight: '600',
  }
});
