import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Book } from '../types/Book';
import { theme, globalStyles } from '../constants/theme';
import { RatingBadge } from './RatingBadge';
import { formatShortDate, calculateReadingDays } from '../utils/dateUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  book: Book;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const BookCard: React.FC<Props> = ({ book, onPress, onEdit, onDelete }) => {
  const days = calculateReadingDays(book.startDate, book.endDate);

  return (
    <TouchableOpacity style={[globalStyles.card, styles.container]} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
          {book.author && <Text style={styles.author} numberOfLines={1}>{book.author}</Text>}
        </View>
        {book.mood && <Text style={styles.mood}>{book.mood}</Text>}
      </View>

      <View style={styles.badgesRow}>
        <RatingBadge rating={book.rating} />
        <View style={styles.badge}>
          <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.ink3} />
          <Text style={styles.badgeText}>{days} días</Text>
        </View>
        {book.genre && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{book.genre}</Text>
          </View>
        )}
      </View>

      {book.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText} numberOfLines={2}>
            {book.notes}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.dateText}>Terminado el {formatShortDate(book.endDate)}</Text>
        
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
              <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.ink3} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
              <MaterialCommunityIcons name="delete" size={20} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.s,
  },
  titleContainer: {
    flex: 1,
    paddingRight: theme.spacing.s,
  },
  title: {
    ...theme.typography.h3,
    fontFamily: 'serif',
  },
  author: {
    ...theme.typography.caption,
    fontStyle: 'italic',
    marginTop: 2,
  },
  mood: {
    fontSize: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cream,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
    gap: 4,
  },
  badgeText: {
    ...theme.typography.small,
  },
  notesContainer: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent2,
    paddingLeft: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  notesText: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.ink2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.s,
  },
  dateText: {
    ...theme.typography.small,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.m,
  },
  actionBtn: {
    padding: 4,
  }
});
