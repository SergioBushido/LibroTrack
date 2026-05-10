import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Book, Rating } from '../types/Book';
import { getAllBooks, deleteBook, updateBook } from '../services/bookStorage';
import { sortBooksByEndDate } from '../utils/filters';
import { calculateStats } from '../services/statsService';
import { theme, getGlobalStyles } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { BookCard } from '../components/BookCard';
import { EmptyState } from '../components/EmptyState';
import { fetchBookCoverUrl } from '../services/bookCoverService';
import { Alert, ImageBackground, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuickStat } from '../components/QuickStat';

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

    // Sort years descending
    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    
    return sortedYears.map(year => ({
      title: year,
      data: grouped[year].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    }));
  };

  const loadData = async () => {
    setLoading(true);
    const allBooks = await getAllBooks();
    const sortedBooks = sortBooksByEndDate(allBooks, false);
    setBooks(sortedBooks);
    
    // Calcular racha
    const savedGoal = await AsyncStorage.getItem(GOAL_KEY);
    const currentGoal = savedGoal ? parseInt(savedGoal, 10) : 20;
    setGoal(currentGoal);

    const stats = calculateStats(allBooks, currentGoal);
    setStreak(stats.readingStreak);
    
    if (sortedBooks.length > 0) {
      setLastBook(sortedBooks[0]);
    }

    applyFilters(sortedBooks, query, activeFilter);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
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
    setActiveFilter(filter);
    applyFilters(books, query, filter);
  };

  const handleDelete = (id: string) => {
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
            loadData();
          }
        }
      ]
    );
  };

  const handleFetchMissingCovers = async () => {
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

      await loadData();
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
          <Text style={[styles.welcomeText, { color: colors.ink3 }]}>Hola de nuevo,</Text>
          <Text style={[styles.title, { color: colors.ink }]}>Mi Biblioteca</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <MaterialCommunityIcons name={isDark ? "weather-sunny" : "weather-night"} size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>
      
      {/* Hero Section: Última Lectura */}
      {!selectedYear && lastBook && query === '' && activeFilter === 'Todos' && (
        <TouchableOpacity 
          style={[styles.heroCard, { backgroundColor: colors.ink }]}
          onPress={() => navigation.navigate('BookDetail', { id: lastBook.id, book: lastBook })}
        >
          {lastBook.coverUrl ? (
            <Image source={{ uri: lastBook.coverUrl }} style={styles.heroCover} resizeMode="contain" />
          ) : (
            <View style={[styles.heroCover, { backgroundColor: colors.ink2, justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons name="book-open-variant" size={40} color={colors.cream} />
            </View>
          )}
          <View style={styles.heroInfo}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>ÚLTIMA LECTURA</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.cream }]} numberOfLines={2}>{lastBook.title}</Text>
            <Text style={[styles.heroAuthor, { color: 'rgba(247,244,239,0.7)' }]}>{lastBook.author}</Text>
            <View style={styles.heroRating}>
              <MaterialCommunityIcons name="star" size={16} color={colors.gold} />
              <Text style={[styles.heroRatingText, { color: colors.gold }]}>{lastBook.rating}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Stats Bar */}
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
          placeholder="Busca un título, autor..."
          value={query}
          onChangeText={handleSearch}
          placeholderTextColor={colors.ink3}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
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
                { color: isActive ? colors.cream : colors.ink2, fontWeight: isActive ? '600' : 'normal' }
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.coverButton, { backgroundColor: updatingCovers ? colors.border : 'transparent', borderColor: colors.accent, borderWidth: 1 }]}
        onPress={handleFetchMissingCovers}
        disabled={updatingCovers}
      >
        <Text style={[styles.coverButtonText, { color: colors.accent }]}> 
          <MaterialCommunityIcons name="image-search-outline" size={16} /> {updatingCovers ? 'Buscando portadas...' : 'Actualizar portadas'} 
        </Text>
      </TouchableOpacity>
    </View>
  );

  const selectedSection = selectedYear ? bookSections.find(section => section.title === selectedYear) : null;

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
  };

  const handleBackToYears = () => setSelectedYear(null);

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <ScrollView contentContainerStyle={styles.listContent}>
        {renderHeader()}

        {selectedYear ? (
          <View style={styles.yearDetailHeader}>
            <TouchableOpacity onPress={handleBackToYears} style={[styles.backYearBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}> 
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.ink} />
              <Text style={[styles.backYearText, { color: colors.ink }]}>Volver a años</Text>
            </TouchableOpacity>
            <Text style={[styles.detailTitle, { color: colors.ink }]}>Libros leídos en {selectedYear}</Text>
          </View>
        ) : (
          <Text style={[styles.sectionLabel, { color: colors.ink }]}>
            Selecciona un año para explorar
          </Text>
        )}

        {selectedYear ? (
          selectedSection && selectedSection.data.length > 0 ? (
            selectedSection.data.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onPress={() => navigation.navigate('BookDetail', { id: book.id, book })}
                onEdit={() => navigation.navigate('EditBook', { book })}
                onDelete={() => handleDelete(book.id)}
              />
            ))
          ) : (
            <EmptyState
              icon="book-open-blank-variant"
              title="No se encontraron libros"
              subtitle="Cambia los filtros o vuelve a seleccionar otro año."
            />
          )
        ) : (
          <View style={styles.yearGrid}>
            {bookSections.map((section, index) => (
              <TouchableOpacity
                key={section.title}
                style={[
                  styles.yearCard, 
                  { 
                    backgroundColor: colors.cardBg, 
                    borderColor: colors.border,
                    marginTop: index === 0 ? 0 : 0 
                  }
                ]}
                onPress={() => handleYearSelect(section.title)}
              >
                <View style={styles.yearCardHeader}>
                  <Text style={[styles.yearTitle, { color: colors.ink }]}>{section.title}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.ink3} />
                </View>
                <Text style={[styles.yearCount, { color: colors.accent2 }]}>
                  {section.data.length} {section.data.length === 1 ? 'libro leído' : 'libros leídos'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.m,
    paddingBottom: 120, // Espacio para el Tab Bar flotante
  },
  header: {
    marginBottom: theme.spacing.m,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  title: {
    ...theme.typography.h1,
    fontSize: 32,
  },
  welcomeText: {
    ...theme.typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  subtitle: {
    ...theme.typography.caption,
  },
  themeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  heroCard: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    overflow: 'hidden',
    ...theme.shadow,
    elevation: 8,
  },
  heroCover: {
    width: 100,
    height: 150,
    borderRadius: theme.borderRadius.m,
  },
  heroInfo: {
    flex: 1,
    marginLeft: theme.spacing.l,
    justifyContent: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.s,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.s,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    ...theme.typography.h2,
    fontWeight: '700',
    lineHeight: 28,
  },
  heroAuthor: {
    ...theme.typography.body,
    marginTop: 4,
  },
  heroRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.m,
    gap: 4,
  },
  heroRatingText: {
    fontWeight: '700',
    fontSize: 14,
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
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.s,
    ...theme.typography.body,
  },
  filtersScroll: {
    flexDirection: 'row',
    marginBottom: theme.spacing.m,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    marginRight: theme.spacing.s,
  },
  filterText: {
    ...theme.typography.caption,
  },
  yearGrid: {
    gap: theme.spacing.m,
  },
  yearCard: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.l,
    ...theme.shadow,
    elevation: 2,
  },
  yearCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yearTitle: {
    ...theme.typography.h1,
    fontWeight: '800',
  },
  yearCount: {
    ...theme.typography.body,
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  coverButton: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: theme.borderRadius.round,
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  coverButtonText: {
    ...theme.typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
