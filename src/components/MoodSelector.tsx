import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Mood } from '../types/Book';
import { theme } from '../constants/theme';

const MOODS: Mood[] = ['☀️', '🌧️', '🔥', '😴', '🤯'];

interface Props {
  value: Mood;
  onChange: (mood: Mood) => void;
}

export const MoodSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      {MOODS.map(mood => (
        <TouchableOpacity
          key={mood || 'null'}
          style={[
            styles.moodBtn,
            value === mood && styles.moodBtnSelected
          ]}
          onPress={() => onChange(mood === value ? null : mood)}
        >
          <Text style={styles.emoji}>{mood}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.s,
  },
  moodBtn: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moodBtnSelected: {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.accent2,
  },
  emoji: {
    fontSize: 24,
  }
});
