import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Book, Rating } from '../types/Book';
import { getAllBooks, searchBooks, deleteBook } from '../services/bookStorage';
import { sortBooksByEndDate } from '../utils/filters';
import { calculateStats } from '../services/statsService';
import { theme, globalStyles } from '../constants/theme';
import { BookCard } from '../components/BookCard';
import { EmptyState } from '../components/EmptyState';
import { Alert } from 'react-native';

type FilterType = 'Todos' | Rating | string;

export const BooksScreen = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');
  const [streak, setStreak] = useState(0);
  
  const navigation = useNavigation<StackNavigationProp<any>>();

  const currentYear = new Date().getFullYear().toString();
  const nextYear = (new Date().getFullYear() + 1).toString();

  const FILTER_OPTIONS: FilterType[] = [
    'Todos', 'Muy bueno', 'Bueno', 'Regular', 'Malo', currentYear, nextYear
  ];

  const loadData = async () => {
    setLoading(true);
    const allBooks = await getAllBooks();
    const sortedBooks = sortBooksByEndDate(allBooks, false);
    setBooks(sortedBooks);
    
    // Calcular racha
    const stats = calculateStats(allBooks, 20);
    setStreak(stats.readingStreak);
    
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

    setFilteredBooks(result);
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

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Mi Biblioteca</Text>
      <Text style={styles.subtitle}>{books.length} libros leídos</Text>
      
      {streak > 0 && (
        <View style={styles.streakPill}>
          <MaterialCommunityIcons name="fire" size={16} color={theme.colors.accent2} />
          <Text style={styles.streakText}>Racha activa: {streak} {streak === 1 ? 'libro' : 'libros'} este mes</Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.ink3} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título, autor, notas..."
          value={query}
          onChangeText={handleSearch}
          placeholderTextColor={theme.colors.ink3}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.ink3} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {FILTER_OPTIONS.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => handleFilterPress(filter)}
          >
            <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={[globalStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={filteredBooks}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <BookCard 
            book={item} 
            onPress={() => navigation.navigate('BookDetail', { id: item.id, book: item })}
            onEdit={() => navigation.navigate('EditBook', { book: item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState 
            icon="book-open-blank-variant" 
            title="No se encontraron libros" 
            subtitle={query || activeFilter !== 'Todos' ? "Prueba a cambiar los filtros o la búsqueda." : "Añade tu primer libro usando el botón +"} 
          />
        }
      />
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
  },
  header: {
    marginBottom: theme.spacing.m,
  },
  title: {
    ...theme.typography.h1,
  },
  subtitle: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.m,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E5',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.round,
    marginBottom: theme.spacing.m,
    gap: theme.spacing.xs,
  },
  streakText: {
    ...theme.typography.small,
    color: theme.colors.accent2,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.m,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.s,
    ...theme.typography.body,
  },
  filtersScroll: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.s,
    backgroundColor: theme.colors.cardBg,
  },
  filterChipActive: {
    backgroundColor: theme.colors.ink,
    borderColor: theme.colors.ink,
  },
  filterText: {
    ...theme.typography.caption,
  },
  filterTextActive: {
    color: theme.colors.cream,
    fontWeight: '600',
  }
});
