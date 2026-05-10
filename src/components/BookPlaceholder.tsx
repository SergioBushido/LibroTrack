import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { theme } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  title: string;
  author?: string;
  height?: number;
}

export const BookPlaceholder: React.FC<Props> = ({ title, author, height = 180 }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { height, backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={[styles.stripe, { backgroundColor: colors.accent2 + '20' }]} />
      <MaterialCommunityIcons name="book-open-variant" size={40} color={colors.ink3} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.ink }]} numberOfLines={2}>{title}</Text>
        {author ? <Text style={[styles.author, { color: colors.ink2 }]} numberOfLines={1}>{author}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 15,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.05)',
  },
  icon: {
    marginBottom: theme.spacing.s,
    opacity: 0.5,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    ...theme.typography.body,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'serif',
  },
  author: {
    ...theme.typography.small,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
});
