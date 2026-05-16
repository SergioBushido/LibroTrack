import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Book } from '../types/Book';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { RatingBadge } from './RatingBadge';
import { BookPlaceholder } from './BookPlaceholder';
import { formatShortDate, calculateReadingDays } from '../utils/dateUtils';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { HapticService } from '../services/HapticService';

interface Props {
  book: Book;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  index?: number;
}

export const BookCard: React.FC<Props> = ({ book, onPress, onEdit, onDelete, index = 0 }) => {
  const { colors } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const days = calculateReadingDays(book.startDate, book.endDate);
  const [imageError, setImageError] = React.useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 100,
        delay: index * 100,
        useNativeDriver: true,
      })
    ]).start();
  }, [index, opacity, translateY]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    HapticService.light();
    onPress();
  };

  return (
    <Animated.View 
      style={{ 
        opacity,
        transform: [
          { translateY },
          { scale }
        ]
      }}
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[globalStyles.card, styles.container]}
      >
        <View style={styles.contentRow}>
          <View style={styles.imageContainer}>
            {book.coverUrl && !imageError ? (
              <Image 
                source={{ uri: book.coverUrl }} 
                style={styles.coverImage} 
                resizeMode="cover" 
                onError={() => setImageError(true)}
              />
            ) : (
              <BookPlaceholder title={book.title} author={book.author} height={120} />
            )}
            <View style={styles.moodBadge}>
              <Text style={styles.moodText}>{book.mood || '📖'}</Text>
            </View>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.ink }]} numberOfLines={2}>
                {book.title}
              </Text>
              <RatingBadge rating={book.rating} mini />
            </View>
            
            <Text style={[styles.author, { color: colors.ink2 }]} numberOfLines={1}>
              {book.author || 'Autor desconocido'}
            </Text>

            <View style={styles.metaRow}>
              <View style={[styles.badge, { backgroundColor: colors.cream }]}>
                <MaterialCommunityIcons name="clock-outline" size={12} color={colors.ink3} />
                <Text style={[styles.badgeText, { color: colors.ink2 }]}>{days}d</Text>
              </View>
              {book.genre && (
                <View style={[styles.badge, { backgroundColor: colors.cream }]}>
                  <Text style={[styles.badgeText, { color: colors.ink2 }]}>{book.genre}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {book.notes && (
          <View style={[styles.notesContainer, { backgroundColor: colors.cream + '50' }]}>
            <Text style={[styles.notesText, { color: colors.ink2 }]} numberOfLines={2}>
              "{book.notes}"
            </Text>
          </View>
        )}

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.dateText, { color: colors.ink3 }]}>
            Finalizado el {formatShortDate(book.endDate)}
          </Text>
          
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity 
                onPress={() => { HapticService.light(); onEdit(); }} 
                style={styles.actionBtn}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.ink3} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity 
                onPress={() => { HapticService.error(); onDelete(); }} 
                style={styles.actionBtn}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.m,
    padding: 0,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    padding: theme.spacing.m,
  },
  imageContainer: {
    position: 'relative',
  },
  coverImage: {
    width: 85,
    height: 125,
    borderRadius: theme.borderRadius.s,
    ...theme.shadow.soft,
  },
  moodBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#FFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadow.soft,
    elevation: 4,
  },
  moodText: {
    fontSize: 16,
  },
  infoContainer: {
    flex: 1,
    marginLeft: theme.spacing.m,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    ...theme.typography.h3,
    fontFamily: 'serif',
    flex: 1,
    lineHeight: 22,
  },
  author: {
    ...theme.typography.caption,
    marginTop: 4,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: theme.spacing.m,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
    gap: 4,
  },
  badgeText: {
    ...theme.typography.small,
    fontSize: 10,
  },
  notesContainer: {
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.s,
    borderLeftWidth: 2,
    borderLeftColor: theme.ratingColors.Bueno.text, // Default accent
  },
  notesText: {
    ...theme.typography.caption,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  dateText: {
    ...theme.typography.small,
    fontSize: 10,
    textTransform: 'none',
    letterSpacing: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  }
});
