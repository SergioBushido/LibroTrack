import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Modal,
  Platform,
  Share,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { format } from 'date-fns';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Book, getBookStatus } from '../types/Book';
import { BibliotecaNavigationProp, BookDetailRouteProp } from '../types/Navigation';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useNotice } from '../context/NoticeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { RatingBadge } from '../components/RatingBadge';
import { QuoteBlock } from '../components/QuoteBlock';
import { BookPlaceholder } from '../components/BookPlaceholder';
import { TextEditModal } from '../components/TextEditModal';
import { formatShortDate, calculateReadingDays } from '../utils/dateUtils';
import {
  DETAIL_HEADER_HEIGHT,
  computeBookDetailMotion,
  formatReadingDuration,
} from '../utils/bookDetailMotion';
import { buildBookShareMessage } from '../utils/bookShare';
import { deleteBook, getAllBooks, updateBook } from '../services/bookStorage';
import { HapticService } from '../services/HapticService';

const SPRING_CONFIG = { damping: 16, stiffness: 260, mass: 0.8 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScalePressableProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  reducedMotion: boolean;
  children: React.ReactNode;
}

const ScalePressable: React.FC<ScalePressableProps> = ({
  onPress,
  style,
  accessibilityLabel,
  reducedMotion,
  children,
}) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!reducedMotion) {
      scale.value = withSpring(0.96, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    if (!reducedMotion) {
      scale.value = withSpring(1, SPRING_CONFIG);
    }
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};

export const BookDetailScreen = () => {
  const route = useRoute<BookDetailRouteProp>();
  const navigation = useNavigation<BibliotecaNavigationProp>();
  const initialBook: Book | undefined = route.params?.book;
  const bookId = initialBook?.id;
  const [book, setBook] = useState<Book | undefined>(initialBook);
  const notice = useNotice();
  const { colors, isDark } = useTheme();
  const globalStyles = getGlobalStyles(colors);
  const layout = useResponsiveLayout();
  const reducedMotion = Boolean(useReducedMotion());
  const [editingQuote, setEditingQuote] = useState(false);
  const [coverPreviewOpen, setCoverPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const scrollY = useSharedValue(0);
  const coverPressScale = useSharedValue(1);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerBackdropStyle = useAnimatedStyle(() => {
    const motion = computeBookDetailMotion(scrollY.value, reducedMotion);
    return {
      opacity: motion.backdropOpacity,
      transform: [
        { translateY: motion.headerTranslateY },
        { scale: motion.headerScale },
      ],
    };
  }, [reducedMotion]);

  const blurOverlayStyle = useAnimatedStyle(() => {
    const motion = computeBookDetailMotion(scrollY.value, reducedMotion);
    return {
      opacity: motion.blurOpacity,
    };
  }, [reducedMotion]);

  const coverAnimatedStyle = useAnimatedStyle(() => {
    const motion = computeBookDetailMotion(scrollY.value, reducedMotion);
    return {
      opacity: motion.coverOpacity,
      transform: [
        { translateY: motion.coverTranslateY },
        { scale: motion.coverScale * coverPressScale.value },
      ],
    };
  }, [reducedMotion]);

  const stickyBarBgStyle = useAnimatedStyle(() => {
    const motion = computeBookDetailMotion(scrollY.value, reducedMotion);
    return {
      opacity: motion.stickyBarOpacity,
    };
  }, [reducedMotion]);

  const stickyTitleStyle = useAnimatedStyle(() => {
    const motion = computeBookDetailMotion(scrollY.value, reducedMotion);
    return {
      opacity: motion.stickyBarOpacity,
      transform: [{ translateY: motion.stickyTitleTranslateY }],
    };
  }, [reducedMotion]);

  const sectionEntering = (delay: number) => (
    reducedMotion ? undefined : FadeInDown.delay(delay).duration(380).springify().damping(18)
  );

  useFocusEffect(
    useCallback(() => {
      if (!bookId) return;
      let active = true;
      const fetchBook = async () => {
        const books = await getAllBooks();
        if (!active) return;
        const updatedBook = books.find(b => b.id === bookId);
        if (updatedBook) {
          setBook(updatedBook);
          setImageError(false);
        }
      };
      fetchBook().catch(() => {
        if (active) {
          notice.alert(
            'No se puede actualizar la ficha',
            'Los datos guardados no se han modificado. Vuelve a abrir el libro desde la biblioteca para intentarlo de nuevo.',
            [{ text: 'Entendido' }],
            { variant: 'error' },
          );
        }
      });
      return () => { active = false; };
    }, [bookId])
  );

  const handleDelete = () => {
    if (!book) return;
    HapticService.error();
    notice.alert(
      'Eliminar libro',
      `«${book.title}» y sus notas se eliminarán de tu biblioteca. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBook(book.id);
              HapticService.success();
              navigation.goBack();
            } catch {
              notice.alert(
                'No se ha eliminado el libro',
                'Vuelve a intentarlo desde la biblioteca.',
                [{ text: 'Entendido' }],
                { variant: 'error' },
              );
            }
          },
        },
      ],
    );
  };

  const handleEditBook = () => {
    if (!book) return;
    HapticService.light();
    navigation.navigate('EditBook', { book });
  };

  const handleEditQuote = () => {
    HapticService.light();
    setEditingQuote(true);
  };

  const handleShare = async (mode: 'summary' | 'quote' = 'summary') => {
    if (!book) return;
    HapticService.light();
    try {
      await Share.share({
        title: book.title,
        message: buildBookShareMessage(book, mode),
      });
    } catch {
      notice.alert('No se pudo compartir', 'Vuelve a intentarlo en unos segundos.', [{ text: 'Entendido' }], { variant: 'error' });
    }
  };

  const handleStartReading = async () => {
    if (!book) return;
    HapticService.success();
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const updated = await updateBook(book.id, { status: 'reading', startDate: today, progress: 0 });
      setBook(updated);
      notice.success(`Empezaste «${book.title}»`);
    } catch {
      notice.alert('No se pudo actualizar el estado', 'Vuelve a intentarlo.', [{ text: 'Entendido' }], { variant: 'error' });
    }
  };

  const handleAdjustProgress = async (delta: number) => {
    if (!book) return;
    HapticService.light();
    const nextProgress = Math.max(0, Math.min(100, Math.round((book.progress ?? 0) + delta)));
    try {
      const updated = await updateBook(book.id, { progress: nextProgress });
      setBook(updated);
    } catch {
      notice.alert('No se pudo actualizar el progreso', 'Vuelve a intentarlo.', [{ text: 'Entendido' }], { variant: 'error' });
    }
  };

  const handleFinishReading = () => {
    if (!book) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    HapticService.light();
    navigation.navigate('EditBook', {
      book: {
        ...book,
        status: 'read',
        progress: 100,
        startDate: book.startDate || today,
        endDate: today,
        rating: book.rating ?? 'Bueno',
      },
    });
  };

  if (!book) return null;

  const status = getBookStatus(book);
  const readingProgress = Math.max(0, Math.min(100, Math.round(book.progress ?? 0)));
  const days = book.startDate && book.endDate ? calculateReadingDays(book.startDate, book.endDate) : 0;
  const durationLabel = formatReadingDuration(days);
  const hasCover = Boolean(book.coverUrl && !imageError);

  return (
    <View style={globalStyles.container}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.headerImageContainer, headerBackdropStyle]}>
          {hasCover ? (
            <Image
              source={{ uri: book.coverUrl }}
              style={styles.bgImage}
              blurRadius={Platform.OS === 'ios' ? 4 : 12}
            />
          ) : (
            <View style={[styles.bgImage, { backgroundColor: colors.accent }]} />
          )}
          <Animated.View style={[StyleSheet.absoluteFill, blurOverlayStyle]}>
            <BlurView
              intensity={isDark ? 45 : 65}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <View style={[styles.heroScrimMid, { backgroundColor: colors.cream, opacity: 0.45 }]} />
          <View style={[styles.heroScrimBottom, { backgroundColor: colors.cream }]} />
        </Animated.View>

        <View style={[styles.mainContent, layout.contentStyle]}>
          <Animated.View entering={sectionEntering(80)} style={[styles.coverOuter, coverAnimatedStyle]}>
            <Pressable
              accessibilityRole={hasCover ? 'button' : 'image'}
              accessibilityLabel={hasCover ? `Ver portada de ${book.title} a pantalla completa` : `Portada de ${book.title}`}
              disabled={!hasCover}
              onPressIn={() => {
                if (hasCover && !reducedMotion) {
                  coverPressScale.value = withSpring(0.96, SPRING_CONFIG);
                }
              }}
              onPressOut={() => {
                if (hasCover && !reducedMotion) {
                  coverPressScale.value = withSpring(1, SPRING_CONFIG);
                }
              }}
              onPress={() => {
                if (hasCover) {
                  HapticService.selection();
                  setCoverPreviewOpen(true);
                }
              }}
              style={[styles.coverWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
              {hasCover ? (
                <Image
                  source={{ uri: book.coverUrl }}
                  style={styles.detailCover}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <BookPlaceholder title={book.title} author={book.author} height={320} />
              )}
            </Pressable>
          </Animated.View>

          <Animated.View entering={sectionEntering(150)} style={styles.infoBox}>
            {book.genre ? (
              <Text style={[styles.genre, { color: colors.accent2 }]}>{book.genre.toUpperCase()}</Text>
            ) : null}
            <Text style={[styles.title, { color: colors.ink }]}>{book.title}</Text>
            {book.author ? (
              <Text style={[styles.author, { color: colors.ink2 }]}>{book.author}</Text>
            ) : null}

            <View style={styles.badgesContainer}>
              {book.rating ? <RatingBadge rating={book.rating} /> : null}
              {status === 'reading' ? (
                <View style={[styles.badge, { backgroundColor: colors.accentSoft, borderColor: colors.accent + '40' }]}>
                  <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color={colors.accent} />
                  <Text style={[styles.badgeText, { color: colors.accent }]}>{`Leyendo · ${readingProgress}%`}</Text>
                </View>
              ) : null}
              {status === 'wishlist' ? (
                <View style={[styles.badge, { backgroundColor: colors.gold + '20', borderColor: colors.gold + '45' }]}>
                  <MaterialCommunityIcons name="bookmark-outline" size={16} color={colors.gold} />
                  <Text style={[styles.badgeText, { color: colors.gold }]}>Pendiente</Text>
                </View>
              ) : null}
              {book.mood ? (
                <View style={[styles.badge, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <Text style={styles.moodEmoji}>{book.mood}</Text>
                </View>
              ) : null}
              {status === 'read' && days > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={colors.ink3} />
                  <Text style={[styles.badgeText, { color: colors.ink2 }]}>{durationLabel}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {status === 'reading' ? (
            <Animated.View
              entering={sectionEntering(200)}
              style={[styles.progressCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
              <View style={styles.progressHeader}>
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>PROGRESO ACTUAL</Text>
                <Text style={[styles.progressPct, { color: colors.accent }]}>{readingProgress}%</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${readingProgress}%`, backgroundColor: colors.accent }]} />
              </View>
              <View style={styles.progressActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Restar 10 por ciento de progreso"
                  onPress={() => handleAdjustProgress(-10)}
                  style={[styles.progressStepBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.progressStepText, { color: colors.ink }]}>-10%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Sumar 10 por ciento de progreso"
                  onPress={() => handleAdjustProgress(10)}
                  style={[styles.progressStepBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Text style={[styles.progressStepText, { color: colors.ink }]}>+10%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={handleFinishReading}
                  style={[styles.finishBtn, { backgroundColor: colors.accent }]}
                >
                  <MaterialCommunityIcons name="check" size={16} color={colors.onAccent} />
                  <Text style={[styles.finishBtnText, { color: colors.onAccent }]}>Terminar libro</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : null}

          {status === 'wishlist' ? (
            <Animated.View
              entering={sectionEntering(200)}
              style={[styles.progressCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
              <Text style={[styles.wishlistHint, { color: colors.ink2 }]}>
                Este libro está en tu lista de pendientes. Cuando lo abras, puedes pasarlo a «Leyendo ahora».
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleStartReading}
                style={[styles.finishBtn, { backgroundColor: colors.accent, alignSelf: 'stretch' }]}
              >
                <MaterialCommunityIcons name="book-open-variant" size={18} color={colors.onAccent} />
                <Text style={[styles.finishBtnText, { color: colors.onAccent }]}>Empezar a leer</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {(book.startDate || book.endDate) ? (
            <Animated.View
              entering={sectionEntering(220)}
              style={[styles.datesGrid, layout.rowStyle, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
              <View style={[styles.dateCol, layout.columnStyle]}>
                <Text style={[styles.dateLabel, { color: colors.ink3 }]}>INICIADO</Text>
                <Text style={[styles.dateValue, { color: colors.ink }]}>{book.startDate ? formatShortDate(book.startDate) : '—'}</Text>
              </View>
              <View
                style={[
                  styles.dateDivider,
                  layout.compact && { width: '100%', height: 1 },
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={[styles.dateCol, layout.columnStyle]}>
                <Text style={[styles.dateLabel, { color: colors.ink3 }]}>FINALIZADO</Text>
                <Text style={[styles.dateValue, { color: colors.ink }]}>{book.endDate ? formatShortDate(book.endDate) : 'En curso'}</Text>
              </View>
            </Animated.View>
          ) : null}

          {book.notes ? (
            <Animated.View entering={sectionEntering(290)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>Notas personales</Text>
              <View
                style={[
                  styles.notesBox,
                  { borderLeftColor: colors.gold, backgroundColor: colors.cardBg, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.notesText, { color: colors.ink2 }]}>{book.notes}</Text>
              </View>
            </Animated.View>
          ) : null}

          <Animated.View entering={sectionEntering(350)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>Cita favorita</Text>
              <View style={styles.sectionHeaderActions}>
                {book.quote ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Compartir cita favorita"
                    hitSlop={10}
                    onPress={() => handleShare('quote')}
                  >
                    <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.accent} />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={book.quote ? 'Editar cita favorita' : 'Añadir cita favorita'}
                  hitSlop={10}
                  onPress={handleEditQuote}
                >
                  <MaterialCommunityIcons name={book.quote ? 'pencil' : 'plus'} size={20} color={colors.accent2} />
                </TouchableOpacity>
              </View>
            </View>

            {book.quote ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Editar cita favorita"
                activeOpacity={0.85}
                onPress={handleEditQuote}
              >
                <QuoteBlock quote={book.quote} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Añadir cita favorita"
                style={[styles.addQuoteBtn, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
                onPress={handleEditQuote}
              >
                <Text style={[styles.addQuoteText, { color: colors.ink3 }]}>
                  Toca para añadir un fragmento inolvidable...
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          <Animated.View entering={sectionEntering(410)} style={styles.actions}>
            <ScalePressable
              accessibilityLabel={`Editar detalles de ${book.title}`}
              reducedMotion={reducedMotion}
              style={[styles.editBtn, { backgroundColor: colors.accent, ...theme.shadow.glow(colors.accent) }]}
              onPress={handleEditBook}
            >
              <MaterialCommunityIcons name="pencil" size={20} color={colors.onAccent} />
              <Text style={[styles.editBtnText, { color: colors.onAccent }]}>Editar detalles</Text>
            </ScalePressable>

            <ScalePressable
              accessibilityLabel={`Eliminar ${book.title}`}
              reducedMotion={reducedMotion}
              style={[styles.deleteBtn, { backgroundColor: colors.error + '15', borderColor: colors.error + '35' }]}
              onPress={handleDelete}
            >
              <MaterialCommunityIcons name="delete-outline" size={24} color={colors.error} />
            </ScalePressable>
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* Dynamic Sticky Header Bar */}
      <View style={styles.stickyHeader} pointerEvents="box-none">
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.stickyHeaderBg,
            { backgroundColor: colors.glass, borderBottomColor: colors.border },
            stickyBarBgStyle,
          ]}
        />

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver a la biblioteca"
          style={[styles.headerActionBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
          onPress={() => {
            HapticService.light();
            navigation.goBack();
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.ink} />
        </TouchableOpacity>

        <Animated.View pointerEvents="none" style={[styles.stickyTitleContainer, stickyTitleStyle]}>
          <Text style={[styles.stickyTitle, { color: colors.ink }]} numberOfLines={1}>
            {book.title}
          </Text>
          {book.author ? (
            <Text style={[styles.stickyAuthor, { color: colors.ink3 }]} numberOfLines={1}>
              {book.author}
            </Text>
          ) : null}
        </Animated.View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Compartir resumen del libro"
            style={[styles.headerActionBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
            onPress={() => handleShare('summary')}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Editar libro"
            style={[styles.headerActionBtn, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
            onPress={handleEditBook}
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {editingQuote ? (
        <TextEditModal
          title="Editar cita favorita"
          initialValue={book.quote || ''}
          onClose={() => setEditingQuote(false)}
          onSave={async value => {
            const updated = await updateBook(book.id, { quote: value });
            setBook(updated);
            HapticService.success();
          }}
        />
      ) : null}

      <Modal
        visible={coverPreviewOpen && hasCover}
        transparent
        animationType="none"
        onRequestClose={() => setCoverPreviewOpen(false)}
      >
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(220)}
          style={styles.previewBackdrop}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar vista de portada"
            style={StyleSheet.absoluteFill}
            onPress={() => setCoverPreviewOpen(false)}
          />
          <Animated.View
            entering={reducedMotion ? undefined : ZoomIn.duration(260).springify().damping(18)}
            style={styles.previewCard}
            pointerEvents="box-none"
          >
            {book.coverUrl ? (
              <Image
                source={{ uri: book.coverUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : null}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cerrar vista de portada"
              style={[styles.previewCloseBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              onPress={() => setCoverPreviewOpen(false)}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.ink} />
              <Text style={[styles.previewCloseText, { color: colors.ink }]}>Cerrar</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
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
    height: DETAIL_HEADER_HEIGHT,
    zIndex: -1,
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  heroScrimMid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 56,
    height: 96,
  },
  heroScrimBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  mainContent: {
    marginTop: 72,
    paddingHorizontal: theme.spacing.l,
  },
  coverOuter: {
    alignSelf: 'center',
  },
  coverWrapper: {
    width: 210,
    height: 320,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    ...theme.shadow.medium,
    elevation: 15,
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
    opacity: 0.85,
  },
  badgesContainer: {
    flexWrap: 'wrap',
    justifyContent: 'center',
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
    flexWrap: 'wrap',
    gap: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.s,
    ...theme.shadow.soft,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPct: {
    ...theme.typography.h3,
    fontWeight: '800',
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressStepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
  },
  progressStepText: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
  finishBtn: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.m,
  },
  finishBtnText: {
    ...theme.typography.caption,
    fontWeight: '700',
  },
  wishlistHint: {
    ...theme.typography.caption,
  },
  sectionTitle: {
    ...theme.typography.small,
    letterSpacing: 1,
  },
  notesBox: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
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
    minHeight: 56,
    padding: 12,
    borderRadius: theme.borderRadius.m,
    gap: 8,
    ...theme.shadow.soft,
  },
  editBtnText: {
    flexShrink: 1,
    ...theme.typography.body,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    paddingHorizontal: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 20,
  },
  stickyHeaderBg: {
    borderBottomWidth: 1,
  },
  headerActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  stickyTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyTitle: {
    ...theme.typography.body,
    fontWeight: '700',
    fontFamily: 'serif',
    fontSize: 15,
    lineHeight: 20,
  },
  stickyAuthor: {
    ...theme.typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 11, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.l,
  },
  previewCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  previewImage: {
    width: '100%',
    height: 480,
    borderRadius: theme.borderRadius.m,
  },
  previewCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
  },
  previewCloseText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
});
