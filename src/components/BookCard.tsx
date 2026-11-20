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
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

interface Props {
  book: Book;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  index?: number;
}

export const BookCard: React.FC<Props> = ({ book, onPress, onEdit, onDelete, index = 0 }) => {
  const { colors, isDark } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const layout = useResponsiveLayout();
  const days = calculateReadingDays(book.startDate, book.endDate);
  const [imageError, setImageError] = React.useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setImageError(false);
  }, [book.coverUrl]);

  useEffect(() => {
    const cappedDelay = Math.min(Math.max(0, index), 6) * 45;
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay: cappedDelay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 16,
        stiffness: 120,
        delay: cappedDelay,
        useNativeDriver: true,
      })
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, opacity, translateY]);

  const ratingAccentColor = isDark
    ? theme.ratingColors[book.rating].darkText
    : theme.ratingColors[book.rating].text;

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
        <View style={[styles.contentRow, layout.compact && { flexDirection: 'column', gap: 16 }]}>
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
            <View style={[styles.moodBadge, { backgroundColor: colors.cardBg }]}>
              <Text style={styles.moodText}>{book.mood || '📖'}</Text>
            </View>
          </View>

          <View style={[styles.infoContainer, layout.compact && { marginLeft: 0, flex: undefined }]}>
            <View style={[styles.titleRow, layout.compact && { flexDirection: 'column' }]}>
              <Text style={[styles.title, { color: colors.ink }, layout.compact && { flex: undefined }]} numberOfLines={layout.compact ? undefined : 2}>
                {book.title}
              </Text>
              <RatingBadge rating={book.rating} mini />
            </View>
            
            <Text style={[styles.author, { color: colors.ink2 }]} numberOfLines={layout.compact ? undefined : 1}>
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
          <View style={[styles.notesContainer, { backgroundColor: colors.cream + '50', borderLeftColor: ratingAccentColor }]}>
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
    width: 85,
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
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
    gap: 4,
  },
  badgeText: {
    flexShrink: 1,
    ...theme.typography.small,
    fontSize: 10,
  },
  notesContainer: {
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.s,
    borderLeftWidth: 2,
  },
  notesText: {
    ...theme.typography.caption,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    flexWrap: 'wrap',
    gap: 8,
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
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
