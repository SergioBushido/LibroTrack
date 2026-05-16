import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Dimensions, Animated, Platform } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { Book } from '../types/Book';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { RatingBadge } from '../components/RatingBadge';
import { QuoteBlock } from '../components/QuoteBlock';
import { BookPlaceholder } from '../components/BookPlaceholder';
import { FadeInView } from '../components/FadeInView';
import { formatShortDate, calculateReadingDays } from '../utils/dateUtils';
import { deleteBook, getAllBooks, updateBook } from '../services/bookStorage';
import { HapticService } from '../services/HapticService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 450;

export const BookDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [book, setBook] = useState<Book>(route.params?.book);
  const { colors, isDark } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const [imageError, setImageError] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
    outputRange: [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75],
  });

  const headerScale = scrollY.interpolate({
    inputRange: [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
    outputRange: [2, 1, 1],
  });

  const blurOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT / 2],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useFocusEffect(
    useCallback(() => {
      const fetchBook = async () => {
        const books = await getAllBooks();
        const updatedBook = books.find(b => b.id === book.id);
        if (updatedBook) {
          setBook(updatedBook);
          setImageError(false);
        }
      };
      fetchBook();
    }, [book.id])
  );

  const handleDelete = () => {
    HapticService.error();
    Alert.alert(
      "Eliminar libro",
      "¿Estás seguro de que quieres eliminar este libro?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            await deleteBook(book.id);
            HapticService.success();
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleEditQuote = () => {
    HapticService.light();
    Alert.prompt(
      "Editar cita favorita",
      "Introduce tu cita favorita de este libro:",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Guardar",
          onPress: async (text: string | undefined) => {
            if (text !== undefined) {
              const updated = await updateBook(book.id, { quote: text });
              setBook(updated);
              HapticService.success();
            }
          }
        }
      ],
      'plain-text',
      book.quote || ''
    );
  };

  if (!book) return null;

  const days = calculateReadingDays(book.startDate, book.endDate);

  return (
    <View style={globalStyles.container}>
      <Animated.ScrollView 
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.headerImageContainer, 
            {
              transform: [
                { translateY: headerTranslateY },
                { scale: headerScale }
              ]
            }
          ]}
        >
          {book.coverUrl && !imageError ? (
            <Image 
              source={{ uri: book.coverUrl }} 
              style={styles.bgImage} 
              blurRadius={Platform.OS === 'ios' ? 0 : 10}
            />
          ) : (
            <View style={[styles.bgImage, { backgroundColor: colors.ink }]} />
          )}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: blurOpacity }]}>
            <BlurView 
              intensity={isDark ? 40 : 60} 
              tint={isDark ? 'dark' : 'light'} 
              style={StyleSheet.absoluteFill} 
            />
          </Animated.View>
        </Animated.View>

        <View style={styles.mainContent}>
          <FadeInView delay={200} style={styles.coverWrapper}>
            {book.coverUrl && !imageError ? (
              <Image 
                source={{ uri: book.coverUrl }} 
                style={styles.detailCover} 
                resizeMode="cover" 
                onError={() => setImageError(true)}
              />
            ) : (
              <BookPlaceholder title={book.title} author={book.author} height={320} />
            )}
          </FadeInView>

          <FadeInView delay={300} style={styles.infoBox}>
            {book.genre && <Text style={[styles.genre, { color: colors.accent2 }]}>{book.genre.toUpperCase()}</Text>}
            <Text style={[styles.title, { color: colors.ink }]}>{book.title}</Text>
            {book.author && <Text style={[styles.author, { color: colors.ink2 }]}>{book.author}</Text>}
            
            <View style={styles.badgesContainer}>
              <RatingBadge rating={book.rating} />
              {book.mood && (
                <View style={[styles.badge, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <Text style={styles.moodEmoji}>{book.mood}</Text>
                </View>
              )}
              <View style={[styles.badge, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.ink3} />
                <Text style={[styles.badgeText, { color: colors.ink2 }]}>{days} días</Text>
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={400} style={[styles.datesGrid, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.dateCol}>
              <Text style={[styles.dateLabel, { color: colors.ink3 }]}>INICIADO</Text>
              <Text style={[styles.dateValue, { color: colors.ink }]}>{formatShortDate(book.startDate)}</Text>
            </View>
            <View style={[styles.dateDivider, { backgroundColor: colors.border }]} />
            <View style={styles.dateCol}>
              <Text style={[styles.dateLabel, { color: colors.ink3 }]}>FINALIZADO</Text>
              <Text style={[styles.dateValue, { color: colors.ink }]}>{formatShortDate(book.endDate)}</Text>
            </View>
          </FadeInView>

          {book.notes && (
            <FadeInView delay={500} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>Notas personales</Text>
              <View style={[styles.notesBox, { borderLeftColor: colors.gold, backgroundColor: colors.cardBg }]}>
                <Text style={[styles.notesText, { color: colors.ink2 }]}>{book.notes}</Text>
              </View>
            </FadeInView>
          )}

          <FadeInView delay={600} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>Cita favorita</Text>
              <TouchableOpacity onPress={handleEditQuote}>
                <MaterialCommunityIcons name={book.quote ? "pencil" : "plus"} size={20} color={colors.accent2} />
              </TouchableOpacity>
            </View>
            
            {book.quote ? (
              <QuoteBlock quote={book.quote} />
            ) : (
              <TouchableOpacity style={[styles.addQuoteBtn, { borderColor: colors.border }]} onPress={handleEditQuote}>
                <Text style={[styles.addQuoteText, { color: colors.ink3 }]}>Toca para añadir un fragmento inolvidable...</Text>
              </TouchableOpacity>
            )}
          </FadeInView>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.editBtn, { backgroundColor: colors.ink }]} 
              onPress={() => { HapticService.light(); navigation.navigate('EditBook', { book }); }}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={colors.cream} />
              <Text style={[styles.editBtnText, { color: colors.cream }]}>Editar detalles</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.error + '15' }]} onPress={handleDelete}>
              <MaterialCommunityIcons name="delete-outline" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Floating Back Button */}
      <TouchableOpacity 
        style={[styles.floatingBackBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]} 
        onPress={() => { HapticService.light(); navigation.goBack(); }}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.ink} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 150,
  },
  headerImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: -1,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  mainContent: {
    marginTop: HEADER_HEIGHT - 280,
    paddingHorizontal: theme.spacing.l,
  },
  coverWrapper: {
    alignSelf: 'center',
    width: 210,
    height: 320,
    borderRadius: theme.borderRadius.m,
    ...theme.shadow.medium,
    elevation: 15,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  detailCover: {
    width: '100%',
    height: '100%',
  },
  infoBox: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  genre: {
    ...theme.typography.small,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: theme.spacing.s,
  },
  title: {
    ...theme.typography.h1,
    fontFamily: 'serif',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  author: {
    ...theme.typography.h3,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.8,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    gap: 6,
  },
  moodEmoji: {
    fontSize: 16,
  },
  badgeText: {
    ...theme.typography.small,
    fontSize: 11,
    textTransform: 'none',
  },
  datesGrid: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
    ...theme.shadow.soft,
  },
  dateCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    height: '60%',
    alignSelf: 'center',
  },
  dateLabel: {
    ...theme.typography.small,
    fontSize: 9,
    marginBottom: 4,
  },
  dateValue: {
    ...theme.typography.body,
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    ...theme.typography.small,
    letterSpacing: 1,
  },
  notesBox: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderLeftWidth: 4,
    ...theme.shadow.soft,
  },
  notesText: {
    ...theme.typography.body,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  addQuoteBtn: {
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    opacity: 0.6,
  },
  addQuoteText: {
    ...theme.typography.caption,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: theme.spacing.l,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: theme.borderRadius.m,
    gap: 8,
    ...theme.shadow.soft,
  },
  editBtnText: {
    ...theme.typography.body,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBackBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 10,
  }
});
