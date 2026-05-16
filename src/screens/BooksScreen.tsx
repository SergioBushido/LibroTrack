import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import { Book, Rating } from '../types/Book';
import { getAllBooks, deleteBook, updateBook } from '../services/bookStorage';
import { sortBooksByEndDate } from '../utils/filters';
import { calculateStats } from '../services/statsService';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { BookCard } from '../components/BookCard';
import { EmptyState } from '../components/EmptyState';
import { fetchBookCoverUrl } from '../services/bookCoverService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuickStat } from '../components/QuickStat';
import { RatingBadge } from '../components/RatingBadge';
import { BookCardSkeleton, SkeletonLoader } from '../components/SkeletonLoader';
import { HapticService } from '../services/HapticService';
import { FadeInView } from '../components/FadeInView';

const GOAL_KEY = 'lecturas_reto_goal';

type FilterType = 'Todos' | Rating | string;

interface BookSection {
  title: string;
  data: Book[];
}

export const BooksScreen = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookSections, setBookSections] = useState<BookSection[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');
  const [streak, setStreak] = useState(0);
  const [updatingCovers, setUpdatingCovers] = useState(false);
  const [lastBook, setLastBook] = useState<Book | null>(null);
  const [goal, setGoal] = useState(20);
  
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { colors, isDark, toggleTheme } = useTheme();
  const globalStyles = getGlobalStyles(colors);

  const currentYear = new Date().getFullYear().toString();
  const nextYear = (new Date().getFullYear() + 1).toString();

  const FILTER_OPTIONS: FilterType[] = [
    'Todos', 'Muy bueno', 'Bueno', 'Regular', 'Malo', currentYear, nextYear
  ];

  const groupBooksByYear = (books: Book[]): BookSection[] => {
    const grouped: { [year: string]: Book[] } = {};
    
    books.forEach(book => {
      const year = book.endDate.split('-')[0];
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(book);
    });

    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    
    return sortedYears.map(year => ({
      title: year,
      data: grouped[year].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    }));
  };

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    const allBooks = await getAllBooks();
    const sortedBooks = sortBooksByEndDate(allBooks, false);
    setBooks(sortedBooks);
    
    const savedGoal = await AsyncStorage.getItem(GOAL_KEY);
    const currentGoal = savedGoal ? parseInt(savedGoal, 10) : 20;
    setGoal(currentGoal);

    const stats = calculateStats(allBooks, currentGoal);
    setStreak(stats.readingStreak);
    
    if (sortedBooks.length > 0) {
      setLastBook(sortedBooks[0]);
    }

    applyFilters(sortedBooks, query, activeFilter);
    if (!silent) {
      setTimeout(() => setLoading(false), 500); // Artificial delay for smoother transition
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData(books.length > 0);
    }, [books.length])
  );

  const applyFilters = (sourceBooks: Book[], searchQuery: string, filter: FilterType) => {
    let result = sourceBooks;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(book => 
        book.title.toLowerCase().includes(q) ||
        (book.author && book.author.toLowerCase().includes(q)) ||
        (book.notes && book.notes.toLowerCase().includes(q))
      );
    }

    if (filter !== 'Todos') {
      if (['Muy bueno', 'Bueno', 'Regular', 'Malo'].includes(filter as string)) {
        result = result.filter(book => book.rating === filter);
      } else if (filter === currentYear || filter === nextYear) {
        result = result.filter(book => book.endDate.startsWith(filter as string));
      }
    }

    const sections = groupBooksByYear(result);
    setBookSections(sections);
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    applyFilters(books, text, activeFilter);
  };

  const handleFilterPress = (filter: FilterType) => {
    HapticService.selection();
    setActiveFilter(filter);
    applyFilters(books, query, filter);
  };

  const handleDelete = (id: string) => {
    HapticService.error();
    Alert.alert(
      "Eliminar libro",
      "¿Estás seguro de que quieres eliminar este libro de tu biblioteca?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            await deleteBook(id);
            HapticService.success();
            loadData(true);
          }
        }
      ]
    );
  };

  const handleFetchMissingCovers = async () => {
    HapticService.light();
    setUpdatingCovers(true);
    try {
      const allBooks = await getAllBooks();
      const missingCoverBooks = allBooks.filter(book => !book.coverUrl);
      let updatedCount = 0;

      for (const book of missingCoverBooks) {
        const coverUrl = await fetchBookCoverUrl(book.title, book.author ?? '');
        if (coverUrl) {
          await updateBook(book.id, { coverUrl });
          updatedCount += 1;
        }
      }

      await loadData(true);
      HapticService.success();
      Alert.alert(
        'Portadas actualizadas',
        `Se han encontrado ${updatedCount} nuevas portadas de ${missingCoverBooks.length} libros sin imágenes.`
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudieron actualizar las portadas.');
    } finally {
      setUpdatingCovers(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.ink3 }]}>Mis lecturas</Text>
          <View style={styles.titleWithBadge}>
            <Text style={[styles.title, { color: colors.ink }]}>LibroTrack</Text>
            <View style={[styles.totalBadge, { backgroundColor: colors.accent + '20' }]}>
              <Text style={[styles.totalBadgeText, { color: colors.accent }]}>{books.length}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => { HapticService.light(); toggleTheme(); }} 
          style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
        >
          <MaterialCommunityIcons name={isDark ? "weather-sunny" : "weather-night"} size={22} color={colors.ink} />
        </TouchableOpacity>
      </View>
      
      {!selectedYear && lastBook && query === '' && activeFilter === 'Todos' && (
        <FadeInView delay={200}>
          <TouchableOpacity 
            activeOpacity={0.9}
            style={[styles.heroCard, { backgroundColor: colors.ink }]}
            onPress={() => { HapticService.light(); navigation.navigate('BookDetail', { id: lastBook.id, book: lastBook }); }}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroInfo}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>ÚLTIMA LECTURA</Text>
                </View>
                <Text style={[styles.heroTitle, { color: colors.cream }]} numberOfLines={2}>{lastBook.title}</Text>
                <Text style={[styles.heroAuthor, { color: 'rgba(247,244,239,0.7)' }]}>{lastBook.author}</Text>
                <View style={styles.heroFooter}>
                   <RatingBadge rating={lastBook.rating} mini />
                   <View style={styles.heroDots}>
                     <View style={[styles.dot, { backgroundColor: colors.gold }]} />
                     <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                     <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                   </View>
                </View>
              </View>
              <View style={styles.heroCoverContainer}>
                {lastBook.coverUrl ? (
                  <Image source={{ uri: lastBook.coverUrl }} style={styles.heroCover} resizeMode="cover" />
                ) : (
                  <View style={[styles.heroCover, { backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }]}>
                    <MaterialCommunityIcons name="book-open-variant" size={30} color={colors.cream} />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </FadeInView>
      )}

      {!selectedYear && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsBar}>
          <QuickStat 
            label="Racha" 
            value={`${streak} ${streak === 1 ? 'libro' : 'libros'}`} 
            icon="fire" 
            color="#FF8A65" 
          />
          <QuickStat 
            label={`Meta ${currentYear}`} 
            value={`${books.filter(b => b.endDate.startsWith(currentYear)).length}/${goal}`} 
            icon="trophy-outline" 
            color={colors.gold} 
          />
          <QuickStat 
            label="Total" 
            value={books.length} 
            icon="library-shelves" 
            color={colors.blue} 
          />
        </ScrollView>
      )}

      <View style={[styles.searchContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.ink3} />
        <TextInput
          style={[styles.searchInput, { color: colors.ink }]}
          placeholder="Busca en tu biblioteca..."
          value={query}
          onChangeText={handleSearch}
          placeholderTextColor={colors.ink3}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { HapticService.light(); handleSearch(''); }}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.ink3} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {FILTER_OPTIONS.map(filter => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              activeOpacity={0.7}
              style={[
                styles.filterChip, 
                { 
                  backgroundColor: isActive ? colors.ink : colors.cardBg, 
                  borderColor: isActive ? colors.ink : colors.border 
                }
              ]}
              onPress={() => handleFilterPress(filter)}
            >
              <Text style={[
                styles.filterText, 
                { color: isActive ? colors.cream : colors.ink2, fontWeight: isActive ? '700' : '500' }
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={globalStyles.container}>
        <ScrollView contentContainerStyle={styles.listContent}>
          <View style={styles.header}>
            <SkeletonLoader width={150} height={40} style={{ marginBottom: 20 }} />
            <SkeletonLoader width="100%" height={160} borderRadius={20} style={{ marginBottom: 20 }} />
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <SkeletonLoader width={100} height={50} borderRadius={10} />
              <SkeletonLoader width={100} height={50} borderRadius={10} />
              <SkeletonLoader width={100} height={50} borderRadius={10} />
            </View>
          </View>
          <BookCardSkeleton />
          <BookCardSkeleton />
        </ScrollView>
      </View>
    );
  }

  const handleYearSelect = (year: string) => {
    HapticService.light();
    setSelectedYear(year);
  };

  const handleBackToYears = () => {
    HapticService.light();
    setSelectedYear(null);
  };

  const selectedSection = selectedYear ? bookSections.find(section => section.title === selectedYear) : null;

  return (
    <View style={globalStyles.container}>
      <ScrollView 
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}

        {selectedYear ? (
          <FadeInView delay={0}>
            <View style={styles.yearDetailHeader}>
              <TouchableOpacity onPress={handleBackToYears} style={[styles.backYearBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}> 
                <MaterialCommunityIcons name="arrow-left" size={20} color={colors.ink} />
                <Text style={[styles.backYearText, { color: colors.ink }]}>Volver</Text>
              </TouchableOpacity>
              <Text style={[styles.detailTitle, { color: colors.ink }]}>{selectedYear}</Text>
            </View>
            
            {selectedSection && selectedSection.data.length > 0 ? (
              selectedSection.data.map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={index}
                  onPress={() => navigation.navigate('BookDetail', { id: book.id, book })}
                  onEdit={() => navigation.navigate('EditBook', { book })}
                  onDelete={() => handleDelete(book.id)}
                />
              ))
            ) : (
              <EmptyState
                icon="book-open-blank-variant"
                title="No hay libros"
                subtitle="No hay lecturas registradas para este filtro."
              />
            )}
          </FadeInView>
        ) : (
          <View style={styles.yearGrid}>
            <Text style={[styles.sectionLabel, { color: colors.ink3 }]}>HISTORIAL POR AÑOS</Text>
            {bookSections.map((section, index) => (
              <FadeInView key={section.title} delay={index * 100}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.yearCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                  onPress={() => handleYearSelect(section.title)}
                >
                  <View style={styles.yearCardLeft}>
                    <Text style={[styles.yearTitle, { color: colors.ink }]}>{section.title}</Text>
                    <Text style={[styles.yearCount, { color: colors.accent2 }]}>
                      {section.data.length} {section.data.length === 1 ? 'libro' : 'libros'}
                    </Text>
                  </View>
                  <View style={[styles.yearIcon, { backgroundColor: colors.cream }]}>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.ink} />
                  </View>
                </TouchableOpacity>
              </FadeInView>
            ))}
            
            <TouchableOpacity
              style={[styles.coverButton, { borderColor: colors.border, borderWidth: 1 }]}
              onPress={handleFetchMissingCovers}
              disabled={updatingCovers}
            >
              <Text style={[styles.coverButtonText, { color: colors.ink3 }]}> 
                <MaterialCommunityIcons name="image-sync" size={14} /> 
                {updatingCovers ? ' ACTUALIZANDO...' : ' SINCRONIZAR PORTADAS'} 
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: theme.spacing.m,
    paddingBottom: 120,
  },
  header: {
    marginBottom: theme.spacing.m,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  title: {
    ...theme.typography.h1,
  },
  welcomeText: {
    ...theme.typography.small,
    marginBottom: 4,
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...theme.shadow.soft,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
    ...theme.typography.small,
    fontSize: 12,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    overflow: 'hidden',
    ...theme.shadow.medium,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
    paddingRight: theme.spacing.m,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    ...theme.typography.h2,
    fontSize: 22,
    lineHeight: 28,
  },
  heroAuthor: {
    ...theme.typography.body,
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  heroDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroCoverContainer: {
    ...theme.shadow.medium,
  },
  heroCover: {
    width: 90,
    height: 135,
    borderRadius: theme.borderRadius.s,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsBar: {
    marginBottom: theme.spacing.l,
    marginHorizontal: -theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    height: 52,
    borderWidth: 1,
    marginBottom: theme.spacing.m,
    ...theme.shadow.soft,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.s,
    ...theme.typography.body,
    fontSize: 15,
  },
  filtersScroll: {
    flexDirection: 'row',
    marginBottom: theme.spacing.m,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    marginRight: 10,
    ...theme.shadow.soft,
  },
  filterText: {
    ...theme.typography.caption,
    fontSize: 13,
  },
  sectionLabel: {
    ...theme.typography.small,
    fontSize: 10,
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.m,
  },
  yearGrid: {
    gap: 12,
  },
  yearCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    ...theme.shadow.soft,
  },
  yearCardLeft: {
    flex: 1,
  },
  yearTitle: {
    ...theme.typography.h2,
    fontSize: 28,
  },
  yearCount: {
    ...theme.typography.body,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  yearIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    gap: 16,
  },
  backYearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  backYearText: {
    ...theme.typography.small,
    fontSize: 11,
  },
  detailTitle: {
    ...theme.typography.h2,
  },
  coverButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.m,
  },
  coverButtonText: {
    ...theme.typography.small,
    fontSize: 10,
  }
});
